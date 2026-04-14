import os
import logging
from dotenv import load_dotenv
from ango_job_scraper import AngoJobScraper, SupabaseRestClient

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
    scraper = AngoJobScraper(db=db)
    
    print("🚀 Iniciando scraper para teste de 1 vaga...")
    # Vamos tentar rodar o scraper. O run() rodará em ciclos.
    # Ele deve parar assim que salvar 1 vaga.
    scraper.run(max_total_vagas=1)
    
    print(f"📊 Resultado final do teste: Processados={scraper.stats['processed']}, Salvos={scraper.stats['saved']}, Erros={scraper.stats['errors']}")

if __name__ == "__main__":
    test_run_limited()
