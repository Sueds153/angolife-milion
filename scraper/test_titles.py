import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"))
os.environ["USE_SGAI"] = "off"

from news_scraper import AngoNewsScraper, SITES_CONFIG, is_junk_title
import news_scraper as ns
ns.time.sleep = lambda *_: None

assert is_junk_title("Top news")
assert is_junk_title("Política")
assert is_junk_title("EXPANSÃO - Página Inicial")
assert is_junk_title("Últimas notícias")
assert is_junk_title("ab")
assert not is_junk_title(
    "FMI diz que reformas abrandaram e sugere consolidação orçamental"
)
print("is_junk_title OK")


class FakeDB:
    def __init__(self):
        self.inserted = []

    def select(self, t, filters=None, columns="*"):
        return []

    def insert(self, t, d):
        self.inserted.append(d)
        print("INSERT", repr(d["titulo"][:70]), "| pub=", d.get("published_at"))
        return True


for site in ("Expansão", "ANGOP"):
    db = FakeDB()
    s = AngoNewsScraper(db)
    orig = s._process_article
    n = [0]

    def limited(*a, **k):
        if n[0] >= 3:
            return
        n[0] += 1
        return orig(*a, **k)

    s._process_article = limited
    s.scrape_site(site, dict(SITES_CONFIG[site]))
    print(f"--- {site}: inserts={len(db.inserted)} stats={s.stats}")
    for p in db.inserted:
        assert not is_junk_title(p["titulo"]), "lixo passou: " + p["titulo"]

print("ALL PASS (titulos limpos)")
