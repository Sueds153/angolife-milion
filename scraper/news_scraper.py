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

ANGOLIFE_PLACEHOLDER = "https://angolife.app/placeholder-news.jpg"

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
        Nível 3: Placeholder AngoLife
        """
        # Nível 1: og:image
        og = soup.find("meta", property="og:image")
        if og and og.get("content"):
            return og["content"]

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

        # Nível 3: Placeholder AngoLife (Tratamento de Nulos)
        return ANGOLIFE_PLACEHOLDER

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
        clean = re.sub(r"\s+", " ", text).strip()
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
            soup = BeautifulSoup(resp.text, "html.parser")

            articles = soup.select(cfg["article_selector"])[:12]  # Máx 12 por ciclo
            if not articles:
                log.warning(f"  ⚠️  Nenhum artigo encontrado. Seletor: '{cfg['article_selector']}'.")
                # Depuração: Mostrar pedaço do HTML se não encontrar nada
                snippet = soup.prettify()[:1000].replace("\n", " ")
                log.debug(f"  Snippet do HTML ({site_name}): {snippet}")
                self.stats["errors"] += 1
                return

            log.info(f"  📋 {len(articles)} artigos encontrados. Processando...")

            for art in articles:
                self.stats["processed"] += 1
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

                    # ── Deduplicação ──────────────────────────────────────
                    if self.is_duplicate(article_url):
                        log.info(f"  ⏭️  Já existe: {article_url[:70]}")
                        self.stats["skipped_dup"] += 1
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

                    log.info(f"  ✨ Capturando: {title[:65]}...")

                    # ── Busca Detalhe do Artigo ────────────────────────────
                    detail_resp = self.session.get(article_url, timeout=15)
                    detail_resp.raise_for_status()
                    detail_soup = BeautifulSoup(detail_resp.text, "html.parser")

                    # Título mais preciso vindo da página de detalhe
                    detail_title_tag = detail_soup.select_one("h1, .entry-title, .article-title")
                    final_title = detail_title_tag.get_text(strip=True) if detail_title_tag else title
                    if not final_title or len(final_title) < 5:
                        final_title = title

                    # ── Extração de Imagem (3 níveis) ────────────────────
                    image_url = self.extract_image(detail_soup, cfg["base_url"])

                    # ── Extração do Corpo ─────────────────────────────────
                    body_area = detail_soup.select_one(
                        "article, .entry-content, .post-content, .content-body, "
                        ".article-content, .td-post-content, main"
                    )
                    body_html = self.sanitize_html(body_area) if body_area else ""
                    body_text = body_area.get_text(separator=" ") if body_area else detail_soup.get_text()
                    summary = self.get_summary(body_text)

                    # ── Classificação e Prioridade ────────────────────────
                    categoria, is_priority = self.classify(final_title, cfg.get("fixed_category", "Geral"))

                    # ── Payload para Supabase (Check de Nulos e Colunas) ─────
                    payload = {
                        "titulo": final_title[:500],
                        "resumo": (summary or "")[:1000],
                        "corpo": (body_html or "")[:50000],
                        "imagem_url": image_url or ANGOLIFE_PLACEHOLDER,
                        "categoria": categoria or "Geral",
                        "fonte": site_name,
                        "url_origem": article_url,
                        "is_priority": bool(is_priority),
                        "status": "pendente",
                    }

                    success = self.db.insert("news_articles", payload)
                    if success:
                        label = "🔴 URGENTE" if is_priority else "✅"
                        log.info(f"    {label} Guardada | Cat: {categoria} | Prio: {is_priority}")
                        self.stats["saved"] += 1
                    else:
                        self.stats["errors"] += 1

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

    # ── Loop Principal ────────────────────────────────────────────────────
    def run(self):
        """Itera por todos os sites de forma independente."""
        start_time = datetime.now(timezone.utc)
        log.info(f"\n{'█' * 60}")
        log.info(f"  AngoNewsScraper v2 — INICIANDO VARREDURA")
        log.info(f"  {len(SITES_CONFIG)} fontes configuradas")
        log.info(f"  {start_time.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        log.info(f"{'█' * 60}\n")

        for site_name, cfg in SITES_CONFIG.items():
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
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))
    SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error("❌ Credenciais Supabase em falta. Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local")
        exit(1)

    db_client = SupabaseRestClient(SUPABASE_URL, SUPABASE_KEY)
    scraper = AngoNewsScraper(db_client)
    scraper.run()
