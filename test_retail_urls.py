import requests
import urllib3
urllib3.disable_warnings()

urls = [
    "https://www.kero-angola.com/promocoes",
    "https://www.candando.com/promocoes",
    "https://www.shoprite.co.ao/promocoes.html",
    "https://kibabo.co.ao/produtos-em-promocao/",
    "https://fresmart.ao/promocoes/",
    "https://angomart.com/promocoes",
    "https://alimentaangola.com/promocoes",
    "https://novosaopaulo.co.ao/promocoes",
    "https://arreio.ao/promocoes"
]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

for url in urls:
    try:
        print(f"Testing {url}...", end=" ", flush=True)
        res = requests.get(url, headers=headers, timeout=15, verify=False)
        print(f"Status: {res.status_code}")
    except Exception as e:
        print(f"Error: {e}")
