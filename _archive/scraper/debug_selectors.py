
import requests
from bs4 import BeautifulSoup

urls = [
    "https://contrata.ao/vagas",
    "https://www.inefop.gov.ao/concursos",
    "https://www.jobartis.com/vagas-emprego/luanda"
]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7",
}

for url in urls:
    print(f"\n--- Testing URL: {url} ---")
    try:
        resp = requests.get(url, headers=headers, timeout=30)
        print(f"Status: {resp.status_code}")
        print(f"Content length: {len(resp.text)}")
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Test common card selectors
        for sel in [".job-item", "article", ".thumbnail-card", ".job-listing", ".post", ".job-container", ".l-post", "li.job_listing", "article.blog-post-default"]:
            found = soup.select(sel)
            if found:
                print(f"Found {len(found)} elements for selector: {sel}")
                if url == "https://www.jobartis.com/vagas-emprego/luanda" and sel == "article":
                     print(f"Jobartis Sample: {str(found[0])[:300]}")
        
        print("HTML Preview (first 500 chars):")
        print(resp.text[:500])
    except Exception as e:
        print(f"Error testing {url}: {e}")
