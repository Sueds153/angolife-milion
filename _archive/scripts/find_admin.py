
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv(dotenv_path='c:/Users/Administrator/Desktop/angolife atualizado/angolife/.env.local')

URL = os.getenv("VITE_SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def find_profile(email):
    print(f"\n--- Procurando Perfil por Email: {email} ---")
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}"
    }
    response = requests.get(f"{URL}/rest/v1/profiles?email=eq.{email}&select=*", headers=headers)
    if response.status_code == 200:
        data = response.json()
        if data:
            print(f"✅ Perfil encontrado!")
            print(json.dumps(data[0], indent=2))
        else:
            print(f"❌ Nenhum perfil encontrado para o email {email}.")
    else:
        print(f"Erro: {response.status_code} - {response.text}")

if __name__ == "__main__":
    find_profile('suedjosue@gmail.com')
