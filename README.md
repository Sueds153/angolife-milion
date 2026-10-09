# Resolve.AO — Super App de Angola

O portal definitivo para **empregos**, **câmbio informal (Kwanza/Dólar/Euro)**, **notícias** e **promoções** em tempo real em Angola.

- Stack: React 19 + TypeScript + Vite 6 + Tailwind CSS 4 + Supabase
- PWA instalável com notificações push
- Painel de administração para moderar conteúdo (empregos, notícias, ofertas, câmbio, anúncios, subscrições de CV)

## Requisitos

- Node.js 20+
- Conta Supabase (projeto ligado: `efhelvzdlwewsjkdknkl`)

## Configuração

1. Instalar dependências:

   ```bash
   npm install
   ```

2. Criar `.env.local` a partir de `.env.example` (ou reutilizar o existente) com:

   ```
   VITE_SUPABASE_URL=https://<ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key>
   VITE_VAPID_PUBLIC_KEY=<vapid public key>
   ```

3. Correr em desenvolvimento:

   ```bash
   npm run dev
   ```

## Scripts

| Comando            | Descrição                                          |
| ------------------ | -------------------------------------------------- |
| `npm run dev`      | Servidor de desenvolvimento (porta 3000, localhost) |
| `npm run build`    | Build de produção para `dist/`                      |
| `npm run preview`  | Pré-visualizar o build                              |
| `npm run lint`     | ESLint                                              |
| `npm run format`   | Prettier                                            |
| `npm test`         | Testes (Vitest)                                     |

## Base de dados

- **Fonte canónica**: `supabase/migrations/` — migrações novas vão sempre aqui (nunca editar migrations já aplicadas)
- `database/` guarda apenas patches/manuais históricos, referência e schema mestre consolidado (`database/consolidated_master_schema.sql`) — **não** é aplicado automaticamente por `supabase db push`

Para aplicar alterações ao banco de produção:

```bash
supabase login
supabase link --project-ref efhelvzdlwewsjkdknkl
supabase db push
```

## Scrapers (conteúdo)

Os scrapers de empregos, notícias, câmbio e ofertas estão em `scraper/` e são executados via GitHub Actions (`.github/workflows/`). Para correr manualmente:

```bash
python scraper/ango_job_scraper.py   # empregos
python scraper/news_scraper.py       # notícias
```

Requerem as variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.

## Edge Functions (Supabase)

- `notify-new-job` — notificação push quando há uma nova vaga publicada
- `referral-reward` — créditos de CV por convite
- `gemini-proxy` — proxy para a API Gemini (exige `GEMINI_API_KEY` no projeto)

## Notas de segurança

- Nunca colocar `SUPABASE_SERVICE_ROLE_KEY` em código de frontend — usar apenas em Edge Functions/scripts server-side.
- A `Content-Security-Policy` está definida em `vercel.json` — manter os domínios externos actualizados (Supabase, Plausible, Google Fonts).

## Deploy

O projeto está configurado para **Vercel** (`vercel.json`), que publica `dist/` com SPA fallback (`/* -> /index.html`). Deploy automático no push a `main` → https://resolveao.vercel.app/

## Utilitários

- `scripts/` — utilitários manuais pontuais (logo, migrações pontuais, SQL de setup); não fazem parte do fluxo normal
- `scraper/` — scrapers Python corridos pelos GitHub Actions (ver secção acima)
