import requests
import urllib3
import re
from urllib.parse import urljoin
urllib3.disable_warnings()

# URLs atualizadas baseadas em pesquisa recente
RETAIL_TEST_CONFIG = {
    "Kero": "https://www.kero.co.ao/promocoes/",
    "Shoprite": "https://www.shoprite.co.ao/promocoes.html",
    "Kibabo": "https://kibabo.co.ao/promocoes/",
    "Fresmart": "https://fresmart.net/promocoes/",
    "Angomart": "https://angomart.co.ao/promocoes/",
    "Alimenta Angola": "https://alimentaangola.co.ao/folheto/",
    "Novo São Paulo": "https://novosaopaulo.ao/promocoes",
    "Arreio": "https://arreio.ao/promocoes/",
    "Candando": "https://www.candando.com/promocoes"
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
}

for name, url in RETAIL_TEST_CONFIG.items():
    try:
        print(f"Testing {name} ({url})...", end=" ", flush=True)
        res = requests.get(url, headers=headers, timeout=15, verify=False)
        print(f"Status: {res.status_code}")
    except Exception as e:
        print(f"Error: {str(e)[:100]}")
