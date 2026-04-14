import os
import logging
from dotenv import load_dotenv
from news_scraper import AngoNewsScraper, SupabaseRestClient, SITES_CONFIG

def test_run_limited():
    # Carregar .env.local
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
    load_dotenv(dotenv_path=env_path)
    
    url = os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("❌ Erro: Credenciais em falta.")
        return

    db = SupabaseRestClient(url=url, key=key)
    scraper = AngoNewsScraper(db)
    
    print("🚀 Iniciando news scraper para teste...")
    # O news_scraper.py não tem o parâmetro max_total_vagas no run(), ele roda por site.
    # Vou rodar apenas um site para testar.
    for site_name, cfg in list(SITES_CONFIG.items())[:2]: # Pega os 2 primeiros
        scraper.scrape_site(site_name, cfg)
    
    print(f"📊 Resultado final do teste: Processados={scraper.stats['processed']}, Salvos={scraper.stats['saved']}, Erros={scraper.stats['errors']}")

if __name__ == "__main__":
    test_run_limited()
