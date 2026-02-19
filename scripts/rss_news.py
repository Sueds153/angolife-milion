import feedparser
import requests
import os
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path='../.env.local')

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    print("[-] Supabase credentials not found. Check .env.local")
    exit(1)

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

# Real Angolan RSS Feeds
RSS_FEEDS = [
    "https://novojornal.co.ao/rss", 
    "https://redeangola.info/feed/",
    "https://www.verangola.net/va/en/rss.xml",
    "https://correiokianda.info/feed/"
]

def scrape_rss():
    print("[*] Starting RSS Feed Reader (Angola Sources Only)...")
    
    for feed_url in RSS_FEEDS:
        print(f"[*] Parsing {feed_url}...")
        try:
            feed = feedparser.parse(feed_url)
            
            if not feed.entries:
                print(f"[-] No entries found in {feed_url}")
                continue

            for entry in feed.entries[:5]: 
                article = {
                    "title": entry.title,
                    "summary": entry.summary if 'summary' in entry else (entry.description if 'description' in entry else ""),
                    "source": feed.feed.title if 'title' in feed.feed else "News Angola",
                    "url": entry.link,
                    "category": "Nacional", # Default to Nacional for local feeds
                    "status": "pending", 
                    "published_at": time.strftime("%Y-%m-%dT%H:%M:%S.000Z") 
                }

                # Direct REST Insert
                try:
                    # Check duplication by URL (naive check)
                    api_url = f"{url}/rest/v1/news_articles"
                    
                    # We filter by URL to check existence
                    check = requests.get(f"{api_url}?url=eq.{article['url']}", headers=headers)
                    if check.status_code == 200 and len(check.json()) == 0:
                        response = requests.post(api_url, headers=headers, json=article)
                        if response.status_code in [200, 201]:
                            print(f"[+] Inserted article: {article['title']}")
                    else:
                        print(f"[.] Skipping duplicate: {article['title']}")

                except Exception as e:
                    print(f"[-] Error inserting: {e}")

        except Exception as e:
            print(f"[-] Error parsing feed {feed_url}: {e}")

    print("[*] RSS scraping finished.")

if __name__ == "__main__":
    scrape_rss()
