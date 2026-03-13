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
# ─────────────────────────────────────────────────────────────────────────
# JOBS_CONFIG — Dicionário Unificado de Adaptadores (Ordenado por Peso)
# 1-2: HTML Estático (Leve) | 3-6: Dinâmicos | 7-8: Pesados (LinkedIn/JS)
# ─────────────────────────────────────────────────────────────────────────
JOBS_CONFIG: Dict[str, dict] = {
    "Contrata.ao": {
        "base_url": "https://contrata.ao",
        "list_url": "https://contrata.ao/vagas",
        "job_card_selector": "article, .job-item, .card-grid, .post, div:has(a[href*='/empregos/'])",
        "title_selector": "a[href*='/empregos/'], h3, h2",
        "company_selector": "a[href*='/Empresas/'], .company, .employer",
        "location_selector": ".location, .city",
        "link_selector": "a[href*='/empregos/']",
        "detail_enabled": True,
        "detail_description_selector": ".description, .content",
        "detail_requirements_selector": ".requirements",
        "request_delay_range": (1, 3),
    },
    "Ango Emprego": {
        "base_url": "https://angoemprego.com",
        "list_url": "https://angoemprego.com",
        "job_card_selector": "li.job_listing, .job-container",
        "title_selector": "h3",
        "company_selector": ".company",
        "location_selector": ".location",
        "link_selector": "a",
        "detail_enabled": True,
        "detail_description_selector": ".job_description",
        "detail_requirements_selector": ".entry-content ul",
        "request_delay_range": (1, 3),
    },
    "AngoVagas": {
        "base_url": "https://angovagas.net",
        "list_url": "https://angovagas.net",
        "job_card_selector": "article.l-post, .post-meta",
        "title_selector": "h2.post-title",
        "company_selector": ".author, .company",
        "location_selector": ".post-date",
        "link_selector": "a",
        "detail_enabled": True,
        "detail_description_selector": ".entry-content",
        "detail_requirements_selector": ".entry-content ul",
        "request_delay_range": (2, 4),
    },
    "INEFOP": {
        "base_url": "https://www.inefop.gov.ao",
        "list_url": "https://www.inefop.gov.ao/concursos",
        "job_card_selector": "div.card, article, tr",
        "title_selector": "h3, td, .title",
        "company_selector": None,
        "location_selector": ".provincia, td",
        "link_selector": "a",
        "detail_enabled": False, # SPA agressivo
        "fixed_company": "Estado Angolano (INEFOP)",
        "fixed_category": "Concurso Público",
        "request_delay_range": (3, 5),
    },
    "Emprega Angola": {
        "base_url": "https://empregangola.com",
        "list_url": "https://empregangola.com/vagas",
        "job_card_selector": "article.blog-post-default",
        "title_selector": "h2.entry-title",
        "company_selector": ".company-name",
        "location_selector": ".location",
        "link_selector": "a",
        "detail_enabled": True,
        "detail_description_selector": ".entry-content",
        "detail_requirements_selector": ".requirements, #requirements",
        "request_delay_range": (3, 5),
    },
    "Jobartis": {
        "base_url": "https://www.jobartis.com",
        "list_url": "https://www.jobartis.com/vagas-emprego/luanda",
        "job_card_selector": ".job, .thumbnail-card, .panel-default",
        "title_selector": ".job-link, h2, h3",
        "company_selector": "h5",
        "location_selector": "li, .location",
        "link_selector": "a.job-link, a",
        "detail_enabled": True,
        "detail_description_selector": ".job-description",
        "detail_requirements_selector": ".job-requirements",
        "request_delay_range": (3, 6),
    },
    "VerAngola": {
        "base_url": "https://www.verangola.net",
        "list_url": "https://www.verangola.net/va/pt/emprego/",
        "job_card_selector": ".card-type-news, .card",
        "title_selector": "h2.card-title",
        "company_selector": ".card-author, .company",
        "location_selector": ".card-section",
        "link_selector": "a",
        "detail_enabled": True,
        "detail_description_selector": ".card-deck, .article-content",
        "detail_requirements_selector": None,
        "request_delay_range": (3, 6),
    },
    "LinkedIn": {
        "base_url": "https://www.linkedin.com",
        "list_url": "https://www.linkedin.com/jobs/search/?keywords=angola&location=Angola&f_TPR=r86400",
        "job_card_selector": ".job-search-card, .base-card",
        "title_selector": "h3.base-search-card__title",
        "company_selector": "h4.base-search-card__subtitle",
        "location_selector": ".job-search-card__location",
        "link_selector": "a.base-card__full-link",
        "detail_enabled": False, # LinkedIn blockeia scraping de detalhe sem login agressivo
        "request_delay_range": (6, 12),
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
        "Accept-Encoding": "gzip, deflate",
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
        try:
            # Mescla headers se extra_headers for fornecido
            headers = self.session.headers.copy()
            if extra_headers:
                headers.update(extra_headers)
                
            resp = self.session.get(url, headers=headers, timeout=45)
            # log.debug(f"Fetch {url} - Status: {resp.status_code} - KB: {len(resp.text)/1024:.1f}")
            
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

    # ── Loop Principal: Round-Robin (Rodízio) ─────────────────────────────
    def run(self, max_total_vagas: int = 100):
        """
        Executa o motor em ciclos: 5 vagas por fonte em cada iteração.
        Garante diversidade de fontes no banco de dados.
        """
        start = datetime.now(timezone.utc)
        log.info(f"\n{'█' * 60}")
        log.info(f"  AngoJobScraper v2.5 — MODO RODÍZIO ATIVADO")
        log.info(f"  {len(JOBS_CONFIG)} fontes em ciclo | Meta: {max_total_vagas} vagas")
        log.info(f"{'█' * 60}\n")

        # Cache de sopas por fonte para não pedir a home 1000 vezes
        soups_cache = {}
        processed_links_per_site = {name: set() for name in JOBS_CONFIG}
        indices_per_site = {name: 0 for name in JOBS_CONFIG}

        while self.stats["saved"] < max_total_vagas:
            saved_this_cycle = 0
            
            for site_name, cfg in JOBS_CONFIG.items():
                if self.stats["saved"] >= max_total_vagas:
                    break
                
                log.info(f"🔄 Ciclo: {site_name} (Início no índice {indices_per_site[site_name]})")
                
                try:
                    if site_name not in soups_cache:
                        soups_cache[site_name] = self._fetch(cfg["list_url"], cfg.get("extra_headers"))
                    
                    soup = soups_cache[site_name]
                    if not soup:
                        continue
                        
                    cards = soup.select(cfg["job_card_selector"])
                    if not cards:
                        log.warning(f"  ⚠️  Nenhum card em {site_name}. Tentando auto-deteção...")
                        detected = self._auto_detect_selector(soup)
                        if detected: cards = soup.select(detected)
                    
                    if not cards:
                        continue

                    # Pega as próximas 5 vagas não processadas
                    count_in_cycle = 0
                    current_idx = indices_per_site[site_name]
                    
                    while count_in_cycle < 5 and current_idx < len(cards):
                        card = cards[current_idx]
                        current_idx += 1
                        
                        # Extração de Link
                        link_tag = card.select_one(cfg["link_selector"]) or card.find("a")
                        raw_url = link_tag.get("href", "") if link_tag else ""
                        job_url = self._normalize_url(raw_url, cfg["base_url"])
                        
                        if not job_url:
                            continue
                        if job_url in processed_links_per_site[site_name]:
                            log.debug(f"  ⏭️  Link já visto neste ciclo: {job_url}")
                            continue
                        
                        processed_links_per_site[site_name].add(job_url)
                        
                        # Processar Vaga
                        success = self._process_card(card, job_url, site_name, cfg)
                        if success:
                            count_in_cycle += 1
                            saved_this_cycle += 1
                            self.stats["saved"] += 1
                    
                    indices_per_site[site_name] = current_idx
                    
                except Exception as e:
                    log.error(f"❌ Erro no ciclo de {site_name}: {e}")
                    continue

            if saved_this_cycle == 0:
                log.info("🏁 Nenhuma nova vaga encontrada em todas as fontes. Finalizando.")
                break
            
            log.info(f"📊 Fim do Ciclo. Total guardado: {self.stats['saved']}/{max_total_vagas}")

        elapsed = (datetime.now(timezone.utc) - start).seconds
        log.info(f"\n{'█' * 60}")
        log.info(f"  🏁 VARREDURA CONCLUÍDA em {elapsed}s")
        log.info(f"  📊 Estatísticas Finais:")
        log.info(f"     → Guardados:   {self.stats['saved']}")
        log.info(f"     → Erros:       {self.stats['errors']}")
        log.info(f"{'█' * 60}\n")

    def _process_card(self, card, job_url, site_name, cfg) -> bool:
        """Extração e inserção de uma única vaga."""
        try:
            # 1. Deduplicação URL
            if self._is_duplicate_url(job_url):
                return False

            # 2. Título & Empresa (Obrigatórios)
            title_tag = card.select_one(cfg["title_selector"])
            title = self._clean(title_tag.get_text() if title_tag else "")
            
            company = cfg.get("fixed_company", "")
            if not company and cfg.get("company_selector"):
                comp_tag = card.select_one(cfg["company_selector"])
                company = self._clean(comp_tag.get_text() if comp_tag else "")
            if not company: company = "Empresa Confidencial"

            if not title or not company:
                log.warning(f"  ⏭️  Card sem título ou empresa em {site_name}")
                return False

            # 3. Localização
            loc_tag = card.select_one(cfg["location_selector"]) if cfg.get("location_selector") else None
            location = self._clean(loc_tag.get_text() if loc_tag else "Angola")

            # 4. DEEP SCRAPING (Página de Detalhe)
            description = ""
            requirements_list = []
            image_url = ""
            email = ""

            if cfg.get("detail_enabled") and job_url:
                self._human_delay(cfg.get("request_delay_range", (2, 4)))
                detail_soup = self._fetch(job_url, cfg.get("extra_headers"))
                if detail_soup:
                    # Descrição
                    desc_sel = cfg.get("detail_description_selector")
                    desc_tag = detail_soup.select_one(desc_sel) if desc_sel else None
                    if desc_tag:
                        description = self._clean(desc_tag.get_text(separator="\n"))
                    
                    # Requisitos (Convertendo para Lista)
                    req_sel = cfg.get("detail_requirements_selector")
                    req_tag = detail_soup.select_one(req_sel) if req_sel else None
                    if req_tag:
                        req_text = self._clean(req_tag.get_text(separator="\n"))
                        # Split por quebra de linha, filtra vazios e limpa espaços
                        requirements_list = [r.strip("- •").strip() for r in req_text.split("\n") if r.strip()]
                    
                    # Imagem/Logo
                    image_url = self._extract_image(detail_soup, cfg["base_url"])
                    
                    # Email por Regex na descrição profunda
                    email = self._extract_email(detail_soup.get_text())
            
            # 5. Fallbacks e Limpeza
            if not image_url:
                image_url = self._get_category_placeholder(title)
            
            if not email:
                # Se não houver email, guardamos o link de candidatura
                email = f"Candidatar via: {job_url}"

            categoria = self._categorize(title, cfg.get("fixed_category"))

            payload = {
                "title": title[:255],
                "company": company[:255],
                "location": location[:255],
                "description": description[:5000],
                "requirements": requirements_list, # Enviado como ARRAY JSON para o Supabase
                "application_email": email[:255],
                "imagem_url": image_url,
                "source_url": job_url,
                "categoria": categoria,
                "status": "pendente",
                "posted_at": datetime.now(timezone.utc).isoformat(),
            }

            return self.db.insert("jobs", payload)

        except Exception as e:
            log.warning(f"  ⚠️ Erro ao processar card: {e}")
            self.stats["errors"] += 1
            return False

    def _get_category_placeholder(self, title: str) -> str:
        """Retorna uma imagem por categoria se o logo não for encontrado."""
        cat = self._categorize(title)
        placeholders = {
            "Tecnologia": "https://img.icons8.com/color/144/code.png",
            "Gestão": "https://img.icons8.com/color/144/manager.png",
            "Finanças": "https://img.icons8.com/color/144/money-bag-lira.png",
            "Saúde": "https://img.icons8.com/color/144/hospital.png",
            "Engenharia": "https://img.icons8.com/color/144/engineering.png",
            "Vendas & Marketing": "https://img.icons8.com/color/144/megaphone.png",
            "Geral": "https://img.icons8.com/color/144/company.png"
        }
        return placeholders.get(cat, placeholders["Geral"])


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
