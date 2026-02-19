import os
import requests
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

URL = os.getenv("VITE_SUPABASE_URL")
KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def test_sync():
    print(f"📡 Testing Supabase Sync to: {URL}")
    headers = {
        "apikey": KEY,
        "Authorization": f"Bearer {KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    
    dummy_payload = {
        "title": "PRODUTO TESTE ANGOLIFE",
        "store": "LOJA TESTE",
        "discount_price": 99.99,
        "original_price": 150.00,
        "image_placeholder": "https://via.placeholder.com/150",
        "category": "Teste",
        "status": "pending",
        "submitted_by": "test_script"
    }
    
    try:
        res = requests.post(f"{URL}/rest/v1/product_deals", headers=headers, json=dummy_payload)
        if res.status_code in [200, 201]:
            print("✅ SUCESSO! O item de teste foi enviado para o Supabase.")
            print("Por favor, verifique a tabela 'product_deals' agora.")
        else:
            print(f"❌ ERRO ({res.status_code}): {res.text}")
    except Exception as e:
        print(f"❌ ERRO CRÍTICO: {e}")

if __name__ == "__main__":
    if not URL or not KEY:
        print("❌ Erro: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos em .env.local")
    else:
        test_sync()
