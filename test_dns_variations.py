import requests
import urllib3
import socket
urllib3.disable_warnings()

retailers = {
    "Kero": ["kero.co.ao", "kero.ao", "kero-angola.com"],
    "Candando": ["candando.com", "candando.co.ao"],
    "Shoprite": ["shoprite.co.ao", "shoprite.com.ao"],
    "Kibabo": ["kibabo.co.ao", "kibabo.online", "kibabo.ao"],
    "Fresmart": ["fresmart.net", "fresmart.co.ao", "fresmart.ao"],
    "Angomart": ["angomart.co.ao", "angomart.com", "angomart.ao"],
    "Alimenta Angola": ["alimentaangola.co.ao", "alimentaangola.com"],
    "Novo São Paulo": ["novosaopaulo.ao", "novosaopaulo.co.ao"],
    "Arreio": ["arreio.ao", "arreio.co.ao"]
}

print("=== DNS TRIANGULATION TEST ===")
for name, domains in retailers.items():
    print(f"\n[{name}]")
    for domain in domains:
        try:
            ip = socket.gethostbyname(domain)
            print(f"  ✅ {domain} -> {ip}")
            # Test connectivity
            try:
                res = requests.get(f"https://{domain}", timeout=5, verify=False)
                print(f"     Status: {res.status_code}")
            except Exception as e:
                print(f"     Connect Error: {str(e)[:50]}")
        except socket.gaierror:
            print(f"  ❌ {domain} -> Could not resolve")
