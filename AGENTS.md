# AGENTS.md — Resolve.AO / angolife

## Tokens de integração
Os tokens (GitHub, Vercel, Supabase, Sentry) e os IDs dos projetos estão em
**`.env.tokens`** (na raiz deste repo). Está no `.gitignore` (`.env*`) — nunca commitar.

- Ler com `Get-Content .env.tokens` (PowerShell) ou `cat .env.tokens`.
- Nunca imprimir os valores no output nem escrevê-los noutros ficheiros.
- Cada linha tem o formato `CHAVE=valor`.

## Comandos de verificação
- `npm run lint` · `npx tsc --noEmit` · `npx vitest run --passWithNoTests` · `npm run build`
- Produção: `https://resolveao.vercel.app/` (deploy automático no push a `main`)

## Convenções
- SEO: `<Helmet>` com title/description/keywords/og como primeiro child da raiz JSX.
- Modais: `role="dialog" aria-modal="true" aria-label="..."`; loaders `role="status" aria-live="polite"`.
- Migrações SQL novas em `supabase/migrations/` + `npx supabase db push` (nunca editar migrations já aplicadas).
- `pg_policies.cmd` devolve MAIUSCULAS; policies `INSERT` só aceitam `WITH CHECK`.
