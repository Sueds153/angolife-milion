"""
AngoJobScraper v2 — Super Motor de Vagas de Emprego Angolanas
=============================================================
Arquitetura de 'Adaptadores' unificada com suporte a 8+ fontes.

Fontes configuradas:
  1. AngoEmprego.com     → Plataforma nacional líder
  2. AngoVagas.net       → WordPress, volume médio
  3. Emprega Angola      → Portal nacional moderno
  4. INEFOP              → Concursos Públicos e Estado
  5. Careerjet Angola    → Volume de vagas classe média
  6. Mirantes            → Talatona / Luanda Sul
  7. AngoJob.net         → Portal agregador angolano
  8. LinkedIn (Público)  → Vagas públicas sem login

Funcionalidades:
  ✅ JOBS_CONFIG — dicionário unificado de adaptadores
  ✅ Chrome v122 User-Agent real (anti-403/bloqueios)
  ✅ Deduplicação dupla: por source_url E por (title + company)
  ✅ Categorização automática por palavras-chave no título
  ✅ Extração de imagem: og:image → logo img → None
  ✅ Extração de e-mail por regex na página de detalhe
  ✅ 2-5s de delay aleatório entre requests (simulação humana)
  ✅ Per-site try-except blindado — falha isolada por fonte
  ✅ Log de estatísticas completo no final

Dependências:
    pip install requests beautifulsoup4 python-dotenv
"""

import re
import os
import time
import json
import random
import logging
import unicodedata
from datetime import datetime, timezone
from typing import Optional, List, Dict
from urllib.parse import urljoin, urlparse

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
        logging.FileHandler("jobs_scraper.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("AngoJobScraper")

# ─────────────────────────────────────────────────────────────────────────
# INTELIGÊNCIA: Categorização automática de vagas por título
# ─────────────────────────────────────────────────────────────────────────
CATEGORY_MAP = {
    "Tecnologia": [
        "IT", "TI", "Informática", "Developer", "Desenvolvedor", "Programador",
        "Software", "Sistemas", "Redes", "Cibersegurança", "Data", "Python", "Java",
        "Frontend", "Backend", "Fullstack", "DevOps", "Cloud", "Suporte Técnico"
    ],
    "Gestão": [
        "Gerente", "Gestor", "Director", "Diretor", "Manager", "Supervisor",
        "Coordenador", "Coordenação", "CEO", "CFO", "COO", "Chefe", "Responsável"
    ],
    "Finanças": [
        "Contabilista", "Contabilidade", "Financeiro", "Finanças", "Auditor",
        "Auditoria", "Tesoureiro", "Economista", "Análise Financeira", "Fiscal"
    ],
    "Saúde": [
        "Médico", "Enfermeiro", "Enfermeira", "Farmacêutico", "Técnico de Saúde",
        "Saúde", "Clínica", "Hospital", "Dentista", "Fisioterapeuta"
    ],
    "Engenharia": [
        "Engenheiro", "Engenharia", "Civil", "Mecânico", "Elétrico", "Topógrafo",
        "Construção", "Estrutural", "Petróleo", "Petroquímica", "Minas"
    ],
    "Educação": [
        "Professor", "Professora", "Docente", "Educador", "Formador",
        "Tutor", "Ensino", "Escola", "Universidade", "Docência"
    ],
    "Logística": [
        "Motorista", "Logística", "Armazém", "Transporte", "Estoca",
        "Distribuição", "Supply Chain", "Compras", "Procurement", "Frota"
    ],
    "Limpeza & Serviços": [
        "Limpeza", "Higiene", "Lavandaria", "Copeiro", "Cozinheiro",
        "Segurança", "Porteiro", "Recepcionista", "Assistente"
    ],
    "Vendas & Marketing": [
        "Vendedor", "Vendas", "Comercial", "Marketing", "Publicidade",
        "Relações Públicas", "Social Media", "E-commerce", "Representante Comercial"
    ],
    "Concurso Público": [
        "Concurso", "Estado", "Governo", "Ministério", "INEFOP", 
        "Público", "Municipal", "Provincial", "Administração Pública"
    ],
}

# ─────────────────────────────────────────────────────────────────────────
# JOBS_CONFIG — Dicionário Unificado de Adaptadores
# Cada chave é o nome do portal. Os valores são os seletores CSS específicos.
# ─────────────────────────────────────────────────────────────────────────
JOBS_CONFIG: Dict[str, dict] = {

    # ── 1. ANGOLA EMPREGO ──────────────────────────────────────────────────
    # Principal portal local.
    "Angola Emprego": {
        "base_url": "https://www.angola-emprego.com",
        "list_url": "https://www.angola-emprego.com",
        "job_card_selector": ".job-item, .post-item, article",
        "title_selector": ".job-title, h3, h2.entry-title",
        "company_selector": ".company-name, .employer",
        "location_selector": ".location, .city",
        "link_selector": "a",
        "detail_enabled": True,
        "detail_description_selector": ".job-description, .entry-content",
        "request_delay_range": (3, 5),
    },

    # ── 2. ANGO EMPREGO ────────────────────────────────────────────────────
    "Ango Emprego": {
        "base_url": "https://ango-emprego.com",
        "list_url": "https://ango-emprego.com",
        "job_card_selector": "article, .job_listing",
        "title_selector": "h3, .title",
        "company_selector": ".company, strong",
        "location_selector": ".location",
        "link_selector": "a",
        "detail_enabled": True,
        "detail_description_selector": ".job_description, .content",
        "request_delay_range": (2, 4),
    },

    # ── 3. EMPREGA ANGOLA ─────────────────────────────────────────────────
    "Emprega Angola": {
        "base_url": "https://www.empregaangola.com",
        "list_url": "https://www.empregaangola.com/empregos",
        "job_card_selector": ".job-item, article, .card",
        "title_selector": "h2, h3, .job-title",
        "company_selector": ".company, .employer-name",
        "location_selector": ".location, .province",
        "link_selector": "a",
        "detail_enabled": True,
        "detail_description_selector": ".job-description, .vacancy-body",
        "request_delay_range": (2, 4),
    },

    # ── 4. ANGOVAGAS.NET ──────────────────────────────────────────────────
    "AngoVagas": {
        "base_url": "https://angovagas.net",
        "list_url": "https://angovagas.net",
        "job_card_selector": "article.post, .post",
        "title_selector": "h2.entry-title, h2",
        "company_selector": ".author, .company",
        "location_selector": ".location, .entry-meta",
        "link_selector": "a",
        "detail_enabled": True,
        "detail_description_selector": ".entry-content",
        "request_delay_range": (2, 5),
    },

    # ── 5. INEFOP ─────────────────────────────────────────────────────────
    # Instituto Nacional do Emprego e Formação Profissional.
    "INEFOP": {
        "base_url": "https://www.inefop.gov.ao",
        "list_url": "https://www.inefop.gov.ao/concursos",
        "job_card_selector": "article, .concurso-item",
        "title_selector": "h1, h2, h3, .entry-title",
        "company_selector": None,
        "location_selector": ".location, .provincia",
        "link_selector": "a",
        "detail_enabled": True,
        "detail_description_selector": ".entry-content, article",
        "fixed_company": "Estado Angolano (INEFOP)",
        "fixed_category": "Concurso Público",
        "request_delay_range": (3, 5),
    },

    # ── 6. CAREERJET ANGOLA ───────────────────────────────────────────────
    "Careerjet Angola": {
        "base_url": "https://www.careerjet.co.ao",
        "list_url": "https://www.careerjet.co.ao/jobs.html?ISOCountry=AO&locale_code=pt_AO",
        "job_card_selector": "li.job, article.job",
        "title_selector": "h2, .title, a[href*='job']",
        "company_selector": ".company, p.company",
        "location_selector": ".location, .city",
        "link_selector": "header a, h2 a",
        "detail_enabled": False,
        "request_delay_range": (3, 5),
    },

    # ── 7. MIRANTES ───────────────────────────────────────────────────────
    # Foco em Talatona / Luanda Sul.
    "Mirantes": {
        "base_url": "https://www.mirantes.ao",
        "list_url": "https://www.mirantes.ao/emprego",
        "job_card_selector": ".job-listing, article, .post",
        "title_selector": "h2, h3, .job-title",
        "company_selector": ".company, .employer",
        "location_selector": ".location, .city",
        "link_selector": "a",
        "detail_enabled": True,
        "detail_description_selector": ".job-description, .entry-content",
        "request_delay_range": (2, 4),
    },

    # ── 8. LINKEDIN ───────────────────────────────────────────────────────
    "LinkedIn": {
        "base_url": "https://www.linkedin.com",
        "list_url": "https://www.linkedin.com/jobs/search/?keywords=angola&location=Angola&f_TPR=r86400",
        "job_card_selector": ".job-search-card, .base-card",
        "title_selector": "h3.base-search-card__title",
        "company_selector": "h4.base-search-card__subtitle",
        "location_selector": ".job-search-card__location",
        "link_selector": "a.base-card__full-link",
        "detail_enabled": False,
        "request_delay_range": (5, 8),
        "extra_headers": {
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
        },
    },
}



# ─────────────────────────────────────────────
# CLIENTE SUPABASE REST (SEM supabase-py)
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
                log.error(f"Payload com erro: {json.dumps(data, ensure_ascii=False)[:300]}")
                return False
            return True
        except Exception as e:
            log.error(f"💥 Falha de conexão Supabase: {e}")
            return False


# ─────────────────────────────────────────────
# MOTOR PRINCIPAL — AngoJobScraper v2
# ─────────────────────────────────────────────
class AngoJobScraper:
    # Chrome v122 User-Agent — contorna a maioria dos bloqueios básicos
    BASE_HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-AO,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Referer": "https://www.google.com/",
        "Cache-Control": "no-cache",
    }

    EMAIL_REGEX = re.compile(
        r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
    )

    def __init__(self, db: SupabaseRestClient):
        self.db = db
        self.session = requests.Session()
        self.session.headers.update(self.BASE_HEADERS)
        self.stats = {"processed": 0, "saved": 0, "skipped_dup": 0, "errors": 0}

    # ── Utilidades ────────────────────────────────────────────────────────
    def _clean(self, text: Optional[str]) -> str:
        if not text:
            return ""
        text = unicodedata.normalize("NFKC", text)
        text = re.sub(r"[\x00-\x08\x0b-\x1f\x7f]", "", text)
        return re.sub(r"\s+", " ", text).strip()

    def _normalize_url(self, url: str, base_url: str) -> str:
        if not url:
            return ""
        if url.startswith("http"):
            return url
        return urljoin(base_url, url)

    def _extract_email(self, text: str) -> Optional[str]:
        match = self.EMAIL_REGEX.search(text or "")
        return match.group(0) if match else None

    def _human_delay(self, delay_range: tuple):
        """Simula atraso humano aleatório entre requests."""
        secs = random.uniform(*delay_range)
        log.info(f"  ⏳ Aguardando {secs:.1f}s (simulação humana)...")
        time.sleep(secs)

    def _fetch(self, url: str, extra_headers: dict = None) -> Optional[BeautifulSoup]:
        """Faz o request e retorna BeautifulSoup, ou None se falhar."""
        headers = {}
        if extra_headers:
            headers.update(extra_headers)
        try:
            resp = self.session.get(url, headers=headers, timeout=20)
            resp.raise_for_status()
            resp.encoding = resp.apparent_encoding or "utf-8"
            return BeautifulSoup(resp.text, "html.parser")
        except requests.RequestException as e:
            log.warning(f"  ⚠️  Falha no request para {url}: {e}")
            return None

    # ── Extração de Imagem ────────────────────────────────────────────────
    def _extract_image(self, soup: BeautifulSoup, base_url: str) -> Optional[str]:
        """Extrai imagem: og:image → primeira img relevante → None."""
        og = soup.find("meta", property="og:image")
        if og and og.get("content"):
            return og["content"]
        # Procura logo da empresa em imagens
        for img in soup.find_all("img")[:5]:
            src = img.get("src") or img.get("data-src")
            if src and any(kw in src.lower() for kw in ["logo", "company", "employer", "brand"]):
                return self._normalize_url(src, base_url)
        return None

    # ── Categorização Automática ──────────────────────────────────────────
    def _categorize(self, title: str, fixed_category: str = None) -> str:
        """Atribui categoria com base em palavras-chave no título."""
        if fixed_category:
            return fixed_category
        title_lower = title.lower()
        for category, keywords in CATEGORY_MAP.items():
            if any(kw.lower() in title_lower for kw in keywords):
                return category
        return "Geral"

    # ── Deduplicação Dupla ────────────────────────────────────────────────
    def _is_duplicate_url(self, source_url: str) -> bool:
        """Verifica se a URL de origem já existe."""
        try:
            res = self.db.select("jobs", filters={"source_url": f"eq.{source_url}"}, columns="id")
            return len(res) > 0
        except Exception:
            return False

    def _is_duplicate_composite(self, title: str, company: str) -> bool:
        """
        Deduplicação inteligente: mesma vaga publicada em múltiplos sites.
        Se título E empresa forem idênticos, é considerado duplicado.
        """
        if not title or not company or company == "Empresa Confidencial":
            return False
        try:
            res = self.db.select(
                "jobs",
                filters={"title": f"eq.{title}", "company": f"eq.{company}"},
                columns="id",
            )
            return len(res) > 0
        except Exception:
            return False

    # ── Auto-Detecção de Seletor ──────────────────────────────────────────
    def _auto_detect_selector(self, soup: BeautifulSoup) -> Optional[str]:
        candidates = [
            "li.job_listing", "article.job_listing", ".job-listing",
            ".job-item", ".vacancy-item", "li.job", ".job_item",
            ".base-card", "article.post", ".post", "article",
        ]
        for sel in candidates:
            items = soup.select(sel)
            if len(items) >= 2:
                log.info(f"  🔍 Seletor auto-detectado: '{sel}' ({len(items)} itens)")
                return sel
        return None

    # ── Scraper por Site ──────────────────────────────────────────────────
    def scrape_site(self, site_name: str, cfg: dict):
        """
        Processa um único site de forma isolada.
        Falha no site → log de erro → salta para o próximo. Nunca para o motor todo.
        """
        log.info(f"\n{'═' * 60}")
        log.info(f"💼 FONTE: {site_name}")
        log.info(f"   URL: {cfg['list_url']}")
        log.info(f"{'═' * 60}")

        try:
            soup = self._fetch(cfg["list_url"], extra_headers=cfg.get("extra_headers"))
            if not soup:
                log.error(f"❌ {site_name} inacessível. Saltando para o próximo...")
                self.stats["errors"] += 1
                return

            # Tentar seletor configurado, depois auto-detecção
            cards = soup.select(cfg["job_card_selector"])
            if not cards:
                log.warning(f"  ⚠️  Seletor '{cfg['job_card_selector']}' sem resultados. A tentar auto-detecção...")
                detected = self._auto_detect_selector(soup)
                if detected:
                    cards = soup.select(detected)
                else:
                    log.error(f"  ❌ Não foi possível encontrar cards em {site_name}. Saltando.")
                    self.stats["errors"] += 1
                    return

            log.info(f"  📋 {len(cards)} cards encontrados. Processando...")

            for card in cards[:15]:  # Máx 15 por site por ciclo
                self.stats["processed"] += 1
                try:
                    # ── Link ──────────────────────────────────────────────
                    link_tag = card.select_one(cfg["link_selector"]) or card.find("a")
                    raw_url = link_tag.get("href", "") if link_tag else ""
                    job_url = self._normalize_url(raw_url, cfg["base_url"])

                    # ── Deduplicação por URL ──────────────────────────────
                    if job_url and self._is_duplicate_url(job_url):
                        log.info(f"  ⏭️  Duplicado (URL): {job_url[:70]}")
                        self.stats["skipped_dup"] += 1
                        continue

                    # ── Título ────────────────────────────────────────────
                    title_tag = card.select_one(cfg["title_selector"])
                    title = self._clean(title_tag.get_text() if title_tag else "")
                    if not title or len(title) < 4:
                        continue

                    # ── Empresa ───────────────────────────────────────────
                    company = cfg.get("fixed_company", "")
                    if not company and cfg.get("company_selector"):
                        company_tag = card.select_one(cfg["company_selector"])
                        company = self._clean(company_tag.get_text() if company_tag else "")
                    if not company:
                        company = "Empresa Confidencial"

                    # ── Deduplicação por (Título + Empresa) ───────────────
                    if self._is_duplicate_composite(title, company):
                        log.info(f"  ⏭️  Duplicado (título+empresa): {title[:50]} @ {company}")
                        self.stats["skipped_dup"] += 1
                        continue

                    # ── Localização ───────────────────────────────────────
                    location_tag = card.select_one(cfg["location_selector"]) if cfg.get("location_selector") else None
                    location = self._clean(location_tag.get_text() if location_tag else "Angola")
                    if not location:
                        location = "Angola"

                    # ── Detalhe da Vaga ───────────────────────────────────
                    description = ""
                    contact_email = None
                    image_url = None

                    if cfg.get("detail_enabled") and job_url:
                        self._human_delay(cfg.get("request_delay_range", (2, 3)))
                        log.info(f"  📄 Abrindo detalhe: {title[:50]}...")
                        detail_soup = self._fetch(job_url, extra_headers=cfg.get("extra_headers"))
                        if detail_soup:
                            detail_sel = cfg.get("detail_description_selector", ".entry-content")
                            body = detail_soup.select_one(detail_sel)
                            if body:
                                description = self._clean(body.get_text(separator=" "))[:3000]
                            contact_email = self._extract_email(detail_soup.get_text())
                            image_url = self._extract_image(detail_soup, cfg["base_url"])
                    else:
                        contact_email = self._extract_email(card.get_text())
                        image_url = self._extract_image(card, cfg["base_url"])
                        self._human_delay(cfg.get("request_delay_range", (2, 4)))

                    # ── Categoria ─────────────────────────────────────────
                    categoria = self._categorize(title, cfg.get("fixed_category"))

                    # ── Payload Supabase (Mantendo fidelidade ao Schema e Front-end) ──────
                    # Imagem e Categoria tratadas como strings para evitar erros de nulo se a coluna for obrigatória
                    payload = {
                        "title": title[:255],
                        "company": company[:255],
                        "location": location[:255],
                        "description": description or "",
                        "application_email": contact_email or "",
                        "imagem_url": image_url or "",
                        "source_url": job_url or None,
                        "categoria": categoria or "Geral",
                        "status": "pendente",
                        "posted_at": datetime.now(timezone.utc).isoformat(),
                    }

                    success = self.db.insert("jobs", payload)
                    if success:
                        log.info(f"  ✅ Guardada: [{category}] {title[:55]} @ {company}")
                        self.stats["saved"] += 1
                    else:
                        self.stats["errors"] += 1

                except Exception as card_err:
                    log.warning(f"  ⚠️  Erro num card de {site_name}: {card_err}")
                    continue

            time.sleep(3)  # Pausa entre sites

        except Exception as site_err:
            # Blindagem total — erro no site nunca para o motor
            log.error(f"❌ SITE FALHADO: {site_name} — {site_err}")
            log.error(f"   → A saltar para o próximo site...")
            self.stats["errors"] += 1

    # ── Loop Principal ────────────────────────────────────────────────────
    def run(self):
        """Itera por todos os sites de forma independente."""
        start = datetime.now(timezone.utc)
        log.info(f"\n{'█' * 60}")
        log.info(f"  AngoJobScraper v2 — SUPER MOTOR DE EMPREGOS")
        log.info(f"  {len(JOBS_CONFIG)} fontes configuradas")
        log.info(f"  {start.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        log.info(f"{'█' * 60}\n")

        for site_name, cfg in JOBS_CONFIG.items():
            self.scrape_site(site_name, cfg)

        elapsed = (datetime.now(timezone.utc) - start).seconds
        log.info(f"\n{'█' * 60}")
        log.info(f"  🏁 VARREDURA CONCLUÍDA em {elapsed}s")
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
        log.critical(
            "❌ Credenciais Supabase em falta. "
            "Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local"
        )
        exit(1)

    log.info(f"🔗 Supabase: {SUPABASE_URL}")
    db = SupabaseRestClient(url=SUPABASE_URL, key=SUPABASE_KEY)
    scraper = AngoJobScraper(db=db)
    scraper.run()
