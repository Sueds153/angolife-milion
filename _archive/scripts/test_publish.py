import os
import requests
import sys
from dotenv import load_dotenv

# Garante que a saída use UTF-8
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv(dotenv_path='c:/Users/Administrator/Desktop/angolife atualizado/angolife/.env.local')

URL = os.getenv("VITE_SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def test_publish_news():
    print("--- Testando Publicação de Notícia (Service Role) ---")
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    # 1. Busca uma notícia pendente
    res_news = requests.get(f"{URL}/rest/v1/news_articles?status=eq.pendente&select=id,titulo,status&limit=1", headers=headers)
    if res_news.status_code == 200 and res_news.json():
        news = res_news.json()[0]
        news_id = news['id']
        print(f"Notícia encontrada: {news['titulo']} (ID: {news_id})")
        
        # 2. Tenta atualizar status para 'publicado'
        update_payload = {"status": "publicado"}
        res_update = requests.patch(f"{URL}/rest/v1/news_articles?id=eq.{news_id}", headers=headers, json=update_payload)
        
        if res_update.status_code in [200, 204]:
            print("✅ Sucesso ao atualizar com Service Role!")
        else:
            print(f"❌ Erro ao atualizar: {res_update.status_code} - {res_update.text}")
    else:
        print("Nenhuma notícia pendente encontrada para teste.")

if __name__ == "__main__":
    test_publish_news()
