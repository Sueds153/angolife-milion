# Validação Fase 2a: extract_date / extract_image / _to_iso / corpo_to_html / sgai_enabled
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from news_scraper import AngoNewsScraper
from bs4 import BeautifulSoup

s = AngoNewsScraper.__new__(AngoNewsScraper)

# extract_image — reparo https:/ e fallbacks
h = '<html><head><meta property="og:image" content="https:/www.angop.ao/x.jpg"/></head></html>'
img = AngoNewsScraper.extract_image(s, BeautifulSoup(h, "html.parser"), "https://www.angop.ao")
assert img == "https://www.angop.ao/x.jpg", img

h2 = '<html><head><meta name="twitter:image" content="https://a.b/c.png"/></head></html>'
img2 = AngoNewsScraper.extract_image(s, BeautifulSoup(h2, "html.parser"), "https://x.ao")
assert img2 == "https://a.b/c.png", img2

h3 = "<html><body></body></html>"
img3 = AngoNewsScraper.extract_image(s, BeautifulSoup(h3, "html.parser"), "https://x.ao")
assert img3.endswith("og-image.jpg"), img3

# _to_iso
iso = AngoNewsScraper._to_iso("1727000000")
assert iso and iso.startswith("2024-09-22"), iso
assert AngoNewsScraper._to_iso("2026-09-22 10:54") == "2026-09-22T10:54:00Z"
assert AngoNewsScraper._to_iso("2026-09-22") == "2026-09-22T00:00:00Z"
assert AngoNewsScraper._to_iso("2026-09-22T10:54:00+01:00") == "2026-09-22T10:54:00+01:00"
assert AngoNewsScraper._to_iso("") is None
assert AngoNewsScraper._to_iso("garbage") is None

# extract_date — meta / time / JSON-LD / vazio
h4 = '<html><head><meta property="article:published_time" content="2026-09-20T08:30:00Z"/></head></html>'
assert AngoNewsScraper.extract_date(BeautifulSoup(h4, "html.parser")) == "2026-09-20T08:30:00Z"

h5 = '<html><body><time datetime="2026-09-19"></time></body></html>'
assert AngoNewsScraper.extract_date(BeautifulSoup(h5, "html.parser")) == "2026-09-19T00:00:00Z"

h6 = '<script type="application/ld+json">{"@type":"NewsArticle","datePublished":"2026-09-18T12:00:00Z"}</script>'
assert AngoNewsScraper.extract_date(BeautifulSoup(h6, "html.parser")) == "2026-09-18T12:00:00Z"

h7 = "<html><body><p>sem data</p></body></html>"
assert AngoNewsScraper.extract_date(BeautifulSoup(h7, "html.parser")) is None

# corpo_to_html
assert AngoNewsScraper.corpo_to_html("Linha 1\n\nLinha 2") == "<p>Linha 1</p><p>Linha 2</p>"
assert AngoNewsScraper.corpo_to_html("") == ""

# sgai_enabled
ok = AngoNewsScraper.sgai_enabled()
assert isinstance(ok, bool)
print(f"sgai_enabled = {ok}")

os.environ["USE_SGAI"] = "off"
assert AngoNewsScraper.sgai_enabled() is False
del os.environ["USE_SGAI"]

print("ALL PASS")
