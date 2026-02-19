"""
RetailDealsScraper v1 — Motor de Agregação de Promoções Angolanas
================================================================
Arquitetura de 'Adaptadores' unificada para redes de supermercados.

Redes Configuradas:
  - Grandes: Kero, Candando, Shoprite, Kibabo
  - Especialistas: Fresmart, Angomart, Alimenta Angola
  - Locais: Novo São Paulo, Arreio
"""

import re
import os
import time
import logging
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
        logging.FileHandler("retail_scraper.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("RetailDealsScraper")

# ─────────────────────────────────────────────────────────────────────────
# RETAIL_CONFIG — Dicionário Global de Adaptadores
# ─────────────────────────────────────────────────────────────────────────
RETAIL_CONFIG: Dict[str, dict] = {
    # ── GRANDES REDES ──────────────────────────────────────────────────
    "Kero": {
        "base_url": "https://www.kero-angola.com",
        "promo_url": "https://www.kero-angola.com/promocoes",
        "item_selector": ".product-item, .product-card",
        "name_selector": ".product-title, h3",
        "price_selector": ".price, .special-price",
        "old_price_selector": ".old-price, .regular-price",
        "img_selector": "img.product-image",
        "category": "Misto"
    },
    "Candando": {
        "base_url": "https://www.candando.com",
        "promo_url": "https://www.candando.com/promocoes",
        "item_selector": ".product-item-info",
        "name_selector": ".product-item-name",
        "price_selector": ".special-price .price",
        "old_price_selector": ".old-price .price",
        "img_selector": ".product-image-photo",
        "category": "Alimentação"
    },
    "Shoprite": {
        "base_url": "https://www.shoprite.co.ao",
        "promo_url": "https://www.shoprite.co.ao/promocoes.html",
        "item_selector": ".item-product",
        "name_selector": ".name",
        "price_selector": ".special-price",
        "old_price_selector": ".old-price",
        "img_selector": "img",
        "category": "Alimentação"
    },
    "Kibabo": {
        "base_url": "https://kibabo.co.ao",
        "promo_url": "https://kibabo.co.ao/produtos-em-promocao/",
        "item_selector": "li.product",
        "name_selector": ".woocommerce-loop-product__title",
        "price_selector": "ins .amount",
        "old_price_selector": "del .amount",
        "img_selector": "img",
        "category": "Misto"
    },

    # ── ESPECIALISTAS ───────────────────────────────────────────────────
    "Fresmart": {
        "base_url": "https://fresmart.ao",
        "promo_url": "https://fresmart.ao/promocoes/",
        "item_selector": ".product-grid-item",
        "name_selector": ".wd-entities-title",
        "price_selector": ".price ins .amount",
        "old_price_selector": ".price del .amount",
        "img_selector": "img",
        "category": "Alimentação"
    },
    "Angomart": {
        "base_url": "https://angomart.com",
        "promo_url": "https://angomart.com/promocoes",
        "item_selector": "article.product-miniature",
        "name_selector": ".product-title",
        "price_selector": ".current-price",
        "old_price_selector": ".regular-price",
        "img_selector": "img",
        "category": "Higiene/Alimentação"
    },
    "Alimenta Angola": {
        "base_url": "https://alimentaangola.com",
        "promo_url": "https://alimentaangola.com/promocoes",
        "item_selector": ".product-card",
        "name_selector": ".title",
        "price_selector": ".new-price",
        "old_price_selector": ".old-price",
        "img_selector": "img",
        "category": "Atacado"
    },

    # ── LOCAIS / ATACADO ───────────────────────────────────────────────
    "Novo São Paulo": {
        "base_url": "https://novosaopaulo.co.ao",
        "promo_url": "https://novosaopaulo.co.ao/promocoes",
        "item_selector": ".item",
        "name_selector": ".product-name",
        "price_selector": ".price-promo",
        "old_price_selector": ".price-old",
        "img_selector": "img",
        "category": "Alimentação"
    },
    "Arreio": {
        "base_url": "https://arreio.ao",
        "promo_url": "https://arreio.ao/promocoes",
        "item_selector": ".deal-item",
        "name_selector": ".name",
        "price_selector": ".current",
        "old_price_selector": ".was",
        "img_selector": "img",
        "category": "Limpeza"
    }
}

# ─────────────────────────────────────────────────────────────────────────
# CLIENTE SUPABASE (Minimalista para Redução de Dependências)
# ─────────────────────────────────────────────────────────────────────────
class SupabaseRestClient:
    def __init__(self, url: str, key: str):
        self.base_url = f"{url}/rest/v1"
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }

    def insert(self, table: str, data: dict):
        try:
            res = requests.post(f"{self.base_url}/{table}", headers=self.headers, json=data)
            return res.status_code in [200, 201]
        except Exception as e:
            log.error(f"  ❌ Erro Supabase: {e}")
            return False

    def product_exists(self, product_name: str, store: str):
        try:
            # Check for duplication by product name and store
            url = f"{self.base_url}/product_deals?product=eq.{product_name}&store=eq.{store}"
            res = requests.get(url, headers=self.headers)
            if res.status_code == 200:
                return len(res.json()) > 0
            return False
        except:
            return False

# ─────────────────────────────────────────────────────────────────────────
# MOTOR PRINCIPAL
# ─────────────────────────────────────────────────────────────────────────
class AngoRetailScraper:
    def __init__(self, db: SupabaseRestClient):
        self.db = db
        self.stats = {"processed": 0, "saved": 0, "skipped_dup": 0, "errors": 0}
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }

    def clean_price(self, price_str: str) -> float:
        """Limpa 'Kz', 'AKZ', pontos e vírgulas para retornar float."""
        if not price_str: return 0.0
        # Remove símbolos e espaços
        cleaned = re.sub(r'[^\d,.]', '', price_str)
        # Se houver vírgula e ponto, assumimos vírgula como decimal (padrão AO)
        if ',' in cleaned and '.' in cleaned:
             cleaned = cleaned.replace('.', '').replace(',', '.')
        elif ',' in cleaned:
             cleaned = cleaned.replace(',', '.')
        
        try:
            return float(cleaned)
        except:
            return 0.0

    def scrape_store(self, store_name: str, cfg: dict):
        log.info(f"🚀 Iniciando {store_name}...")
        try:
            res = requests.get(cfg["promo_url"], headers=self.headers, timeout=20)
            if res.status_code != 200:
                log.error(f"  ❌ Falha ao aceder {store_name}: {res.status_code}")
                return

            soup = BeautifulSoup(res.text, "html.parser")
            items = soup.select(cfg["item_selector"])
            log.info(f"  📦 Encontrados {len(items)} potenciais itens.")

            for item in items[:20]: # Limite de 20 por execução
                try:
                    name_tag = item.select_one(cfg["name_selector"])
                    if not name_tag: continue
                    product = name_tag.get_text(strip=True)

                    price_tag = item.select_one(cfg["price_selector"])
                    current_price = self.clean_price(price_tag.get_text(strip=True)) if price_tag else 0.0

                    old_price_tag = item.select_one(cfg["old_price_selector"])
                    old_price = self.clean_price(old_price_tag.get_text(strip=True)) if old_price_tag else 0.0

                    img_tag = item.select_one(cfg["img_selector"])
                    img_url = ""
                    if img_tag:
                        img_url = img_tag.get("src") or img_tag.get("data-src")
                        img_url = urljoin(cfg["base_url"], img_url)

                    # Deduplicação
                    if self.db.product_exists(product, store_name):
                        self.stats["skipped_dup"] += 1
                        continue

                    payload = {
                        "product": product,
                        "store": store_name,
                        "current_price": current_price,
                        "old_price": old_price,
                        "image_url": img_url,
                        "category": cfg["category"],
                        "status": "pending",
                        "source": "scraper"
                    }

                    if self.db.insert("product_deals", payload):
                        log.info(f"  ✅ Guardado: {product[:40]}... @ {store_name}")
                        self.stats["saved"] += 1
                    
                    self.stats["processed"] += 1
                    time.sleep(1) # Delay humano

                except Exception as e:
                    log.warning(f"  ⚠️ Erro num item de {store_name}: {e}")

        except Exception as e:
            log.error(f"  ❌ Erro crítico em {store_name}: {e}")

    def run(self):
        log.info("ANGOLIFE RETAIL DEALS SCRAPER - START")
        for store, cfg in RETAIL_CONFIG.items():
            self.scrape_store(store, cfg)
        log.info(f"FINISH - Saved: {self.stats['saved']} | Skipped: {self.stats['skipped_dup']}")

if __name__ == "__main__":
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))
    URL = os.getenv("VITE_SUPABASE_URL")
    # Using Service Role as established in security phase
    KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

    if not URL or not KEY:
        log.error("❌ Credenciais Supabase não encontradas.")
        exit(1)

    db = SupabaseRestClient(URL, KEY)
    scraper = AngoRetailScraper(db)
    scraper.run()
