import os
import requests
import json
from datetime import datetime, timezone
from dotenv import load_dotenv

def test_supabase():
    # Carregar .env.local
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
    load_dotenv(dotenv_path=env_path)
    
    url = os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("❌ Erro: URL ou KEY não encontradas no .env.local")
        return

    print(f"🔗 Testando: {url}")
    
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    
    # Teste de inserção na tabela jobs (pendente)
    test_job = {
        "title": "TESTE DE SCRAPER - " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "company": "SISTEMA DE TESTE",
        "location": "Luanda",
        "description": "Teste técnico para verificar conectividade.",
        "application_email": "teste@angolife.app",
        "imagem_url": "https://img.icons8.com/color/144/engineering.png",
        "source_url": "https://teste.angolife.app/" + str(datetime.now().timestamp()),
        "categoria": "Geral",
        "status": "pendente",
        "posted_at": datetime.now(timezone.utc).isoformat(),
    }
    
    print("📤 Enviando payload de teste...")
    try:
        resp = requests.post(
            f"{url.rstrip('/')}/rest/v1/jobs",
            headers=headers,
            json=test_job,
            timeout=30
        )
        print(f"📡 Status Code: {resp.status_code}")
        print(f"📝 Resposta: {resp.text}")
        
        if resp.status_code == 201:
            print("✅ SUCESSO! Conexão e inserção funcionando corretamente.")
        else:
            print("❌ FALHA na inserção.")
            
    except Exception as e:
        print(f"💥 ERRO CRÍTICO: {e}")

if __name__ == "__main__":
    test_supabase()
