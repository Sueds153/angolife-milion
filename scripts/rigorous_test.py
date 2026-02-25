import os
import requests
import json
import sys
from dotenv import load_dotenv

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv(dotenv_path='c:/Users/Administrator/Desktop/angolife atualizado/angolife/.env.local')

URL = os.getenv("VITE_SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def rigorous_test():
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    # 1. Fetch a pending news item
    res = requests.get(f"{URL}/rest/v1/news_articles?status=eq.pendente&select=id,status,titulo&limit=1", headers=headers)
    if res.status_code != 200 or not res.json():
        print("Nenhuma notícia pendente encontrada.")
        return
    
    news = res.json()[0]
    news_id = news['id']
    print(f"Testando item: {news['titulo']} (ID: {news_id})")
    
    # 2. Update status and verify return
    res_update = requests.patch(f"{URL}/rest/v1/news_articles?id=eq.{news_id}", headers=headers, json={"status": "publicado"})
    
    if res_update.status_code in [200, 201, 204]:
        updated_data = res_update.json() if res_update.text else []
        if updated_data:
            print(f"✅ Notícia atualizada com sucesso! Novo status: {updated_data[0].get('status')}")
        else:
            # Fallback check if return=representation is ignored
            res_check = requests.get(f"{URL}/rest/v1/news_articles?id=eq.{news_id}&select=status", headers=headers)
            new_status = res_check.json()[0]['status'] if res_check.json() else "N/A"
            print(f"Status após update: {new_status}")
            if new_status == "publicado":
                print("✅ Update confirmado via SELECT.")
            else:
                print("❌ Falha: O status continua pendente apesar do código 204!")
    else:
        print(f"❌ Erro no PATCH: {res_update.status_code} - {res_update.text}")

if __name__ == "__main__":
    rigorous_test()
