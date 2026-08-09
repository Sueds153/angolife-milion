import { createClient } from "npm:@supabase/supabase-js@2";
import * as cheerio from "npm:cheerio@1.0.0";
import {
  cleanText,
  extractEmail,
  fetchSoup,
  mapWithConcurrency,
  normalizeUrl,
  sleep,
} from "../_shared/scraper_utils.ts";

// ─────────────────────────────────────────────
// LIMITES DE EXECUÇÃO (Edge Function free: 150s wall / 2s CPU)
// ─────────────────────────────────────────────
const MAX_PER_SITE = 3;
const DETAIL_CONCURRENCY = 2;
const DETAIL_DELAY_MS = 400;
const DEADLINE_MS = 115_000;

const startTime = Date.now();
const stats = { processed: 0, saved: 0, skipped: 0, errors: 0 };

function expired(): boolean {
  return Date.now() - startTime > DEADLINE_MS;
}

// URLs já vistas neste run — evita duplicados inseridos por concorrência.
const seenUrls = new Set<string>();

// ─────────────────────────────────────────────
// CATEGORIZAÇÃO AUTOMÁTICA
// ─────────────────────────────────────────────
const CATEGORY_MAP: Record<string, string[]> = {
  "Tecnologia": [
    "IT", "TI", "Informática", "Developer", "Desenvolvedor", "Programador",
    "Software", "Sistemas", "Redes", "Cibersegurança", "Data", "Python", "Java",
    "Frontend", "Backend", "Fullstack", "DevOps", "Cloud", "Suporte Técnico",
  ],
  "Gestão": [
    "Gerente", "Gestor", "Director", "Diretor", "Manager", "Supervisor",
    "Coordenador", "Coordenação", "CEO", "CFO", "COO", "Chefe", "Responsável",
  ],
  "Finanças": [
    "Contabilista", "Contabilidade", "Financeiro", "Finanças", "Auditor",
    "Auditoria", "Tesoureiro", "Economista", "Análise Financeira", "Fiscal",
  ],
  "Saúde": [
    "Médico", "Enfermeiro", "Enfermeira", "Farmacêutico", "Técnico de Saúde",
    "Saúde", "Clínica", "Hospital", "Dentista", "Fisioterapeuta",
  ],
  "Engenharia": [
    "Engenheiro", "Engenharia", "Civil", "Mecânico", "Elétrico", "Topógrafo",
    "Construção", "Estrutural", "Petróleo", "Petroquímica", "Minas",
  ],
  "Educação": [
    "Professor", "Professora", "Docente", "Educador", "Formador",
    "Tutor", "Ensino", "Escola", "Universidade", "Docência",
  ],
  "Logística": [
    "Motorista", "Logística", "Armazém", "Transporte", "Estoca",
    "Distribuição", "Supply Chain", "Compras", "Procurement", "Frota",
  ],
  "Limpeza & Serviços": [
    "Limpeza", "Higiene", "Lavandaria", "Copeiro", "Cozinheiro",
    "Segurança", "Porteiro", "Recepcionista", "Assistente",
  ],
  "Vendas & Marketing": [
    "Vendedor", "Vendas", "Comercial", "Marketing", "Publicidade",
    "Relações Públicas", "Social Media", "E-commerce", "Representante Comercial",
  ],
  "Concurso Público": [
    "Concurso", "Estado", "Governo", "Ministério", "INEFOP",
    "Público", "Municipal", "Provincial", "Administração Pública",
  ],
};

interface SiteConfig {
  base_url: string;
  list_url: string;
  job_card_selector: string;
  title_selector: string;
  company_selector: string | null;
  location_selector: string | null;
  link_selector: string;
  detail_enabled: boolean;
  detail_description_selector: string | null;
  detail_requirements_selector: string | null;
  request_delay_range: [number, number];
  fixed_company?: string;
  fixed_category?: string;
  extra_headers?: Record<string, string>;
}

const JOBS_CONFIG: Record<string, SiteConfig> = {
  "Contrata.ao": {
    base_url: "https://contrata.ao",
    list_url: "https://contrata.ao/vagas",
    job_card_selector: "article, .job-item, .card-grid, .post, div:has(a[href*='/empregos/'])",
    title_selector: "a[href*='/empregos/'], h3, h2",
    company_selector: "a[href*='/Empresas/'], .company, .employer",
    location_selector: ".location, .city",
    link_selector: "a[href*='/empregos/']",
    detail_enabled: true,
    detail_description_selector: ".description, .content",
    detail_requirements_selector: ".requirements",
    request_delay_range: [1, 3],
  },
  "Ango Emprego": {
    base_url: "https://angoemprego.com",
    list_url: "https://angoemprego.com",
    job_card_selector: "li.job_listing, .job-container",
    title_selector: "h3",
    company_selector: ".company",
    location_selector: ".location",
    link_selector: "a",
    detail_enabled: true,
    detail_description_selector: ".job_description",
    detail_requirements_selector: ".entry-content ul",
    request_delay_range: [1, 3],
  },
  "AngoVagas": {
    base_url: "https://angovagas.net",
    list_url: "https://angovagas.net",
    job_card_selector: "article.l-post, .post-meta",
    title_selector: "h2.post-title",
    company_selector: ".author, .company",
    location_selector: ".post-date",
    link_selector: "a",
    detail_enabled: true,
    detail_description_selector: ".entry-content",
    detail_requirements_selector: ".entry-content ul",
    request_delay_range: [2, 4],
  },
  "INEFOP": {
    base_url: "https://www.inefop.gov.ao",
    list_url: "https://www.inefop.gov.ao/concursos",
    job_card_selector: "div.card, article, tr",
    title_selector: "h3, td, .title",
    company_selector: null,
    location_selector: ".provincia, td",
    link_selector: "a",
    detail_enabled: false,
    fixed_company: "Estado Angolano (INEFOP)",
    fixed_category: "Concurso Público",
    request_delay_range: [3, 5],
  },
  "Emprega Angola": {
    base_url: "https://empregangola.com",
    list_url: "https://empregangola.com/vagas",
    job_card_selector: "article.blog-post-default",
    title_selector: "h2.entry-title",
    company_selector: ".company-name",
    location_selector: ".location",
    link_selector: "a",
    detail_enabled: true,
    detail_description_selector: ".entry-content",
    detail_requirements_selector: ".requirements, #requirements",
    request_delay_range: [3, 5],
  },
  "Jobartis": {
    base_url: "https://www.jobartis.com",
    list_url: "https://www.jobartis.com/vagas-emprego/luanda",
    job_card_selector: ".job, .thumbnail-card, .panel-default",
    title_selector: ".job-link, h2, h3",
    company_selector: "h5",
    location_selector: "li, .location",
    link_selector: "a.job-link, a",
    detail_enabled: true,
    detail_description_selector: ".job-description",
    detail_requirements_selector: ".job-requirements",
    request_delay_range: [3, 6],
  },
  "VerAngola": {
    base_url: "https://empregos.verangola.net",
    list_url: "https://empregos.verangola.net/",
    job_card_selector: "li.listing-card.listing-card-oferta, li.listing-card",
    title_selector: "a.title",
    company_selector: "span.username b",
    location_selector: "span.location",
    link_selector: "a.title",
    detail_enabled: true,
    detail_description_selector: "#description",
    detail_requirements_selector: null,
    request_delay_range: [3, 6],
  },
  "LinkedIn": {
    base_url: "https://www.linkedin.com",
    list_url: "https://www.linkedin.com/jobs/search/?keywords=angola&location=Angola&f_TPR=r86400",
    job_card_selector: ".job-search-card, .base-card",
    title_selector: "h3.base-search-card__title",
    company_selector: "h4.base-search-card__subtitle",
    location_selector: ".job-search-card__location",
    link_selector: "a.base-card__full-link",
    detail_enabled: false,
    request_delay_range: [6, 12],
    extra_headers: {
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    },
  },
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function categorize(title: string, fixedCategory?: string): string {
  if (fixedCategory) return fixedCategory;
  const t = title.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some((kw) => t.includes(kw.toLowerCase()))) return category;
  }
  return "Geral";
}

function categoryPlaceholder(title: string): string {
  const cat = categorize(title);
  const placeholders: Record<string, string> = {
    "Tecnologia": "https://img.icons8.com/color/144/code.png",
    "Gestão": "https://img.icons8.com/color/144/manager.png",
    "Finanças": "https://img.icons8.com/color/144/money-bag-lira.png",
    "Saúde": "https://img.icons8.com/color/144/hospital.png",
    "Engenharia": "https://img.icons8.com/color/144/engineering.png",
    "Vendas & Marketing": "https://img.icons8.com/color/144/megaphone.png",
    "Geral": "https://img.icons8.com/color/144/company.png",
  };
  return placeholders[cat] ?? placeholders["Geral"];
}

// ─────────────────────────────────────────────
// TIPO / NOTÍCIAS / LOCALIZAÇÃO
// ─────────────────────────────────────────────
function inferType(title: string): string {
  const t = title.toLowerCase();
  if (/est[áa]gio|estagi[áa]ri|trainee|young graduate/.test(t)) return "Estágio";
  if (/tempo indeterminado|tempo integral|full[- ]?time/.test(t)) return "Tempo Inteiro";
  if (/tempo determinado/.test(t)) return "Tempo Determinado";
  if (/contrato de servi[çc]os|presta[çc][ãa]o de servi[çc]os/.test(t)) return "Contrato de Serviços";
  if (/part[- ]?time|meio per[íi]odo/.test(t)) return "Part-time";
  if (/remoto|remote|h[íi]brido/.test(t)) return "Remoto";
  if (/a definir/.test(t)) return "A definir";
  return "";
}

const NEWS_PATTERNS = /est[aá] a construir|est[aã]o a construir|convidados? a publicar|mobiliza fam[ií]lias|v[ií]timas? de acidente|inaugur|adjudic|lan[çc]a concurso|lan[çc]a programa/i;

const NEWS_URL_PATTERNS = /\/va\/pt\/\d{6}\/|verangola\.net\/va\/pt\/(politica|economia|saude|sociedade|educacao|desporto|opiniao|telecomunicacoes|energia|turismo|construcao|eventos|defesa|justica|interior|cultura|agricultura|ambiente|actualidade|angola)\//i;

function normalizeLocation(raw: string): string {
  const parts: string[] = [];
  for (const rawPart of (raw || "").split(",")) {
    const part = rawPart.trim().replace(/\s{2,}/g, " ");
    if (!part) continue;
    if (parts.some((p) => p.toLowerCase() === part.toLowerCase())) continue;
    parts.push(part);
  }
  if (parts.length > 1 && parts[parts.length - 1].toLowerCase() === "angola") parts.pop();
  return parts.length > 0 ? parts.join(", ") : "Angola";
}

function extractImage($: cheerio.CheerioAPI, baseUrl: string): string | null {
  const og = $('meta[property="og:image"]').first().attr("content");
  if (og) return og;
  const imgs = $("img").slice(0, 5);
  for (const img of imgs) {
    const src = $(img).attr("src") ?? $(img).attr("data-src") ?? "";
    if (src && /logo|company|employer|brand/i.test(src)) {
      return normalizeUrl(src, baseUrl);
    }
  }
  return null;
}

function extractSalary($: cheerio.CheerioAPI): string | null {
  const meta = $('meta[property="og:salary"], meta[name="salary"]').first().attr("content");
  if (meta) return meta.trim();

  const jsonLd = $('script[type="application/ld+json"]').first().text().trim();
  if (jsonLd) {
    try {
      const raw = JSON.parse(jsonLd);
      const entries = Array.isArray(raw) ? raw : [raw];
      for (const data of entries) {
        if (data && data["@type"] === "JobPosting") {
          const salary = data["baseSalary"];
          if (salary && typeof salary === "object") {
            const value = salary?.value?.value;
            const currency = salary?.value?.currency ?? "Kz";
            if (value) return `${value} ${currency}`;
          }
        }
      }
    } catch {
      // JSON-LD malformado — ignora
    }
  }

  const text = $("body").text();
  const patterns = [
    /[\d.,]+\s*[KM]?[kzKZ]\s*\/?\s*m[eê]s/i,
    /[\d.,]+\s*[KM]?[kzKZ](?!\w)/i,
    /[Aa]\s*[Cc]ombinar/,
    /[Cc]ompetitiv[oa]/,
    /[Nn]egoci[aá]vel/,
    /[Ss]al[aá]rio\s*:?\s*[\d.,]+\s*[KM]?[kzKZ]/,
  ];
  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (m) return m[0].trim();
  }
  return null;
}

function autoDetectSelector($: cheerio.CheerioAPI): string | null {
  const candidates = [
    "li.job_listing", "article.job_listing", ".job-listing",
    ".job-item", ".vacancy-item", "li.job", ".job_item",
    ".base-card", "article.post", ".post", "article",
  ];
  for (const sel of candidates) {
    if ($(sel).length >= 2) return sel;
  }
  return null;
}

// ─────────────────────────────────────────────
// DEDUPLICAÇÃO
// ─────────────────────────────────────────────
async function isDuplicateUrl(url: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("jobs")
    .select("id")
    .eq("source_url", url)
    .limit(1);
  if (error) {
    console.error(`Erro dedup URL ${url}: ${error.message}`);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

async function isDuplicateComposite(title: string, company: string): Promise<boolean> {
  if (!title || !company || company === "Empresa Confidencial") return false;
  const { data, error } = await supabase
    .from("jobs")
    .select("id")
    .eq("title", title)
    .eq("company", company)
    .limit(1);
  if (error) {
    console.error(`Erro dedup composto: ${error.message}`);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

// ─────────────────────────────────────────────
// PROCESSAMENTO DE UMA VAGA
// ─────────────────────────────────────────────
async function processCard(
  card: cheerio.Cheerio<cheerio.AnyNode>,
  jobUrl: string,
  siteName: string,
  cfg: SiteConfig,
): Promise<boolean> {
  try {
    let title = "";
    const titleEl = card.find(cfg.title_selector).first();
    title = cleanText(titleEl.text());
    if (!title && card.is("a, h3, h2")) title = cleanText(card.text());

    let company = cfg.fixed_company ?? "";
    if (!company && cfg.company_selector) {
      const compEl = card.find(cfg.company_selector).first();
      company = cleanText(compEl.text());
    }
    if (!company || /^an[oó]nimo$/i.test(company)) company = "Empresa Confidencial";

    if (!title) return false;

    if (NEWS_PATTERNS.test(title)) {
      stats.skipped++;
      return false;
    }

    if (NEWS_URL_PATTERNS.test(jobUrl)) {
      stats.skipped++;
      return false;
    }

    if (await isDuplicateComposite(title, company)) {
      stats.skipped++;
      return false;
    }

    const locEl = cfg.location_selector ? card.find(cfg.location_selector).first() : null;
    const location = normalizeLocation(locEl ? cleanText(locEl.text()) || "Angola" : "Angola");

    let description = "";
    let requirementsList: string[] = [];
    let imageUrl = "";
    let email = "";
    let salary: string | null = null;

    if (cfg.detail_enabled && jobUrl) {
      await sleep(DETAIL_DELAY_MS);
      const detail = await fetchSoup(jobUrl, cfg.extra_headers ?? {}, 20000);
      if (detail) {
        if (cfg.detail_description_selector) {
          const descEl = detail(cfg.detail_description_selector).first();
          description = cleanText(descEl.text() ?? "");
        }
        if (cfg.detail_requirements_selector) {
          const reqEl = detail(cfg.detail_requirements_selector).first();
          const reqText = cleanText(reqEl.text() ?? "");
          requirementsList = reqText
            .split("\n")
            .map((r) => r.replace(/^[-•\s]+/, "").trim())
            .filter(Boolean);
        }
        imageUrl = extractImage(detail, cfg.base_url) ?? "";
        email = extractEmail(detail.text()) ?? "";
        salary = extractSalary(detail);
      }
    }

    if (!imageUrl) imageUrl = categoryPlaceholder(title);
    if (!email) email = `Candidatar via: ${jobUrl}`;
    const categoria = categorize(title, cfg.fixed_category);

    const payload = {
      title: title.slice(0, 255),
      company: company.slice(0, 255),
      location: location.slice(0, 255),
      type: inferType(title),
      description: description.slice(0, 5000),
      requirements: requirementsList,
      application_email: email.slice(0, 255),
      imagem_url: imageUrl,
      source_url: jobUrl,
      categoria,
      fonte: siteName,
      status: "pendente",
      posted_at: new Date().toISOString(),
      salary,
    };

    const { error } = await supabase.from("jobs").insert(payload);
    if (error) {
      console.error(`❌ Erro na inserção (${siteName}): ${error.message}`);
      stats.errors++;
      return false;
    }
    console.log(`💾 Guardada | ${siteName} | ${title.slice(0, 60)}`);
    stats.saved++;
    return true;
  } catch (err) {
    console.warn(`⚠️ Erro ao processar card (${siteName}): ${String(err)}`);
    stats.errors++;
    return false;
  }
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

    let cards = $(cfg.job_card_selector).toArray();
    if (cards.length === 0) {
      const detected = autoDetectSelector($);
      if (detected) cards = $(detected).toArray();
    }
    if (cards.length === 0) {
      console.warn(`  ⚠️ Nenhum card em ${siteName}`);
      stats.errors++;
      return;
    }
    console.log(`  📋 ${cards.length} cards encontrados`);

    // Dedup serial: recolhe vagas novas (URL nunca vista neste run nem na BD)
    // antes de abrir a concorrência — evita duplicados por race.
    const fresh: { card: cheerio.Cheerio<cheerio.AnyNode>; jobUrl: string }[] = [];
    for (const el of cards) {
      if (expired()) break;
      const card = $(el);
      const linkEl = card.find(cfg.link_selector).first();
      const rawUrl = linkEl.attr("href") ?? (card.is("a") ? card.attr("href") : "");
      const jobUrl = normalizeUrl(rawUrl, cfg.base_url);
      if (!jobUrl) continue;
      if (seenUrls.has(jobUrl)) continue;
      if (NEWS_URL_PATTERNS.test(jobUrl)) {
        stats.skipped++;
        continue;
      }
      if (await isDuplicateUrl(jobUrl)) {
        stats.skipped++;
        continue;
      }
      seenUrls.add(jobUrl);
      fresh.push({ card, jobUrl });
      if (fresh.length >= MAX_PER_SITE) break;
    }
    console.log(`  ➕ ${fresh.length} vagas novas a processar`);

    await mapWithConcurrency(fresh, DETAIL_CONCURRENCY, async (item) => {
      if (expired()) return;
      stats.processed++;
      await processCard(item.card, item.jobUrl, siteName, cfg);
    });
  } catch (err) {
    console.error(`❌ SITE FALHADO: ${siteName} | ${String(err)}`);
    stats.errors++;
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
  console.log("🚀 AngoJobScraper (Edge) — INICIANDO");

  for (const [siteName, cfg] of Object.entries(JOBS_CONFIG)) {
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
