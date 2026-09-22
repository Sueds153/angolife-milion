# Validação Fase 2b: fallback de listagem (BS4 vazio → SGAI) + detalhe + payload
import os, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"))
os.environ.setdefault("USE_SGAI", "auto")

from news_scraper import AngoNewsScraper, SITES_CONFIG


class FakeDB:
    def __init__(self):
        self.inserted = []
        self.seen = []

    def select(self, table, filters=None, columns="*"):
        return []

    def insert(self, table, data):
        self.inserted.append(data)
        print(f"    [FAKE INSERT] {table} titulo={data.get('titulo','')[:50]!r} "
              f"published_at={data.get('published_at')} img={data.get('imagem_url','')[:60]}")
        return True


cfg = dict(SITES_CONFIG["ANGOP"])
cfg["article_selector"] = ".selector-que-nao-existe-xyz"  # força BS4 vazio

db = FakeDB()
scraper = AngoNewsScraper(db)

assert scraper.sgai_enabled(), "sgai_enabled deveria estar ativo com .env.local"

import sgai_news_scraper as sgai

# Limita a 2 artigos para o teste ficar curto
_orig_listing = sgai.sgai_listing
def _limited_listing(site_name, c, graph_cfg, max_listing=12):
    items = _orig_listing(site_name, c, graph_cfg, max_listing=max_listing)
    return items[:2]
sgai.sgai_listing = _limited_listing

print("=== scrape_site ANGOP com seletor inválido (fallback SGAI) ===")
scraper.scrape_site("ANGOP", cfg)

print()
print("inserts:", len(db.inserted))
assert len(db.inserted) >= 1, "fallback deveria ter gerado pelo menos 1 insert"
for p in db.inserted:
    assert p.get("corpo"), "corpo vazio"
    assert p.get("imagem_url", "").startswith("http"), "imagem inválida"
    # published_at pode ser None se a página não expuser data — mas deve existir a chave ou ser opcional
print("stats:", scraper.stats)
print("ALL PASS (fallback listagem)")
