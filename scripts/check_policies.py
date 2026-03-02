
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv(dotenv_path='c:/Users/Administrator/Desktop/angolife atualizado/angolife/.env.local')

URL = os.getenv("VITE_SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def check_policies(table_name):
    print(f"\n--- Políticas RLS em {table_name} ---")
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    
    # Query pg_policies via SQL RPC (if enabled) or just query the rest api for a special schema if possible.
    # Actually, Supabase doesn't expose pg_catalog via PostgREST by default.
    # But we can try to use a simple SELECT to see if we can catch an error message that reveals policy names.
    # Alternatively, I'll just suggest a SQL command to the user.
    
    print("Para verificar as políticas, rode este comando no SQL Editor do Supabase:")
    sql = f"SELECT * FROM pg_policies WHERE tablename = '{table_name}';"
    print(f"\nQUERY:\n{sql}\n")

if __name__ == "__main__":
    check_policies("news_articles")
    check_policies("jobs")
