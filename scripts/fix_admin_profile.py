
import os
import requests
from dotenv import load_dotenv

load_dotenv(dotenv_path='c:/Users/Administrator/Desktop/angolife atualizado/angolife/.env.local')

URL = os.getenv("VITE_SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# 1. Tenta pegar o ID do user via Auth API (com Service Key)
# O endpoint para gerir users  /auth/v1/admin/users
def get_user_id(email):
    print(f"Buscando UUID para {email}...")
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    
    # Busca na tabela de profiles primeiro (vai falhar, mas ok)
    # Tenta via SQL RPC ou similar se existisse, mas vamos usar o endpoint de listagem de users do GoTrue Admin
    # Na verdade, o REST API do Supabase no expe auth.users.
    # Mas se o user j fez pedidos, pode estar na tabela orders.
    
    print("Tentando encontrar ID em outras tabelas...")
    res_orders = requests.get(f"{URL}/rest/v1/orders?user_email=eq.{email}&select=*", headers=headers)
    if res_orders.status_code == 200 and res_orders.json():
         # Nota: user_email est na tabela orders, mas o id do user no est obrigatoriamente l se no foi gravado.
         pass

    # Se no conseguirmos o ID via REST, vamos sugerir ao user rodar o SQL no Dashboard ou usar um script mais complexo.
    # Mas espera, eu posso pedir ao user o ID completo ou tentar "chutar" se eu ja o vi.
    # No screenshot: c6253873...
    
    print("\nAVISO: Não consigo ler auth.users via REST API anon/service_role padrão do PostgREST.")
    print("Vou tentar criar o perfil usando o ID que aparece no screenshot (truncado): c6253873-...")
    print("Na verdade, o melhor  o USER rodar este SQL no Dashboard do Supabase:")
    sql = f"""
    -- RODE ISTO NO SQL EDITOR DO SUPABASE
    INSERT INTO public.profiles (id, email, full_name, is_admin, account_type, is_premium)
    SELECT id, email, 'Admin', true, 'premium', true
    FROM auth.users
    WHERE email = '{email}'
    ON CONFLICT (id) DO UPDATE 
    SET is_admin = true, account_type = 'premium', is_premium = true;
    """
    print(sql)
    return sql

if __name__ == "__main__":
    get_user_id('suedjosue@gmail.com')
