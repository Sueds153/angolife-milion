"""
RetailDealsScraper v1 — Motor de Agregação de Promoções Angolanas
================================================================
Arquitetura de 'Adaptadores' unificada para redes de supermercados.

Redes Configuradas:
  - Grandes: Kero, Candando, Shoprite, Kibabo
  - Especialistas: Fresmart, Angomart, Alimenta Angola
  - Locais: Novo São Paulo, Arreio
"""

import os
import sys
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
        "base_url": "https://www.kero.co.ao",
        "promo_url": "https://www.kero.co.ao/promocoes/",
        "item_selector": ".product-item, .product-card, .item",
        "name_selector": ".product-title, .product-item-link, h3",
        "price_selector": ".price, .special-price, .current-price",
        "old_price_selector": ".old-price, .regular-price, .was-price",
        "img_selector": "img.product-image, img.product-item-img",
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
        "item_selector": ".item-product, .product-card",
        "name_selector": ".name, .title",
        "price_selector": ".special-price, .price",
        "old_price_selector": ".old-price",
        "img_selector": "img",
        "category": "Alimentação"
    },
    "Kibabo": {
        "base_url": "https://kibabo.co.ao",
        "promo_url": "https://kibabo.co.ao/promocoes/",
        "item_selector": "li.product, .product-grid-item",
        "name_selector": ".woocommerce-loop-product__title, .product-title",
        "price_selector": "ins .amount, .price",
        "old_price_selector": "del .amount, .old-price",
        "img_selector": "img",
        "category": "Misto"
    },

    # ── ESPECIALISTAS ───────────────────────────────────────────────────
    "Fresmart": {
        "base_url": "https://fresmart.net",
        "promo_url": "https://fresmart.net/promocoes/",
        "item_selector": ".product-grid-item, .product",
        "name_selector": ".wd-entities-title, .title",
        "price_selector": ".price ins .amount, .current-price",
        "old_price_selector": ".price del .amount, .old-price",
        "img_selector": "img",
        "category": "Alimentação"
    },
    "Angomart": {
        "base_url": "https://www.angomart.com",
        "promo_url": "https://www.angomart.com/promocoes/",
        "item_selector": "article.product-miniature, .product-card",
        "name_selector": ".product-title, .h3",
        "price_selector": ".current-price, .price",
        "old_price_selector": ".regular-price",
        "img_selector": "img",
        "category": "Higiene/Alimentação"
    },
    "Alimenta Angola": {
        "base_url": "https://www.alimentaangola.co.ao",
        "promo_url": "https://www.alimentaangola.co.ao/folheto/",
        "item_selector": ".product-card, .promotion-item",
        "name_selector": ".title, .name",
        "price_selector": ".new-price, .current-price",
        "old_price_selector": ".old-price",
        "img_selector": "img",
        "category": "Atacado"
    },

    # ── LOCAIS / ATACADO ───────────────────────────────────────────────
    "Novo São Paulo": {
        "base_url": "https://www.cidadedoseculo.ao",
        "promo_url": "https://www.cidadedoseculo.ao/promocoes",
        "item_selector": ".item, .product-item",
        "name_selector": ".product-name, .name",
        "price_selector": ".price-promo, .price",
        "old_price_selector": ".price-old",
        "img_selector": "img",
        "category": "Alimentação"
    },
    "Arreiou": {
        "base_url": "https://www.arreiou.com",
        "promo_url": "https://www.arreiou.com/recrutamento/",
        "item_selector": ".deal-item, .product-card",
        "name_selector": ".name, .title",
        "price_selector": ".current, .price",
        "old_price_selector": ".was, .old-price",
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
            if res.status_code not in [200, 201]:
                log.error(f"  ❌ Erro Supabase ({res.status_code}): {res.text}")
                return False
            return True
        except Exception as e:
            log.error(f"  ❌ Erro de Conexão Supabase: {e}")
            return False

    def product_exists(self, product_name: str, store: str):
        try:
            # Uso de params para garantir encoding correto de espaços e caracteres especiais
            params = {
                "title": f"eq.{product_name}",
                "store": f"eq.{store}"
            }
            res = requests.get(f"{self.base_url}/product_deals", headers=self.headers, params=params)
            if res.status_code == 200:
                data = res.json()
                return len(data) > 0
            else:
                log.debug(f"  🔍 Check duplicados status: {res.status_code}")
                return False
        except Exception as e:
            log.warning(f"  ⚠️ Erro ao verificar duplicados: {e}")
            return False

# ─────────────────────────────────────────────────────────────────────────
# MOTOR PRINCIPAL
# ─────────────────────────────────────────────────────────────────────────
class AngoRetailScraper:
    def __init__(self, db: SupabaseRestClient):
        self.db = db
        self.stats = {"processed": 0, "saved": 0, "skipped_dup": 0, "errors": 0}
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        }

    def clean_price(self, price_str: str) -> float:
        """Limpa 'Kz', 'AKZ', pontos e vírgulas para retornar float."""
        if not price_str: return 0.0
        # Remove símbolos e espaços
        cleaned = re.sub(r'[^\d,.]', '', price_str)
        # Se houver vírgula e ponto, assumimos vírgula como decimal (visto em muitos sites AO)
        if ',' in cleaned and '.' in cleaned:
             # Se a vírgula vem depois do ponto (ex: 1.000,50)
             if cleaned.find(',') > cleaned.find('.'):
                 cleaned = cleaned.replace('.', '').replace(',', '.')
             else:
                 cleaned = cleaned.replace(',', '').replace('.', '.')
        elif ',' in cleaned:
             cleaned = cleaned.replace(',', '.')
        
        try:
            return float(cleaned)
        except:
            return 0.0

    def scrape_store(self, store_name: str, cfg: dict):
        log.info(f"🚀 Iniciando {store_name} ({cfg['promo_url']})...")
        
        urls_to_try = [cfg['promo_url']]
        # Triangulação: se falhar, tenta variações comuns
        if ".co.ao" in cfg['promo_url']:
            urls_to_try.append(cfg['promo_url'].replace(".co.ao", ".com"))
        elif ".com" in cfg['promo_url'] and "candando" not in cfg['promo_url']:
            urls_to_try.append(cfg['promo_url'].replace(".com", ".co.ao"))

        last_error = ""
        for url in urls_to_try:
            try:
                session = requests.Session()
                # PASSO STEALTH: Visita Home Primeiro para Cookies
                try:
                    session.get(cfg["base_url"], headers=self.headers, timeout=15)
                except:
                    pass

                # Headers extras para evitar 403
                session.headers.update({
                    "Referer": cfg["base_url"],
                    "Connection": "keep-alive",
                })
                
                log.info(f"  📡 Acedendo: {url}")
                res = session.get(url, headers=self.headers, timeout=30)
                
                if res.status_code != 200:
                    last_error = f"HTTP {res.status_code}"
                    continue

                soup = BeautifulSoup(res.text, "html.parser")
                items = soup.select(cfg["item_selector"])
                
                if not items:
                    log.warning(f"  ⚠️ Sem produtos em {store_name}. Tentando localizar Folheto...")
                    # ESTRATÉGIA FLYER-FIRST (Fallback)
                    flyer_found = False
                    keywords = ["folheto", "pdf", "promo", "catalogo", "ver ofertas", "folhetos"]
                    for link in soup.find_all("a", href=True):
                        text = (link.get_text() or "").lower()
                        href = link["href"].lower()
                        if any(kw in text for kw in keywords) or ".pdf" in href:
                            flyer_url = urljoin(cfg["base_url"], link["href"])
                            log.info(f"  📖 Folheto detetado: {flyer_url}")
                            
                            today = datetime.now().strftime("%Y-%m-%d")
                            flyer_title = f"Folheto Digital: {store_name} ({today})"
                            
                            if not self.db.product_exists(flyer_title, store_name):
                                payload = {
                                    "title": flyer_title,
                                    "store": store_name,
                                    "url": flyer_url,
                                    "category": cfg["category"],
                                    "image_placeholder": "https://img.icons8.com/color/96/pdf.png",
                                    "status": "pending",
                                    "submitted_by": "scraper_flyer"
                                }
                                if self.db.insert("product_deals", payload):
                                    log.info(f"  ✅ Folheto guardado: {store_name}")
                                    self.stats["saved"] += 1
                                    flyer_found = True
                            else:
                                flyer_found = True 
                            break
                    
                    if flyer_found: return
                    log.debug(f"  🔍 DEBUG HTML ({store_name}): {res.text[:1000]}")
                    continue 

                log.info(f"  📦 Encontrados {len(items)} potenciais itens.")
                
                for item in items[:25]: # Processa os itens encontrados
                    try:
                        name_tag = item.select_one(cfg["name_selector"])
                        if not name_tag: continue
                        product = name_tag.get_text(strip=True)

                        if not product: continue

                        price_tag = item.select_one(cfg["price_selector"])
                        price_text = price_tag.get_text(strip=True) if price_tag else ""
                        current_price = self.clean_price(price_text)

                        old_price_tag = item.select_one(cfg["old_price_selector"])
                        old_price_text = old_price_tag.get_text(strip=True) if old_price_tag else ""
                        old_price = self.clean_price(old_price_text)

                        img_tag = item.select_one(cfg["img_selector"])
                        img_url = ""
                        if img_tag:
                            raw_img = img_tag.get("src") or img_tag.get("data-src") or img_tag.get("data-lazy-src")
                            if raw_img:
                                img_url = urljoin(cfg["base_url"], raw_img)

                        # Deduplicação
                        if self.db.product_exists(product, store_name):
                            self.stats["skipped_dup"] += 1
                            continue

                        payload = {
                            "title": product,
                            "store": store_name,
                            "discount_price": current_price,
                            "original_price": old_price,
                            "image_placeholder": img_url,
                            "category": cfg["category"],
                            "status": "pending",
                            "submitted_by": "scraper"
                        }

                        if self.db.insert("product_deals", payload):
                            log.info(f"  ✅ Guardado: {product[:40]}... ({current_price} Kz)")
                            self.stats["saved"] += 1
                        else:
                            self.stats["errors"] += 1
                        
                        self.stats["processed"] += 1
                        time.sleep(0.5) 

                    except Exception as e:
                        log.warning(f"  ⚠️ Erro ao processar item em {store_name}: {e}")
                
                return # Sucesso total para esta loja
                
            except Exception as e:
                last_error = str(e)
                log.debug(f"  ❌ Erro ao tentar {url}: {last_error[:100]}")
                continue

        log.error(f"  ❌ Todas as tentativas falharam para {store_name}. Último erro: {last_error}")

    def run(self):
        log.info("=== ANGOLIFE RETAIL DEALS SCRAPER - INICIADO ===")
        for store, cfg in RETAIL_CONFIG.items():
            self.scrape_store(store, cfg)
        
        log.info("===============================================")
        log.info(f"RESULTADO FINAL:")
        log.info(f"  - Itens Processados: {self.stats['processed']}")
        log.info(f"  - Itens Guardados: {self.stats['saved']}")
        log.info(f"  - Duplicados Ignorados: {self.stats['skipped_dup']}")
        log.info(f"  - Erros de Inserção: {self.stats['errors']}")
        log.info("===============================================")

if __name__ == "__main__":
    # Tenta carregar localmente primeiro
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env.local"))
    
    URL = os.getenv("VITE_SUPABASE_URL")
    # Prioridade máxima para Service Role Key
    KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

    if not URL or not KEY:
        log.error("❌ Erro: Credenciais Supabase (URL ou KEY) não encontradas no ambiente.")
        sys.exit(1)

    log.info(f"📡 Conectando ao Supabase: {URL}")
    db = SupabaseRestClient(URL, KEY)
    scraper = AngoRetailScraper(db)
    scraper.run()
    
    # Se nada foi guardado, falha o Action para o utilizador ver a vermelho
    if scraper.stats["saved"] == 0:
        log.error("❌ Erro Final: Nenhum item foi guardado no Supabase. Verifique os logs acima para erros de rede ou seletores.")
        sys.exit(1)
    
    log.info("🎯 Processo finalizado com sucesso e dados sincronizados.")
