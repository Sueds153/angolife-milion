import { createClient } from "npm:@supabase/supabase-js@2";
import * as cheerio from "npm:cheerio@1.0.0";
import {
  cleanText,
  fetchSoup,
  makeSummary,
  mapWithConcurrency,
  normalizeUrl,
  sleep,
} from "../_shared/scraper_utils.ts";

function isJunkTitle(value: string): boolean {
  const t = cleanText(value);
  if (!t || t.length < 5) return true;
  const s = t.toLowerCase();
  if (/(página inicial|pagina inicial|não encontrado|nao encontrado|error 404)/.test(s)) return true;
  if (/^(home|início|inicio|notícias|noticias|últimas|ultimas|404)$/.test(s)) return true;
  return /^(.+)\s*[-–—|·:]\s*(página inicial|pagina inicial|home|início|inicio)$/i.test(t);
}

// ─────────────────────────────────────────────
// LIMITES DE EXECUÇÃO (Edge Function free: 150s wall / 2s CPU)
// ─────────────────────────────────────────────
const MAX_PER_SITE = 2;
const DETAIL_CONCURRENCY = 2;
const DETAIL_DELAY_MS = 400;
const DEADLINE_MS = 115_000;

const startTime = Date.now();
const stats = { processed: 0, saved: 0, skipped: 0, errors: 0 };

function expired(): boolean {
  return Date.now() - startTime > DEADLINE_MS;
}

const RESOLVEAO_PLACEHOLDER = "https://resolve.ao.vercel.app/og-image.jpg";

// ─────────────────────────────────────────────
// INTELIGÊNCIA: categorização e prioridade
// ─────────────────────────────────────────────
const PRIORITY_KEYWORDS = [
  "Última Hora", "Urgente", "Flash", "BNA", "Kwanza",
  "Breaking", "Alerta", "Atenção", "Mandato", "Crise",
];
const OPPORTUNITY_KEYWORDS = [
  "Concurso", "Estado", "Admissão", "Bolsa", "Recrutamento",
  "Vaga", "Emprego", "Estágio", "Candidatura",
];
const ECONOMY_KEYWORDS = [
  "Kwanza", "BNA", "Câmbio", "Inflação", "Bancos", "Petróleo",
  "PIB", "FMI", "Economia", "Mercado", "Dívida", "Crescimento",
];
const CULTURE_KEYWORDS = [
  "Cultura", "Arte", "Música", "Festival", "Cinema", "Literatura",
  "Futebol", "Sport", "Desporto", "Entretenimento",
];

interface SiteConfig {
  base_url: string;
  list_url: string;
  article_selector: string;
  title_selector: string;
  link_selector: string;
  fixed_category: string;
  extra_headers?: Record<string, string>;
  verify_ssl?: boolean;
}

const SITES_CONFIG: Record<string, SiteConfig> = {
  "Expansão": {
    base_url: "https://www.expansao.co.ao",
    list_url: "https://www.expansao.co.ao/economia/ultimas.html",
    article_selector: ".t-am, article, .detalhe",
    title_selector: ".t-am-title, .t-am-overlay-i, h3, h2",
    link_selector: "a",
    fixed_category: "Economia",
  },
  "Jornal de Angola": {
    base_url: "https://www.jornaldeangola.ao",
    list_url: "https://www.jornaldeangola.ao/ao/noticias/",
    article_selector: "article, .td-module-container, .td-block-span12, .entry-title",
    title_selector: "h1, h2, h3, .entry-title, a",
    link_selector: "a",
    fixed_category: "Angola",
    extra_headers: {
      "Referer": "https://www.google.com/",
      "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
    },
  },
  "TPA": {
    base_url: "https://tpaonline.ao",
    list_url: "https://tpaonline.ao/category/noticias/",
    article_selector: "article, .post, .entry, a[href*='/detalhe/']",
    title_selector: "h2, h3, .title",
    link_selector: "a",
    fixed_category: "Oficial",
  },
  "TV Girassol": {
    base_url: "https://www.giranoticias.com",
    list_url: "https://www.giranoticias.com/",
    article_selector: "article, .post, .card, .noticia, .jeg_post",
    title_selector: "h2, h3, .jeg_post_title",
    link_selector: "a",
    fixed_category: "Oficial",
  },
  "ANGOP": {
    base_url: "https://www.angop.ao",
    list_url: "https://www.angop.ao/angola/pt_pt/noticias/",
    article_selector: "article, .news-item, .item, a[href*='/noticias/'], .jeg_post",
    title_selector: "h1, h2, h3, .title",
    link_selector: "a",
    fixed_category: "Angola",
    extra_headers: {
      "Accept-Encoding": "gzip, deflate",
      "Referer": "https://www.google.com/",
      "Sec-Fetch-Mode": "navigate",
      "Accept-Language": "pt-PT,pt;q=0.9",
      "Sec-Fetch-Site": "cross-site",
    },
  },
  "Novo Jornal": {
    base_url: "https://www.novojornal.co.ao",
    list_url: "https://www.novojornal.co.ao/sociedade/",
    article_selector: "article, .td-module-container, .jeg_post",
    title_selector: "h1, h2, h3, .td-module-title, .jeg_post_title",
    link_selector: "a",
    fixed_category: "Investigação",
  },
  "NovaGazeta": {
    base_url: "https://novagazeta.co.ao",
    list_url: "https://novagazeta.co.ao/category/noticias/",
    article_selector: "article, .post, .news-item",
    title_selector: "h1, h2, h3, .entry-title, .post-title",
    link_selector: "a",
    fixed_category: "Utilidade",
  },
  "Xé Angola": {
    base_url: "https://xaa.ao",
    list_url: "https://xaa.ao/category/noticias/",
    article_selector: ".post, article, .jeg_post",
    title_selector: "h3, h2, .entry-title, .jeg_post_title",
    link_selector: "a",
    fixed_category: "Sociedade",
  },
  "Angonotícias": {
    base_url: "https://www.angonoticias.com",
    list_url: "https://www.angonoticias.com/Artigos/canal/2/generalista",
    article_selector: "a[href*='/Artigos/item/'], article h3",
    title_selector: ".",
    link_selector: ".",
    fixed_category: "Angola",
  },
  "PlatinaLine": {
    base_url: "https://platinaline.com",
    list_url: "https://platinaline.com/category/noticias/",
    article_selector: "article, .l-post, .post-meta",
    title_selector: "h1, h2, h3, h4, .post-title, a",
    link_selector: "a",
    fixed_category: "Geral",
    extra_headers: {
      "Referer": "https://www.google.com/",
      "Upgrade-Insecure-Requests": "1",
    },
  },
};

// ─────────────────────────────────────────────
// CLASSIFICAÇÃO
// ─────────────────────────────────────────────
function classify(title: string, fixedCategory: string): { categoria: string; is_priority: boolean } {
  const t = title.toLowerCase();
  const is_priority = PRIORITY_KEYWORDS.some((kw) => t.includes(kw.toLowerCase()));
  if (OPPORTUNITY_KEYWORDS.some((kw) => t.includes(kw.toLowerCase()))) {
    return { categoria: "Oportunidades", is_priority };
  }
  if (ECONOMY_KEYWORDS.some((kw) => t.includes(kw.toLowerCase()))) {
    return { categoria: "Economia", is_priority };
  }
  if (CULTURE_KEYWORDS.some((kw) => t.includes(kw.toLowerCase()))) {
    return { categoria: "Cultura", is_priority };
  }
  return { categoria: fixedCategory, is_priority };
}

function extractImage($: cheerio.CheerioAPI, baseUrl: string): string {
  const og = $('meta[property="og:image"]').first().attr("content");
  if (og) return og;

  let contentArea = $("article, main, .content, .post-content, .entry-content").first();
  if (contentArea.length > 0) {
    const img = contentArea.find("img").first();
    const src = img.attr("src") ?? img.attr("data-src") ?? img.attr("data-lazy-src");
    if (src) return normalizeUrl(src, baseUrl);
  } else {
    const img = $("img").first();
    const src = img.attr("src") ?? img.attr("data-src") ?? img.attr("data-lazy-src");
    if (src) return normalizeUrl(src, baseUrl);
  }

  return RESOLVEAO_PLACEHOLDER;
}

// ─────────────────────────────────────────────
// DEDUPLICAÇÃO
// ─────────────────────────────────────────────
async function isDuplicate(url: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("news_articles")
    .select("id")
    .eq("url_origem", url)
    .limit(1);
  if (error) {
    console.error(`Erro dedup notícia ${url}: ${error.message}`);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

// ─────────────────────────────────────────────
// SCRAPER POR FONTE
// ─────────────────────────────────────────────
async function scrapeSite(siteName: string, cfg: SiteConfig): Promise<void> {
  if (expired()) {
    console.warn(`⏰ Deadline atingido — a saltar ${siteName}`);
    return;
  }
  console.log(`🌐 SITE: ${siteName} | ${cfg.list_url}`);

  try {
    const $ = await fetchSoup(cfg.list_url, cfg.extra_headers ?? {}, 25000);
    if (!$) {
      stats.errors++;
      return;
    }

    let articles = $(cfg.article_selector).toArray();
    if (articles.length === 0) {
      console.warn(`  ⚠️ Nenhum artigo em ${siteName}. Seletor: '${cfg.article_selector}'`);
      stats.errors++;
      return;
    }
    console.log(`  📋 ${articles.length} artigos encontrados`);

    const limited = articles.slice(0, MAX_PER_SITE);
    await mapWithConcurrency(limited, DETAIL_CONCURRENCY, async (el) => {
      if (expired()) return;
      stats.processed++;
      await processArticle($(el), siteName, cfg);
    });
  } catch (err) {
    console.error(`❌ SITE FALHADO: ${siteName} | ${String(err)}`);
    stats.errors++;
  }
}

async function processArticle(
  art: cheerio.Cheerio<cheerio.AnyNode>,
  siteName: string,
  cfg: SiteConfig,
): Promise<void> {
  try {
    let rawUrl = "";
    if (cfg.link_selector === ".") {
      rawUrl = art.attr("href") ?? "";
    } else {
      const linkEl = art.find(cfg.link_selector).first();
      rawUrl = linkEl.attr("href") ?? "";
    }
    if (!rawUrl && art.is("a")) rawUrl = art.attr("href") ?? "";

    const articleUrl = normalizeUrl(rawUrl, cfg.base_url);
    if (!articleUrl || articleUrl === cfg.base_url || articleUrl === cfg.list_url) return;

    if (await isDuplicate(articleUrl)) {
      console.log(`  ⏭️ Já existe: ${articleUrl.slice(0, 70)}`);
      stats.skipped++;
      return;
    }

    let title = "";
    if (cfg.title_selector === ".") {
      title = cleanText(art.text());
    } else {
      const titleEl = art.find(cfg.title_selector).first();
      title = cleanText(titleEl.text());
    }
    if (isJunkTitle(title)) title = cleanText(art.text());
    if (isJunkTitle(title)) return;

    console.log(`  ✨ Capturando: ${title.slice(0, 65)}...`);

    await sleep(DETAIL_DELAY_MS);
    const detail = await fetchSoup(articleUrl, cfg.extra_headers ?? {}, 20000);
    if (!detail) return;

    const detailTitleEl = detail("h1, .entry-title, .article-title").first();
    const detailTitle = cleanText(detailTitleEl.text());
    const finalTitle = !isJunkTitle(detailTitle) ? detailTitle : title;

    const imageUrl = extractImage(detail, cfg.base_url);

    let bodyArea = detail("article, .entry-content, .post-content, .content-body, .article-content, .td-post-content, main").first();
    let bodyHtml = "";
    let bodyText = "";
    if (bodyArea.length > 0) {
      const clone = bodyArea.clone();
      clone("script, style, iframe, ins, nav, footer, aside, form, noscript").remove();
      bodyHtml = clone.html() ?? "";
      bodyText = clone.text();
    } else {
      bodyText = detail.text();
    }
    const summary = makeSummary(bodyText, 220);

    const { categoria, is_priority } = classify(finalTitle, cfg.fixed_category);

    const payload = {
      titulo: finalTitle.slice(0, 500),
      resumo: (summary || "").slice(0, 1000),
      corpo: (bodyHtml || "").slice(0, 50000),
      imagem_url: imageUrl || RESOLVEAO_PLACEHOLDER,
      categoria: categoria || "Geral",
      fonte: siteName,
      url_origem: articleUrl,
      is_priority: Boolean(is_priority),
      status: "pendente",
    };

    const { error } = await supabase.from("news_articles").insert(payload);
    if (error) {
      console.error(`❌ Erro na inserção (${siteName}): ${error.message}`);
      stats.errors++;
      return;
    }
    console.log(`  ${is_priority ? "🔴 URGENTE" : "✅"} Guardada | Cat: ${categoria} | Prio: ${is_priority}`);
    stats.saved++;
  } catch (err) {
    console.warn(`  ⚠️ Erro num artigo de ${siteName}: ${String(err)}`);
  }
}

// ─────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async () => {
  const began = Date.now();
  console.log("🚀 AngoNewsScraper (Edge) — INICIANDO");

  for (const [siteName, cfg] of Object.entries(SITES_CONFIG)) {
    await scrapeSite(siteName, cfg);
  }

  const elapsed = Math.round((Date.now() - began) / 1000);
  const body = {
    ok: true,
    elapsedSec: elapsed,
    stats,
  };
  console.log(
    `🏁 CONCLUÍDO em ${elapsed}s | Guardados: ${stats.saved} | Duplicados: ${stats.skipped} | Erros: ${stats.errors}`,
  );
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
