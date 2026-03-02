# Guia de Ativação do Web Push

Para que as notificações funcionem "com o app fechado", precisas de configurar as chaves VAPID.

## 1. Gerar Chaves VAPID

Podes gerar as chaves via terminal (se tiveres Node.js):

```bash
npx web-push generate-vapid-keys
```

Ou usar ferramentas online confiáveis.

## 2. Configurar Variáveis de Ambiente

### No Frontend (Vite)
Adiciona ao teu arquivo `.env` ou nas configurações do Vercel/Netlify:
- `VITE_VAPID_PUBLIC_KEY`: A chave pública gerada.

### No Supabase (Edge Functions)
Executa este comando no terminal do teu PC (com a Supabase CLI instalada):

```bash
supabase secrets set VAPID_PUBLIC_KEY=tua_chave_publica
supabase secrets set VAPID_PRIVATE_KEY=tua_chave_privada
supabase secrets set VAPID_EMAIL=mailto:teu-email@exemplo.com
```

## 3. Deploy da Edge Function

```bash
supabase functions deploy notify-new-job
```

## 4. Configurar Webhook no Supabase Dashboard

1. Vai a **Database** -> **Webhooks**.
2. Cria um novo Webhook.
3. Nome: `notify_on_new_job`.
4. Table: `jobs`.
5. Events: `Insert`.
6. Type: `HTTP Request`.
7. Method: `POST`.
8. URL: `https://<PROJECT_REF>.functions.supabase.co/notify-new-job`.
9. Headers: `Authorization: Bearer <TU_ANON_OU_SERVICE_ROLE_KEY>`.
