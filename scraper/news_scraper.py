"""
AngoNewsScraper - Curadoria Inteligente de Notícias Angolanas
=============================================================
Alimenta a tabela `news_articles` no Supabase com notícias de Angola,
categorização automática e status 'pendente' para curadoria.

Portais Alvo: Expansão, Jornal de Angola, Angonotícias, TPA, Zimbo, PlatinaLine.
"""

import re
import os
import time
import json
import logging
import unicodedata
from datetime import datetime, timezone
from typing import Optional, List, Dict

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Configuração de Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("news_scraper.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("AngoNewsScraper")

# ─────────────────────────────────────────────
# CONFIGURAÇÃO DE CATEGORIZAÇÃO AUTOMÁTICA
# ─────────────────────────────────────────────
KEYWORDS = {
    'Economia': ['Kwanza', 'BNA', 'Câmbio', 'Inflação', 'Bancos', 'Petróleo', 'PIB', 'FMI'],
    'Oportunidades': ['Concurso', 'Vagas', 'Admissão', 'Investimento', 'Empresa', 'Negócios'],
    'Utilidade': ['Gasolina', 'Gasóleo', 'BI', 'Passaporte', 'Taxas', 'Saúde', 'Educação', 'Trânsito']
}

# ─────────────────────────────────────────────
# CONFIGURAÇÃO DOS SITES (MAPAS DE EXTRAÇÃO)
# ─────────────────────────────────────────────
NEWS_CONFIGS = [
    {
        "name": "Jornal de Angola (Economia)",
        "base_url": "https://www.jornaldeangola.ao",
        "list_url": "https://www.jornaldeangola.ao/ao/noticias/economia/",
        "article_selector": "article, .news-card",
        "fields": { "title": "h1, h2, .title", "link": "a", "image": "img" }
    },
    {
        "name": "TV Zimbo",
        "base_url": "https://www.tvzimbo.ao",
        "list_url": "https://www.tvzimbo.ao/noticias",
        "article_selector": "article",
        "fields": { "title": "h1, h2, h3, h4, .jeg_post_title", "link": "a", "image": "img" }
    },
    {
        "name": "PlatinaLine",
        "base_url": "https://platinaline.com",
        "list_url": "https://platinaline.com/category/noticias/",
        "article_selector": "article",
        "fields": { "title": "h1, h2, h3, h4, .post-title", "link": "a", "image": "img" }
    },
    {
        "name": "Expansão",
        "base_url": "https://www.expansao.co.ao",
        "list_url": "https://www.expansao.co.ao/economia.html",
        "article_selector": "article, .detalhe",
        "fields": { "title": "h1, h2, h3, .titulo", "link": "a", "image": "img" }
    },
    {
        "name": "Angonotícias",
        "base_url": "https://www.angonoticias.com",
        "list_url": "https://www.angonoticias.com/Artigos/canal/2/generalista",
        "article_selector": ".noticia, article, .item",
        "fields": { "title": "h1, h2, h3, .titulo", "link": "a", "image": "img" }
    }
]

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
        if filters: params.update(filters)
        resp = requests.get(f"{self.base_url}/rest/v1/{table}", headers={**self.headers, "Prefer": ""}, params=params, timeout=10)
        resp.raise_for_status()
        return resp.json()

    def insert(self, table: str, data: dict) -> bool:
        resp = requests.post(f"{self.base_url}/rest/v1/{table}", headers=self.headers, json=data, timeout=10)
        if resp.status_code >= 400: 
            log.error(f"Erro Supabase ({resp.status_code}): {resp.text}")
            log.error(f"Payload enviado: {json.dumps(data)}")
        resp.raise_for_status()
        return True

# ─────────────────────────────────────────────
# CLASSE PRINCIPAL
# ─────────────────────────────────────────────
class AngoNewsScraper:
    def __init__(self, db: SupabaseRestClient):
        self.db = db
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        })

    def sanitize_html(self, soup: BeautifulSoup) -> str:
        """Limpa o HTML removendo scripts e estilos."""
        for tag in soup(["script", "style", "iframe", "ins", "nav", "footer"]):
            tag.decompose()
        return str(soup)

    def classify(self, title: str) -> str:
        """Classifica a notícia com base em palavras-chave."""
        title_lower = title.lower()
        for category, kws in KEYWORDS.items():
            if any(kw.lower() in title_lower for kw in kws):
                return category
        return "Utilidade"  # Default

    def get_summary(self, text: str) -> str:
        """Gera um resumo de 200 caracteres."""
        clean_text = re.sub(r'\s+', ' ', text).strip()
        return clean_text[:200] + "..." if len(clean_text) > 200 else clean_text

    def check_duplicate(self, url: str) -> bool:
        """Evita duplicados no Supabase."""
        try:
            res = self.db.select("news_articles", filters={"url_origem": f"eq.{url}"}, columns="id")
            return len(res) > 0
        except: return False

    def scrape_articles(self, config: Dict):
        log.info(f"📰 Site: {config['name']}")
        try:
            resp = self.session.get(config['list_url'], timeout=15)
            soup = BeautifulSoup(resp.text, "html.parser")
            articles = soup.select(config['article_selector'])[:10]  # Lote de 10

            for art in articles:
                link_tag = art.select_one(config['fields']['link'])
                if not link_tag: continue
                
                url = link_tag.get('href', '')
                if not url.startswith('http'): 
                    url = config['base_url'].rstrip('/') + '/' + url.lstrip('/')
                
                if self.check_duplicate(url): continue

                title_tag = art.select_one(config['fields']['title'])
                title = title_tag.get_text(strip=True) if title_tag else "Sem Título"
                
                img_tag = art.select_one(config['fields']['image'])
                image_url = img_tag.get('src') or img_tag.get('data-src') if img_tag else None
                if image_url and not image_url.startswith('http'):
                    image_url = config['base_url'].rstrip('/') + '/' + image_url.lstrip('/')

                # Detalhe da notícia
                log.info(f"  ✨ Capturando: {title[:50]}...")
                detail_resp = self.session.get(url, timeout=10)
                detail_soup = BeautifulSoup(detail_resp.text, "html.parser")
                
                # Tentar encontrar corpo do texto (lógica genérica)
                body = detail_soup.find(['article', '.entry-content', '.content', '.post-content'])
                content_html = self.sanitize_html(body) if body else str(detail_soup.find('body'))
                summary = self.get_summary(body.get_text() if body else detail_soup.get_text())

                payload = {
                    "titulo": title,
                    "resumo": summary,
                    "corpo": content_html,
                    "imagem_url": image_url,
                    "categoria": self.classify(title),
                    "fonte": config['name'],
                    "url_origem": url,
                    "status": "pendente"
                }

                self.db.insert("news_articles", payload)
                log.info(f"    ✅ Guardada como Pendente")
                time.sleep(2) # Respeito ao servidor

        except Exception as e:
            log.error(f"❌ Erro em {config['name']}: {e}")

    def run(self, configs: List[Dict]):
        for cfg in configs:
            self.scrape_articles(cfg)

if __name__ == "__main__":
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))
    SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error("❌ Credenciais Supabase em falta no .env.local")
        exit(1)

    db_client = SupabaseRestClient(SUPABASE_URL, SUPABASE_KEY)
    scraper = AngoNewsScraper(db_client)
    scraper.run(NEWS_CONFIGS)
