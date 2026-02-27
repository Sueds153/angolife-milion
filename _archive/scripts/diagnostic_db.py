
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

def check_table(table_name):
    print(f"\n--- Analisando Tabela: {table_name} ---")
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}"
    }
    response = requests.get(f"{URL}/rest/v1/{table_name}?select=id,status,published_at,titulo&limit=20", headers=headers)
    if response.status_code == 200:
        data = response.json()
        for item in data:
            print(f" - [{item.get('status')}] {item.get('titulo')} (ID: {item.get('id')}) - Data: {item.get('published_at')}")
    else:
        print(f"Erro ao acessar {table_name}: {response.status_code}")

def list_all_profiles():
    print(f"\n--- Lista de Perfis ---")
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}"
    }
    response = requests.get(f"{URL}/rest/v1/profiles?select=*", headers=headers)
    if response.status_code == 200:
        for p in response.json():
            print(f" - Admin:{p.get('is_admin')} | {p.get('email')} (ID: {p.get('id')})")
    else:
        print(f"Erro ao buscar perfis: {response.status_code}")

def check_news_counts():
    print(f"\n--- Contagem por Status (News) ---")
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}"
    }
    response = requests.get(f"{URL}/rest/v1/news_articles?select=status", headers=headers)
    if response.status_code == 200:
        counts = {}
        for x in response.json():
            s = x.get('status')
            counts[s] = counts.get(s, 0) + 1
        print(json.dumps(counts, indent=2))

if __name__ == "__main__":
    check_news_counts()
    list_all_profiles()
    check_table("news_articles")
