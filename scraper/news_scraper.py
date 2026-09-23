"""
AngoNewsScraper v2 — Motor de Agregação Robusta de Notícias Angolanas
=====================================================================
Arquitetura de 'Adaptadores' com suporte a 10+ fontes independentes.

Fontes configuradas:
  1. Expansão          → Economia
  2. Jornal de Angola  → Angola / Geral
  3. TPA               → Oficial / Urgente
  4. TV Girassol       → Oficial
  5. ANGOP             → Urgente / Oficial
  6. Novo Jornal       → Investigação / Sociedade
  7. NovaGazeta        → Utilidade / Cotidiano
  8. Rede Angola       → Independente / Cultura
  9. TopAngola         → Lifestyle / Diversificado
 10. Xé Angola        → Sociedade / Entretenimento
 11. Angonotícias     → Geral
 12. PlatinaLine       → Geral

Funcionalidades:
  ✅ SITES_CONFIG — dicionário global de adaptadores CSS
  ✅ Chrome User-Agent real (anti-403)
  ✅ Normalização de URLs relativas
  ✅ Extração de imagem em 3 níveis (og:image → img → placeholder)
  ✅ Flags de Urgência (is_priority) e categoria automática
  ✅ Loop independente com try-except por site
  ✅ Deduplicação por url_origem antes do insert no Supabase

Dependências:
    pip install requests beautifulsoup4 python-dotenv
"""

import re
import os
import time
import json
import logging
import unicodedata
from datetime import datetime, timezone
from typing import Optional, List, Dict
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# ─────────────────────────────────────────────
# CONFIGURAÇÃO DE LOGGING
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("news_scraper.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("AngoNewsScraper")

RESOLVEAO_PLACEHOLDER = "https://resolveao.vercel.app/og-image.jpg"


def is_junk_title(title: str) -> bool:
    """Títulos de navegação/marca que não são manchetes de artigo."""
    t = (title or "").strip()
    if len(t) < 5:
        return True
    s = t.lower()
    if re.search(
        r"(página inicial|pagina inicial|não encontrado|nao encontrado|"
        r"error 404|top news|últimas notícias|ultimas noticias|"
        r"global media|novagazeta - gem|gem angola)",
        s,
    ):
        return True
    if s in {
        "home", "início", "inicio", "notícias", "noticias",
        "últimas", "ultimas", "404",
        "política", "politica", "economia", "sociedade", "cultura",
        "desporto", "mundo", "áfrica", "africa", "institucional",
        "saúde", "saude", "educação", "educacao", "turismo",
        "transportes", "transporte", "agricultura",
    }:
        return True
    # 'Sociedade 106' / 'Politica 108' — páginas de categoria com id numérico
    if re.fullmatch(r"[a-zà-ú]+(?: [a-zà-ú]+)? \d{1,5}", s):
        return True
    return False


def is_junk_url(url: str) -> bool:
    """Links de navegação/secção que não são artigos (ex.: ANGOP ?vtab=…)."""
    u = (url or "").strip().lower()
    if not u:
        return True
    if "vtab=" in u:
        return True
    path = u.split("?", 1)[0].rstrip("/")
    if re.search(r"/(noticias|noticia|news|articles|artigos)$", path):
        return True
    return False


# ─────────────────────────────────────────────────────────────────────────
# LIMPEZA DE CONTEÚDO — títulos colados, mojibake e resumos com navegação
# ─────────────────────────────────────────────────────────────────────────
def fix_mojibake(text: str) -> str:
    """Repara UTF-8 decodificado como latin-1/cp1252 (ex.: 'LÃ­deres' → 'Líderes')."""
    if not text:
        return text
    s = text.lstrip("\ufeff")
    if not re.search(r"Ã[\x80-\xbf]|Â[\x80-\xbf]|â€", s):
        return s

    def _tokens(src: str, enc: str) -> str:
        def repl(m: "re.Match[str]") -> str:
            try:
                return m.group(0).encode(enc, "strict").decode("utf-8", "strict")
            except (UnicodeEncodeError, UnicodeDecodeError):
                return m.group(0)

        return re.sub(r"(?:Ã[\x80-\xbf]|Â[\x80-\xbf])+", repl, src)

    out = _tokens(s, "latin-1")
    if "â€" in out:
        def repl2(m: "re.Match[str]") -> str:
            try:
                return m.group(0).encode("cp1252", "strict").decode("utf-8", "strict")
            except (UnicodeEncodeError, UnicodeDecodeError):
                return m.group(0)

        out = re.sub(
            "â€[€\\u2018\\u2019\\u201c\\u201d\\u2013\\u2014\\u0080-\\u009f]",
            repl2,
            out,
        )
    return out


def decode_html(resp) -> str:
    """Decodifica a resposta HTML contornando o default ISO-8859-1 do requests."""
    raw = resp.content
    declared = (resp.encoding or "").lower().replace("_", "-")
    if declared in ("", "iso-8859-1", "latin-1", "latin1", "us-ascii"):
        try:
            return raw.decode("utf-8")
        except UnicodeDecodeError:
            try:
                return raw.decode(resp.apparent_encoding or "latin-1", errors="replace")
            except LookupError:
                return raw.decode("latin-1", errors="replace")
    try:
        return raw.decode(resp.encoding, errors="replace")
    except LookupError:
        return raw.decode("utf-8", errors="replace")


_CAT_PREFIX = re.compile(
    r"^(?:Sociedade|Pol[íi]tica|Economia|Desporto|Cultura|Mundo|Opini[ãa]o|"
    r"Entretenimento|Sa[úu]de|Educa[çc][ãa]o|Tecnologia|Angola|Oficial|Utilidade|"
    r"Investiga[çc][ãa]o|Geral|Oportunidades|Internacional|Brasil)"
    r"(?:/\s*)?(?:Seman[áa]rio\s+Novo\s+Jornal)?(?=[A-ZÀ-Þ])"
)
_GLUE_BOUNDARY = re.compile(r"(?<=[a-zà-ÿ0-9)\]])(?=[A-ZÀ-Þ])")
_GLUE_SKIP_WORDS = {
    "whatsapp", "iphone", "iphones", "ios", "ebay", "android",
    "facebook", "instagram", "tiktok", "youtube", "linkedin",
}


def _skip_boundary(t: str, i: int) -> bool:
    """True se o 'minúsculo→Maiúsculo' está dentro de uma marca conhecida (ex.: WhatsApp)."""
    wb = re.search(r"[\wÀ-ÿ]+$", t[:i])
    wa = re.match(r"[\wÀ-ÿ]+", t[i:])
    cand = ((wb.group(0) if wb else "") + (wa.group(0) if wa else "")).lower()
    if not cand:
        return False
    return cand in _GLUE_SKIP_WORDS or any(cand.startswith(b) for b in _GLUE_SKIP_WORDS)


def _glue_cut(t: str) -> str:
    """Corta 'manchete+lead' colados no primeiro 'minúsculo→Maiúsculo' sem espaço."""
    if len(t) <= 60:
        return t
    for m in _GLUE_BOUNDARY.finditer(t):
        i = m.start()
        if i < 20:
            continue
        head, tail = t[:i].rstrip(), t[i:]
        if len(head) < 40 or len(tail) < 20:
            continue
        if _skip_boundary(t, i):
            continue
        return head
    return t


def _insert_glue_spaces(s: str) -> str:
    """Insere espaço em colagens de texto ('mercadoDIPLOMA' → 'mercado DIPLOMA')."""
    res = s
    pos = 0
    while True:
        m = _GLUE_BOUNDARY.search(res, pos)
        if not m:
            break
        i = m.start()
        if _skip_boundary(res, i):
            pos = i + 1
            continue
        res = res[:i] + " " + res[i:]
        pos = i + 2
    return res


def clean_news_title(title: str) -> str:
    """Limpa títulos: mojibake, prefixos de categoria colados e manchete+lead colados."""
    t = fix_mojibake(title or "")
    t = re.sub(r"\s+", " ", t).strip()
    if not t:
        return t
    # prefixo de secção colado sem espaço (ex.: 'SociedadeÁfrica: …')
    for _ in range(3):
        m = _CAT_PREFIX.match(t)
        if not m:
            break
        t = t[m.end():].lstrip(" /")
    # marca da fonte no início (ex.: 'NovaGazeta - GEM Angola <manchete>')
    t = re.sub(r"^\S+\s*-\s*GEM Angola\s+", "", t)
    return _glue_cut(t).strip(" -–—:,;/")


def clean_summary_text(text: str) -> str:
    """Limpa resumos: mojibake, BOM, navegação do site no início e colagens de texto."""
    s = fix_mojibake(text or "")
    s = s.lstrip("\ufeff")
    s = re.sub(r"\s+", " ", s).strip()
    # lixo de script/analytics no meio do resumo (ex.: ANGONOTÍCIAS "host = '…'; (function…")
    s = re.split(r"\s+host\s*=\s*['\"]https?://|\s+\(function\s*\(", s, maxsplit=1)[0].strip()
    if re.search(r"(?i:p[áa]gina inicial)", s):
        m = re.search(r"^.*?(?i:p[áa]gina inicial).*?(?i:v[íi]deos)\s*", s)
        if m:
            s = s[m.end():]
        else:
            p_end = re.search(r"(?i:p[áa]gina inicial)", s).end()
            # consome o sufixo tipo ' Angola' (uma palavra capitalizada)
            m2 = re.match(r"\s*[-–—]?\s*[A-ZÀ-Þ][a-zà-ÿ]+", s[p_end:])
            if m2:
                s = s[p_end + m2.end():]
            else:
                gb = _GLUE_BOUNDARY.search(s, p_end)
                if gb and gb.start() - p_end <= 30:
                    s = s[gb.start():]
    s = _insert_glue_spaces(s)
    return s.lstrip(" |-–—:")


# seletores de corpo por ordem de prioridade (o ANCESTRAL 'main' nunca
# deve vencer um 'article' concreto — era isso que poluía resumo/corpo)
# '.details-content' = NovaGazeta (corpo real); 'article' ali são promos de sidebar
BODY_SELECTORS = (
    ".details-content",
    "article",
    ".entry-content",
    ".post-content",
    ".content-body",
    ".article-content",
    ".td-post-content",
    ".node-content",
    ".field--name-body",
    ".content",
    "main",
)


def extract_body(detail_soup) -> tuple:
    """(body_html, body_text) — prioriza contentores de artigo reais; fallback sem <head>/nav."""
    body_area = None
    for sel in BODY_SELECTORS:
        body_area = detail_soup.select_one(sel)
        if body_area is not None:
            break
    if body_area is not None:
        for junk in body_area.select("script, style, iframe, ins, nav, footer, aside, form"):
            junk.decompose()
        if body_area.name == "main":
            for junk in body_area.select("title, header, h1"):
                junk.decompose()
    body_text = body_area.get_text(separator=" ") if body_area is not None else ""
    body_html = ""
    if body_area is not None and len(body_text.strip()) >= 80:
        body_html = str(body_area)
        return body_html, body_text
    # fallback: página inteira sem <head>/navegação/script
    fb = BeautifulSoup(str(detail_soup), "html.parser")
    for junk in fb(["script", "style", "nav", "header", "footer", "aside", "form", "title"]):
        junk.decompose()
    fb_text = fb.get_text(separator=" ")
    if len(fb_text.strip()) > len(body_text.strip()):
        body_text = fb_text
        for junk in fb(["script", "style"]):
            junk.decompose()
        body_html = str(fb)
    return body_html, body_text


def pick_detail_title(detail_soup, fallback_hint: str = "") -> str:
    """Título do detalhe: og:title → h1 (se não for marca) → <title> da página → listagem."""
    og = detail_soup.select_one('meta[property="og:title"]')
    if og is not None:
        og_text = (og.get("content") or "").strip()
        if og_text:
            og_clean = clean_news_title(og_text)
            if og_clean and not is_junk_title(og_clean) and len(og_clean) >= 12:
                # corta sufixo de marca tipo ' - NovaGazeta'
                og_clean = re.split(r"\s+[|–—]\s+|\s+-\s+", og_clean, maxsplit=1)[0].strip()
                return og_clean
    h1 = detail_soup.select_one("h1, .entry-title, .article-title")
    h1_text = h1.get_text(strip=True) if h1 else ""
    if h1_text:
        h1_clean = clean_news_title(h1_text)
        if h1_clean and not is_junk_title(h1_clean) and len(h1_clean) >= 12:
            return h1_clean
    page_title = ""
    if detail_soup.title:
        page_title = detail_soup.title.get_text(strip=True)
    if page_title:
        page_title = re.split(r"\s+[|–—]\s+|\s+-\s+", page_title, maxsplit=1)[0].strip()
    if page_title and len(page_title) >= 15 and not is_junk_title(page_title):
        return clean_news_title(page_title)
    if fallback_hint and not is_junk_title(fallback_hint):
        return clean_news_title(fallback_hint)
    return clean_news_title(h1_text or fallback_hint)


# ─────────────────────────────────────────────────────────────────────────
# INTELIGÊNCIA: Palavras-chave para categorização e prioridade
# ─────────────────────────────────────────────────────────────────────────
PRIORITY_KEYWORDS = [
    'Última Hora', 'Urgente', 'Flash', 'BNA', 'Kwanza',
    'Breaking', 'Alerta', 'Atenção', 'Mandato', 'Crise'
]
OPPORTUNITY_KEYWORDS = [
    'Concurso', 'Estado', 'Admissão', 'Bolsa', 'Recrutamento',
    'Vaga', 'Emprego', 'Estágio', 'Candidatura'
]
ECONOMY_KEYWORDS = [
    'Kwanza', 'BNA', 'Câmbio', 'Inflação', 'Bancos', 'Petróleo',
    'PIB', 'FMI', 'Economia', 'Mercado', 'Dívida', 'Crescimento'
]
CULTURE_KEYWORDS = [
    'Cultura', 'Arte', 'Música', 'Festival', 'Cinema', 'Literatura',
    'Futebol', 'Sport', 'Desporto', 'Entretenimento'
]

# ─────────────────────────────────────────────────────────────────────────
# SITES_CONFIG — Dicionário Global de Adaptadores
# Cada entrada é um portal independente com os seus próprios seletores CSS.
# ─────────────────────────────────────────────────────────────────────────
SITES_CONFIG: Dict[str, dict] = {

    # ── 1. EXPANSÃO ──────────────────────────────────────────────────────
    # Foco em Economia. Estrutura baseada em artigos padrão WordPress.
    "Expansão": {
        "base_url": "https://www.expansao.co.ao",
        "list_url": "https://www.expansao.co.ao/economia/ultimas.html",
        "article_selector": ".t-am, article, .detalhe",
        "title_selector": ".t-am-title, .t-am-overlay-i, h3, h2",
        "link_selector": "a",
        "fixed_category": "Economia",
    },

    # ── 2. JORNAL DE ANGOLA ───────────────────────────────────────────────
    # Portal official. Estrutura com cards de notícias.
    "Jornal de Angola": {
        "base_url": "https://www.jornaldeangola.ao",
        "list_url": "https://www.jornaldeangola.ao/ao/noticias/",
        "article_selector": "article, .td-module-container, .td-block-span12, .entry-title",
        "title_selector": "h1, h2, h3, .entry-title, a",
        "link_selector": "a",
        "fixed_category": "Angola",
        "extra_headers": {
            "Referer": "https://www.google.com/",
            "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8"
        }
    },

    # ── 3. TPA (Televisão Pública de Angola) ──────────────────────────────
    "TPA": {
        "base_url": "https://tpaonline.ao",
        "list_url": "https://tpaonline.ao/category/noticias/",
        "article_selector": "article, .post, .entry, a[href*='/detalhe/']",
        "title_selector": "h2, h3, .title",
        "link_selector": "a",
        "fixed_category": "Oficial",
        "verify_ssl": False,
    },

    # ── 4. TV GIRASSOL ────────────────────────────────────────────────────
    "TV Girassol": {
        "base_url": "https://www.giranoticias.com",
        "list_url": "https://www.giranoticias.com/",
        "article_selector": "article, .post, .card, .noticia, .jeg_post",
        "title_selector": "h2, h3, .jeg_post_title",
        "link_selector": "a",
        "fixed_category": "Oficial",
    },

    # ── 5. ANGOP (Agência Angola Press) ──────────────────────────────────
    "ANGOP": {
        "base_url": "https://www.angop.ao",
        "list_url": "https://www.angop.ao/angola/pt_pt/noticias/",
        "article_selector": "article, .news-item, .item, a[href*='/noticias/'], .jeg_post",
        "title_selector": "h1, h2, h3, .title",
        "link_selector": "a",
        "fixed_category": "Angola",
        "extra_headers": {
            "Accept-Encoding": "gzip, deflate",
            "Referer": "https://www.google.com/",
            "Sec-Fetch-Mode": "navigate",
            "Accept-Language": "pt-PT,pt;q=0.9",
            "Sec-Fetch-Site": "cross-site",
        },
        "verify_ssl": False,
    },

    # ── 6. NOVO JORNAL ────────────────────────────────────────────────────
    # Foco em Investigação e Sociedade. Fortemente anti-scraping → Chrome UA obrigatório.
    "Novo Jornal": {
        "base_url": "https://www.novojornal.co.ao",
        "list_url": "https://www.novojornal.co.ao/sociedade/",
        "article_selector": "article, .td-module-container, .jeg_post",
        "title_selector": "h1, h2, h3, .td-module-title, .jeg_post_title",
        "link_selector": "a",
        "fixed_category": "Investigação",
    },

    # ── 7. NOVA GAZETA ────────────────────────────────────────────────────
    # Versão digital. Conteúdo de utilidade pública e cotidiano.
    "NovaGazeta": {
        "base_url": "https://novagazeta.co.ao",
        "list_url": "https://novagazeta.co.ao/category/noticias/",
        "article_selector": "article, .post, .news-item",
        "title_selector": "h1, h2, h3, .entry-title, .post-title",
        "link_selector": "a",
        "fixed_category": "Utilidade",
    },


    # ── 10. XÉ ANGOLA ────────────────────────────────────────────────────
    "Xé Angola": {
        "base_url": "https://xaa.ao",
        "list_url": "https://xaa.ao/category/noticias/",
        "article_selector": ".post, article, .jeg_post",
        "title_selector": "h3, h2, .entry-title, .jeg_post_title",
        "link_selector": "a",
        "fixed_category": "Sociedade",
    },

    # ── 11. ANGONOTÍCIAS ─────────────────────────────────────────────────
    "Angonotícias": {
        "base_url": "https://www.angonoticias.com",
        "list_url": "https://www.angonoticias.com/Artigos/canal/2/generalista",
        "article_selector": "a[href*='/Artigos/item/'], article h3",
        "title_selector": ".",
        "link_selector": ".",
        "fixed_category": "Angola",
    },

    # ── 12. PLATINALINE ──────────────────────────────────────────────────
    "PlatinaLine": {
        "base_url": "https://platinaline.com",
        "list_url": "https://platinaline.com/category/noticias/",
        "article_selector": "article, .l-post, .post-meta",
        "title_selector": "h1, h2, h3, h4, .post-title, a",
        "link_selector": "a",
        "fixed_category": "Geral",
        "extra_headers": {
            "Referer": "https://www.google.com/",
            "Upgrade-Insecure-Requests": "1"
        },
        "verify_ssl": False,
    },
}

# ─────────────────────────────────────────────
# CLIENTE SUPABASE REST (REUTILIZADO)
# ─────────────────────────────────────────────
class SupabaseRestClient:
    def __init__(self, url: str, key: str):
        self.base_url = url.rstrip("/")
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }

    def select(self, table: str, filters: dict = None, columns: str = "*") -> list:
        params = {"select": columns}
        if filters:
            params.update(filters)
        resp = requests.get(
            f"{self.base_url}/rest/v1/{table}",
            headers={**self.headers, "Prefer": ""},
            params=params,
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()

    def insert(self, table: str, data: dict) -> bool:
        try:
            resp = requests.post(
                f"{self.base_url}/rest/v1/{table}",
                headers=self.headers,
                json=data,
                timeout=10,
            )
            # Depuração solicitada pelo utilizador: Resposta do Supabase
            log.info(f"Resposta do Supabase: {resp.status_code} {resp.text}")
            
            if resp.status_code >= 400:
                log.error(f"❌ Erro na inserção: {resp.text}")
                log.error(f"Payload com erro: {json.dumps(data, ensure_ascii=False)[:500]}")
                return False
            return True
        except Exception as e:
            log.error(f"💥 Falha de conexão Supabase: {e}")
            return False


# ─────────────────────────────────────────────
# MOTOR PRINCIPAL - CLASSE AngoNewsScraper
# ─────────────────────────────────────────────
class AngoNewsScraper:
    DEFAULT_HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
        "Connection": "keep-alive",
    }

    def __init__(self, db: SupabaseRestClient):
        self.db = db
        # Sessão com User-Agent real Chrome 122 — evita bloqueios 403
        self.session = requests.Session()
        self.session.headers.update(self.DEFAULT_HEADERS)
        self.stats = {"processed": 0, "saved": 0, "skipped_dup": 0, "errors": 0}

    # ── Normalização de URLs relativas ────────────────────────────────────
    def normalize_url(self, url: str, base_url: str) -> str:
        """Converte links relativos para absolutos usando o domínio base."""
        if not url:
            return ""
        if url.startswith("http"):
            return url
        return urljoin(base_url, url)

    # ── Extração de Imagem em 3 Níveis ───────────────────────────────────
    def extract_image(self, soup: BeautifulSoup, base_url: str, content_selector: str = None) -> str:
        """
        Nível 1: og:image (meta tag — mais confiável)
        Nível 2: Primeira <img> dentro do conteúdo principal
        Nível 3: Placeholder Resolve.AO
        """
        # Nível 1: og:image
        og = soup.find("meta", property="og:image")
        if og and og.get("content"):
            img = og["content"].strip()
            # Alguns sites angolanos emitem "https:/dominio" (barra em falta)
            img = re.sub(r"^https:/([^/])", r"https://\1", img)
            if img.startswith("http"):
                return img
            if img.startswith("//"):
                return "https:" + img

        # Nível 1b: twitter:image
        tw = soup.find("meta", attrs={"name": "twitter:image"})
        if tw and tw.get("content"):
            timg = re.sub(r"^https:/([^/])", r"https://\1", tw["content"].strip())
            if timg.startswith("http"):
                return timg

        # Nível 2: Primeira imagem no conteúdo principal
        content_area = None
        if content_selector:
            content_area = soup.select_one(content_selector)
        if not content_area:
            content_area = soup.find(["article", "main", ".content", ".post-content", ".entry-content"])

        if content_area:
            img = content_area.find("img")
            if img:
                src = img.get("src") or img.get("data-src") or img.get("data-lazy-src")
                if src:
                    return self.normalize_url(src, base_url)

        # Nível 3: Placeholder Resolve.AO (Tratamento de Nulos)
        return RESOLVEAO_PLACEHOLDER

    # ── Extração de Data (meta-tags, sem LLM) ─────────────────────────────
    @staticmethod
    def extract_date(soup: BeautifulSoup) -> Optional[str]:
        """Devolve data de publicação em ISO-8601 (UTC) ou None. Sem LLM."""
        candidates = []

        for prop in ("article:published_time", "og:article:published_time", "article:published"):
            tag = soup.find("meta", property=prop)
            if tag and tag.get("content"):
                candidates.append(tag["content"].strip())

        for name in ("date", "pubdate", "publishdate", "DC.date", "dcterms.created"):
            tag = soup.find("meta", attrs={"name": name})
            if tag and tag.get("content"):
                candidates.append(tag["content"].strip())

        time_tag = soup.find("time", datetime=True)
        if time_tag and time_tag.get("datetime"):
            candidates.append(time_tag["datetime"].strip())

        # JSON-LD (schema.org NewsArticle)
        for script in soup.find_all("script", type="application/ld+json"):
            if not script.string:
                continue
            try:
                data = json.loads(script.string)
            except (json.JSONDecodeError, TypeError):
                continue
            items = data if isinstance(data, list) else [data]
            for item in items:
                if not isinstance(item, dict):
                    continue
                for key in ("datePublished", "dateCreated", "uploadDate"):
                    val = item.get(key)
                    if val:
                        candidates.append(str(val).strip())

        for raw in candidates:
            iso = AngoNewsScraper._to_iso(raw)
            if iso:
                return iso
        return None

    @staticmethod
    def _to_iso(raw: str) -> Optional[str]:
        """Normaliza timestamps Unix / strings comuns para ISO-8601."""
        if not raw:
            return None
        # Unix epoch (s ou ms)
        if re.fullmatch(r"\d{10,13}", raw):
            try:
                ts = int(raw)
                if ts > 10**12:
                    ts //= 1000
                return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            except (OverflowError, OSError, ValueError):
                return None
        # Já ISO-like (2026-09-22T…, 2026-09-22 10:54, com ou sem timezone)
        m = re.match(
            r"^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)(?:\.\d+)?\s*(Z|[+-]\d{2}:?\d{2})?$",
            raw,
        )
        if m:
            date_p, time_p, tz_p = m.group(1), m.group(2), m.group(3)
            if len(time_p) == 5:
                time_p += ":00"
            if not tz_p or tz_p.upper() == "Z":
                return f"{date_p}T{time_p}Z"
            if ":" not in tz_p:
                tz_p = tz_p[:3] + ":" + tz_p[3:]
            return f"{date_p}T{time_p}{tz_p}"
        # Só data: 2026-09-22
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw):
            return f"{raw}T00:00:00Z"
        return None

    # ── Classificação Inteligente ─────────────────────────────────────────
    def classify(self, title: str, fixed_category: str) -> tuple:
        """
        Retorna (categoria_final, is_priority).
        - Verifica palavras de urgência → is_priority = True
        - Verifica palavras de oportunidade → categoria = 'Oportunidades' (override)
        - Verifica palavras de economia → categoria = 'Economia' (override)
        - Caso contrário, usa a categoria fixa do adaptador.
        """
        title_normal = title  # mantém acentos para matching
        is_priority = any(kw.lower() in title_normal.lower() for kw in PRIORITY_KEYWORDS)
        
        # Override de categoria
        if any(kw.lower() in title_normal.lower() for kw in OPPORTUNITY_KEYWORDS):
            return "Oportunidades", is_priority
        if any(kw.lower() in title_normal.lower() for kw in ECONOMY_KEYWORDS):
            return "Economia", is_priority
        if any(kw.lower() in title_normal.lower() for kw in CULTURE_KEYWORDS):
            return "Cultura", is_priority

        return fixed_category, is_priority

    # ── Resumo do Texto ───────────────────────────────────────────────────
    def get_summary(self, text: str, max_len: int = 220) -> str:
        clean = clean_summary_text(text)
        return (clean[:max_len] + "...") if len(clean) > max_len else clean

    # ── Sanitização HTML ──────────────────────────────────────────────────
    def sanitize_html(self, soup_obj) -> str:
        for tag in soup_obj(["script", "style", "iframe", "ins", "nav", "footer", "aside", "form"]):
            tag.decompose()
        return str(soup_obj)

    # ── Deduplicação ──────────────────────────────────────────────────────
    def is_duplicate(self, url: str) -> bool:
        """Verifica se a url_origem já está na base de dados."""
        try:
            res = self.db.select("news_articles", filters={"url_origem": f"eq.{url}"}, columns="id")
            return len(res) > 0
        except Exception:
            return False

    # ── Fallback ScrapeGraphAI (USE_SGAI=auto) ────────────────────────────
    @staticmethod
    def sgai_enabled() -> bool:
        """USE_SGAI=auto|on + GEMINI_API_KEY + scrapegraphai → permite fallback LLM."""
        mode = os.getenv("USE_SGAI", "auto").strip().lower()
        if mode in ("off", "0", "false", "no"):
            return False
        if mode not in ("auto", "on", "1", "true"):
            return False
        if not os.getenv("GEMINI_API_KEY", "").strip():
            return False
        # sgai_news_scraper faz sys.exit se scrapegraphai faltar — verifica antes
        import importlib.util

        return importlib.util.find_spec("scrapegraphai") is not None

    @staticmethod
    def _sgai_graph_cfg():
        from sgai_news_scraper import build_graph_config

        model = os.getenv("SGAI_GEMINI_MODEL", "google_genai/gemini-3.6-flash")
        return build_graph_config(model, os.getenv("GEMINI_API_KEY", "").strip())

    def _sgai_listing(self, site_name: str, cfg: dict) -> List[Dict[str, str]]:
        from sgai_news_scraper import sgai_listing

        return sgai_listing(site_name, cfg, self._sgai_graph_cfg())

    def _sgai_detail(self, site_name: str, article_url: str) -> Dict[str, str]:
        from sgai_news_scraper import sgai_detail

        return sgai_detail(site_name, article_url, self._sgai_graph_cfg())

    # ── Helper: corpo de texto simples → HTML de parágrafos ────────────────
    @staticmethod
    def corpo_to_html(text: str) -> str:
        """Converte texto simples (parágrafos separados por linha em branco) em <p>."""
        paragraphs = [
            p.strip()
            for p in re.split(r"\n{2,}|\r\n{2,}", text or "")
            if p.strip()
        ]
        if not paragraphs:
            paragraphs = [text.strip()] if text and text.strip() else []
        return "".join(f"<p>{p}</p>" for p in paragraphs)

    # ── Scraper por Adaptador ─────────────────────────────────────────────
    def scrape_site(self, site_name: str, cfg: dict):
        """
        Processa um único site com blindagem try-except.
        Se falhar, imprime o erro no log e passa ao próximo site.
        """
        log.info(f"\n{'═' * 60}")
        log.info(f"🌐 SITE: {site_name} | {cfg['list_url']}")
        log.info(f"{'═' * 60}")

        try:
            # ── Configurações de Requisição Dinâmicas ─────────────────────
            verify = cfg.get("verify_ssl", True)
            headers = self.session.headers.copy()
            if "referer" in cfg:
                headers["Referer"] = cfg["referer"]
            if "extra_headers" in cfg:
                headers.update(cfg["extra_headers"])
            
            resp = self.session.get(cfg["list_url"], timeout=20, verify=verify, headers=headers)
            resp.raise_for_status()
            soup = BeautifulSoup(decode_html(resp), "html.parser")

            candidates = soup.select(cfg["article_selector"])
            articles: List = []
            for art in candidates:
                # Pré-filtro de navegação para o slice [:12] não ser só lixo
                if cfg["link_selector"] == ".":
                    raw = art.get("href", "")
                else:
                    lt = art.select_one(cfg["link_selector"])
                    raw = lt.get("href", "") if lt else ""
                if not raw and art.name == "a":
                    raw = art.get("href", "")
                art_url = self.normalize_url(raw, cfg["base_url"])
                if not art_url or art_url == cfg["base_url"] or is_junk_url(art_url):
                    continue
                articles.append(art)
                if len(articles) >= 12:
                    break

            listing_items: List[Dict[str, str]] = []
            if not articles:
                # Fallback híbrido: BS4 vazia → listagem via LLM
                if self.sgai_enabled():
                    log.info("  🤖 Listagem BS4 vazia → fallback ScrapeGraphAI…")
                    try:
                        listing_items = self._sgai_listing(site_name, cfg)
                        log.info(f"  📋 SGAI devolveu {len(listing_items)} artigos.")
                    except Exception as sgai_err:
                        log.warning(f"  ⚠️  Fallback SGAI (listagem) falhou: {sgai_err}")
                        listing_items = []
                if not listing_items:
                    log.warning(f"  ⚠️  Nenhum artigo encontrado. Seletor: '{cfg['article_selector']}'.")
                    # Depuração: Mostrar pedaço do HTML se não encontrar nada
                    snippet = soup.prettify()[:1000].replace("\n", " ")
                    log.debug(f"  Snippet do HTML ({site_name}): {snippet}")
                    self.stats["errors"] += 1
                    return
                log.info(f"  📋 {len(listing_items)} artigos encontrados (LLM). Processando...")
                for item in listing_items:
                    self._process_article(
                        site_name,
                        cfg,
                        item["url"],
                        title_hint=item.get("titulo", ""),
                        verify=verify,
                        headers=headers,
                    )
                time.sleep(3)
                return

            log.info(f"  📋 {len(articles)} artigos encontrados. Processando...")

            for art in articles:
                try:
                    # ── Extração do Link ──────────────────────────────────
                    if cfg["link_selector"] == ".":
                        raw_url = art.get("href", "")
                    else:
                        link_tag = art.select_one(cfg["link_selector"])
                        raw_url = link_tag.get("href", "") if link_tag else ""

                    if not raw_url and art.name == "a":
                        raw_url = art.get("href", "")

                    article_url = self.normalize_url(raw_url, cfg["base_url"])

                    if not article_url or article_url == cfg["base_url"]:
                        continue

                    if is_junk_url(article_url):
                        log.debug(f"      ⏭️  URL de navegação em {site_name}: {article_url[:80]}")
                        continue

                    # ── Extração do Título (do card de lista) ─────────────
                    if cfg["title_selector"] == ".":
                        title = art.get_text(strip=True)
                    else:
                        title_tag = art.select_one(cfg["title_selector"])
                        title = title_tag.get_text(strip=True) if title_tag else ""

                    if not title or len(title) < 5:
                        # Fallback: usar o próprio texto do card se o título falhar
                        title = art.get_text(strip=True)
                        if not title or len(title) < 5:
                            log.debug(f"      ⏭️  Título muito curto ou vazio em {site_name}")
                            continue

                    # Limpeza de título
                    title = re.sub(r'\s+', ' ', title).strip()

                    if is_junk_title(title):
                        log.debug(f"      ⏭️  Título de navegação em {site_name}: {title!r}")
                        continue

                    self._process_article(
                        site_name,
                        cfg,
                        article_url,
                        title_hint=title,
                        verify=verify,
                        headers=headers,
                    )
                    time.sleep(1.5)  # Respeito ao servidor entre artigos

                except Exception as art_err:
                    log.warning(f"  ⚠️  Erro num artigo de {site_name}: {art_err}")
                    continue  # Salta para o próximo artigo, não para o próximo site

            time.sleep(3)  # Pausa entre sites

        except Exception as site_err:
            # Blindagem total: mesmo que o site fique inacessível, continua para o próximo
            log.error(f"❌ SITE FALHADO: {site_name} | Erro: {site_err}")
            log.error(f"   → Saltando para o próximo site...")
            self.stats["errors"] += 1

    # ── Processamento de um artigo (completo: detalhe + payload + insert) ─
    def _process_article(
        self,
        site_name: str,
        cfg: dict,
        article_url: str,
        title_hint: str = "",
        verify: bool = True,
        headers: Optional[Dict[str, str]] = None,
    ) -> None:
        if not article_url or is_junk_url(article_url):
            return

        if self.is_duplicate(article_url):
            log.info(f"  ⏭️  Já existe: {article_url[:70]}")
            self.stats["skipped_dup"] += 1
            return

        title = title_hint
        if not title or len(title) < 5:
            log.debug(f"      ⏭️  Título muito curto ou vazio em {site_name}")
            return

        log.info(f"  ✨ Capturando: {title[:65]}...")

        # ── Busca Detalhe do Artigo ───────────────────────────────────
        detail_resp = self.session.get(
            article_url, timeout=15, verify=verify, headers=headers
        )
        detail_resp.raise_for_status()
        detail_soup = BeautifulSoup(decode_html(detail_resp), "html.parser")

        # Título: h1 do detalhe → <title> da página → listagem (limpos de colagens)
        final_title = pick_detail_title(detail_soup, title)
        if not final_title or len(final_title) < 5 or is_junk_title(final_title):
            log.debug(f"      ⏭️  Título inválido em {site_name}: {final_title!r}")
            return

        # ── Extração de Imagem (3 níveis + reparo de URL) ─────────────
        image_url = self.extract_image(detail_soup, cfg["base_url"])

        # ── Extração de Data (meta-tags, sem LLM) ─────────────────────
        published_at = self.extract_date(detail_soup)

        # ── Extração do Corpo (ordem de prioridade: article real > main) ─
        body_html, body_text = extract_body(detail_soup)

        # Fallback híbrido: corpo vazio/curto → LLM
        if self.sgai_enabled() and len((body_text or "").strip()) < 200:
            log.info("    🤖 Corpo BS4 fraco → fallback ScrapeGraphAI…")
            try:
                detail = self._sgai_detail(site_name, article_url)
                sgai_corpo = (detail.get("corpo") or "").strip()
                if len(sgai_corpo) >= 200:
                    body_html = self.corpo_to_html(sgai_corpo)
                    body_text = sgai_corpo
                    if not published_at:
                        published_at = self._to_iso(detail.get("data_publicacao") or "")
                    if image_url == RESOLVEAO_PLACEHOLDER and detail.get("imagem_url"):
                        img = detail["imagem_url"].strip()
                        img = re.sub(r"^https:/([^/])", r"https://\1", img)
                        if img.startswith("http"):
                            image_url = img
            except Exception as sgai_err:
                log.warning(f"    ⚠️  Fallback SGAI (detalhe) falhou: {sgai_err}")

        summary = self.get_summary(body_text)

        # ── Classificação e Prioridade ────────────────────────────────
        categoria, is_priority = self.classify(final_title, cfg.get("fixed_category", "Geral"))

        # ── Payload para Supabase (Check de Nulos e Colunas) ─────
        payload = {
            "titulo": clean_news_title(final_title)[:500],
            "resumo": (summary or "")[:1000],
            "corpo": fix_mojibake(body_html or "")[:50000],
            "imagem_url": image_url or RESOLVEAO_PLACEHOLDER,
            "categoria": categoria or "Geral",
            "fonte": site_name,
            "url_origem": article_url,
            "is_priority": bool(is_priority),
            "status": "publicado",
        }
        if published_at:
            payload["published_at"] = published_at

        success = self.db.insert("news_articles", payload)
        if success:
            label = "🔴 URGENTE" if is_priority else "✅"
            log.info(f"    {label} Guardada | Cat: {categoria} | Prio: {is_priority}")
            self.stats["saved"] += 1
        else:
            self.stats["errors"] += 1

        self.stats["processed"] += 1

    # ── Loop Principal ────────────────────────────────────────────────────
    def run(self, site_filter: Optional[List[str]] = None):
        """Itera por todos os sites de forma independente."""
        start_time = datetime.now(timezone.utc)
        sites = dict(SITES_CONFIG)
        if site_filter:
            wanted = {s.strip().lower() for s in site_filter}
            sites = {
                k: v
                for k, v in sites.items()
                if k.strip().lower() in wanted
                or v.get("base_url", "").lower().replace("https://", "").replace("http://", "").split("/")[0]
                in wanted
            }
        log.info(f"\n{'█' * 60}")
        log.info(f"  AngoNewsScraper v2 — INICIANDO VARREDURA")
        log.info(f"  {len(sites)} fontes configuradas | USE_SGAI={os.getenv('USE_SGAI', 'auto')} "
                 f"({'ativo' if self.sgai_enabled() else 'inativo'})")
        log.info(f"  {start_time.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        log.info(f"{'█' * 60}\n")

        for site_name, cfg in sites.items():
            self.scrape_site(site_name, cfg)

        elapsed = (datetime.now(timezone.utc) - start_time).seconds
        log.info(f"\n{'█' * 60}")
        log.info(f"  ✅ VARREDURA CONCLUÍDA em {elapsed}s")
        log.info(f"  📊 Processados:  {self.stats['processed']}")
        log.info(f"  💾 Guardados:    {self.stats['saved']}")
        log.info(f"  ⏭️  Duplicados:   {self.stats['skipped_dup']}")
        log.info(f"  ❌ Erros:        {self.stats['errors']}")
        log.info(f"{'█' * 60}\n")


# ─────────────────────────────────────────────
# PONTO DE ENTRADA
# ─────────────────────────────────────────────
if __name__ == "__main__":
    import argparse

    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))
    SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error("❌ Credenciais Supabase em falta. Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local")
        exit(1)

    parser = argparse.ArgumentParser(description="AngoNewsScraper v2 (BS4 + fallback SGAI)")
    parser.add_argument(
        "--site",
        action="append",
        default=[],
        help="Restringe a um site (ex.: --site ANGOP). Repetível.",
    )
    parser.add_argument(
        "--sgai",
        choices=["auto", "off"],
        default=None,
        help="Sobrescreve USE_SGAI para esta execução.",
    )
    args = parser.parse_args()

    if args.sgai is not None:
        os.environ["USE_SGAI"] = args.sgai

    db_client = SupabaseRestClient(SUPABASE_URL, SUPABASE_KEY)
    scraper = AngoNewsScraper(db_client)
    scraper.run(site_filter=args.site or None)
