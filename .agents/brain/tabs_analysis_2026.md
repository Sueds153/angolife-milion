# Resolve.AO — Análise Minuciosa por Aba (Frontend + Backend) — 2026-08

> Base factual verificada a 2026-08-08: leitura completa do frontend (App.tsx + 7 páginas + 8 serviços + store + integrações) e consulta ao Supabase real (`efhelvzdlwewsjkdknkl`) via Management API (tabelas, RLS, políticas, índices, counts, buckets storage, edge functions).

---

## 📊 Estado atual verificado (factos)

| Domínio | Estado |
|---|---|
| Tabelas | 12 em `public`, **todas com RLS ON** (bom) |
| Políticas | profiles 5, jobs 7, news_articles 5, product_deals 7, exchange_rates 2, orders 3, ads 2, push_subscriptions 2, subscriptions_pending 3, system_settings 2, notification_rate_limit 1, admin_notifications 1 |
| **Índices** | **Apenas PKs + unique (url_origem, email, referral_code). Nenhum índice de apoio** nas colunas quentes (`status`, `posted_at`, `published_at`, `user_id`) |
| Counts | jobs **76**, news **561**, product_deals **1**, exchange_rates **2**, orders **0**, profiles **5**, ads **1** |
| Qualidade dados | 0 duplicados; `fonte`/`status`/`posted_at` preenchidos em 100% (jobs, news) |
| Storage buckets | 7 públicos: avatars, payment-receipts, exchange-proofs, discount-images, job-logos, news-images, ads |
| Edge functions (remoto) | 11 ativos: gemini-proxy (JWT), referral-reward (JWT), notify-new-job (JWT), jobs-scraper (JWT), news-scraper (JWT), delete-account (JWT), subscription-approve (JWT), **api-handler (JWT), process-exchange-order (JWT), rate-limiter (NO JWT), get-live-orders (NO JWT)** |
| Repo local vs remoto | `rate-limiter`, `api-handler`, `process-exchange-order`, `get-live-orders` **não existem no repo** (`supabase/functions/`) — risco de drift/source-of-truth |
| Frontend | Vite 6.2.0, React 19.2.4, react-router-dom 7.13.1, zustand 5.0.11, @react-pdf/renderer 4.3.2, @supabase/supabase-js 2.95.3, Sentry |

**Nota RLS**: `exchange_rates` → select público + escrita só `is_admin()` (seguro). `profiles` → patch estrito `20260805000000_strict_rls_profiles.sql` impede auto-promoção de `is_admin`/`cv_credits`/`account_type` (bom).

---

## 🏠 Aba Início (`/`, HomePage)

### Frontend
- **F1 – Ticker de mensagens hardcoded**: `TICKER_MESSAGES` fixo no código (HomePage). O app já tem `system_settings` + `AdsService.fetchSystemSettings()` — mover o ticker/banners para `system_settings` (edição pelo admin sem redeploy).
- **F2 – Dashboard faz N queries na montagem** (JobsService + NewsService + ExchangeService + DealsService + AdsService). Para dados que mudam pouco, usar o cache de sessão do `GeminiService` como padrão, ou React Query/cache com staleTime — reduzir água-forte de requests no arranque.
- **F3 – Skeleton/loading**: confirmar que todas as secções têm estado de loading/erro (vazio não deve parecer falha).

### Backend
- **B1 – `getJobs` sem limite** (jobs.service.ts:39-46): busca **todas** as vagas publicadas (`select("*")` sem `.limit()`). A Home só precisa das 3-5 mais recentes. Criar `JobsService.getLatestJobs(n)` com `.limit(n)`.
- **B2 – Ticker dinâmico**: seed de `system_settings` (key `home_ticker`) consumido pelo front (F1).

---

## 💼 Aba Vagas (`/vagas`, JobsPage)

### Frontend
- **F1 – Filtros 100% client-side**: província + prazo ("Hoje 🔥", "Últimas 48h") filtram sobre a lista **completa** (que já vem toda da API). Com 76 registos ainda funciona, mas degrada; mover para PostgREST (`eq`/`gte`) à medida que cresce.
- **F2 – Sem pesquisa por texto**: adicionar `ilike` em `title`/`company`/`location` (server-side) com debounce.
- **F3 – Sem paginação/infinite scroll**: a página carrega tudo de uma vez. Adicionar `.range()` (offset/limit) + "carregar mais".
- **F4 – Normalização de status**: o serviço filtra `status.eq.publicado,published,aprovado,approved` e `pending,pendente` (jobs.service.ts:41-43,146). Quatro variantes por valor → propenso a erro e impede usar `check` constraint. Unificar para um enum de 3 valores (ex. `rascunho | publicado | arquivado`).

### Backend
- **B1 – Índice em falta (crítico p/ escala)**: a query mais frequente é `WHERE status IN (...) ORDER BY posted_at DESC`. Criar `CREATE INDEX idx_jobs_status_posted_at ON jobs (status, posted_at DESC)`.
- **B2 – `fonte`/dedup**: já limpo (0 duplicados, `fonte` 100%). Manter unique key por `(source_url)` se existir.
- **B3 – Aplicações**: `application_history` é jsonb no perfil (opaco, sem RLS granulado por vaga). Considerar tabela `applications` (user_id, job_id, status, created_at) + RLS por owner, para métricas e estado "candidatado" estruturado.
- **B4 – Notificação de vagas novas**: `notify-new-job` existe (JWT), mas o front dispara **notificações mock aleatórias** a cada 3 min (App.tsx:153-195, `Math.random() > 0.5`, repetindo a mesma vaga). Ligar a push real apenas quando há vaga nova (`news`/realtime) — ver Secção "Transversal".

---

## 💱 Aba Câmbio (`/cambio`, ExchangePage)

### Frontend
- **F1 – Importa `supabase` diretamente** (ExchangePage.tsx:14) — a página fica acoplada ao transporte e fora dos serviços. Mover realtime/subscriptions para `exchange.service.ts` ou hook `useExchangeRates`.
- **F2 – Subscriptions realtime**: confirmar `unsubscribe()` no `useEffect` cleanup (LiveFeed) — senão **memory leak** ao alternar abas (padrão de AdminPage.tsx:146-149 usar canal com cleanup).
- **F3 – UI rica sem dados**: TradeTerminal/DirectTradeSection/LiveFeed com apenas **2 taxas** no BD e **0 ordens**. Ou popular dados (histórico/feed) ou colapsar secções quando vazias para não parecer app quebrado.
- **F4 – `ExchangeCheckoutModal` + `order.service.ts` lança `throw`** (ordem falhada quebra o fluxo com erro genérico) — padronizar retorno `{data|null, error}` como os outros serviços.

### Backend
- **B1 – RLS correto** (só admin escreve) — manter. `updateInformalRate` deve ser exposto apenas no admin panel.
- **B2 – Sem histórico**: só taxas atuais (2 linhas). Criar `exchange_rates_history` (ou append em jsonb) alimentada por pg_cron para gráfico de tendência e para o "LiveFeed".
- **B3 – `orders` vazio + `process-exchange-order`**: feature de troca real dorme sem dados; decidir se é roadmap ou remover do menu.

---

## 📰 Aba Notícias (`/noticias`, NewsPage)

### Frontend
- **F1 – FALLBACK_IMAGE é hotlink Unsplash** (NewsPage:18) — quebra offline, dependência externa, custo de rede. Usar asset local / placeholder SVG inline.
- **F2 – Sem paginação**: `NEWS_LIST_LIMIT = 30` (news.service.ts:26) e **sem "load more"** — 561 artigos enterrados. Adicionar infinite scroll com `.range()`.
- **F3 – Sem filtro de categoria nem pesquisa** server-side.
- **F4 – `isSecret: n.is_priority`** (news.service.ts:39): campo "priority" mapeado para "secret" é confuso; usar nome consistente (`is_priority` ↔ "Destaque").
- **F5 – Imagens hotlinkadas dos sites de origem** (a menos que o scraper grave no bucket `news-images`): quebram ao longo do tempo e pesam no 2G/3G. Baixar imagem para `news-images` no scraper e servir do Supabase CDN.

### Backend
- **B1 – Índice `(status, published_at DESC)`** para a listagem.
- **B2 – Scraper já grava imagem em `news-images`?** Confirmar; se não, implementar download+cache no `news-scraper` (reduz link rot e acelera o app).
- **B3 – Dedup ok (0 duplicados, unique url_origem)** — manter.

---

## 🏷️ Aba Ofertas (`/ofertas`, DealsPage)

### Frontend
- **F1 – `getDeals(false)` sem limite** (DealsPage:35 / deals.service.ts:34-39) — mesma questão de escala da Home.
- **F2 – Upload com fallback dataURL**: `StorageService.uploadDiscountImage` devolve `null` em erro e o form cai no `compressImageToDataUrl` (storage.service.ts:70-73) → **base64 de ~150KB gravado na coluna DB**. Preferir falhar visível em vez de poluir a DB; e restringir tipos/dimensão.
- **F3 – Sem estado de expiração visível**: ofertas antigas ficam "vivas" para sempre na UI.

### Backend
- **B1 – Conteúdo praticamente vazio (1 deal)**: `fetchDeals` via Gemini gera fake data; sem scraper dedicado (ao contrário de jobs/news). Criar `deals-scraper` (Kero/Shoprite/Candando) ou popular via admin.
- **B2 – Índice `(status)` em `product_deals`**.
- **B3 – `expires_at`/auto-arquivamento** via pg_cron para ofertas fora de validade.

---

## 👤 Aba Perfil (`/perfil`, ProfilePage)

### Frontend
- **F1 – Avatar**: `StorageService.uploadAvatar` → bucket público `avatars` (ok), mas sem validação de tipo/tamanho antes do upload.
- **F2 – Mudança de email**: Supabase exige re-autenticação recente para `updateUser({email})`; confirmar que o fluxo trata o erro "email already in use / reautenticação".
- **F3 – `saved_jobs`/`application_history` jsonb**: UI ok para já, mas ver B3 da aba Vagas (migrar para tabelas normalizadas).

### Backend
- **B1 – RLS estrito já aplicado** (anti auto-promoção) — **não reverter**.
- **B2 – Bucket `avatars` público para escrita**: verificar políticas do storage — upload de avatares deve exigir auth (evitar spam/abuso de storage).
- **B3 – `delete-account` (JWT)** já existente — bom; confirmar cascade de push_subscriptions/orders.

---

## 📄 Aba CV (`/cv-criador`, CVBuilderPage) — ⚠️ MAIOR PRIORIDADE (monetização)

### Frontend
- **F1 – ⚠️ `onDecrementCredit` só altera o estado local do zustand** (CVBuilderPage.tsx:32-37: `setUser({ ...currentUser, cvCredits: ... })`) — **nunca persiste `cv_credits` na DB**. Consequência: um utilizador que comprou/ganhou créditos pode gerar PDFs **ilimitados** sem perder crédito na DB (o `cv_credits` da DB nunca desce). Quebra o modelo de monetização.
- **F2 – ⚠️ Gate de IA free = 2/mês via `localStorage`** (`ai_optimizations_month`, CVBuilderPage.tsx:51-53,88-92) — basta limpar o localStorage para resetar. Sem enforcement server-side.
- **F3 – `gemini-proxy` (verify_jwt=True) sem consumo/rate-limit**: qualquer utilizador autenticado pode chamar `improveCVContent`/`improveCVSections`/`fetchJobs`/`fetchNews`/`fetchDeals` **sem limite**, queimando quota Gemini do projeto (gratuita ~1500 req/dia). Não há verificação de `cv_credits` nem limitação por user.
- **F4 – PDF client-side** (`pdf().toBlob()`) é ok; manter. Cuidado com tamanho do bundle do react-pdf (lazy ok via rota).

### Backend (fix recomendado)
- **B1 – Criar edge function/RPC `consume-cv-credit`**: `UPDATE profiles SET cv_credits = cv_credits - 1 WHERE id = auth.uid() AND cv_credits > 0 RETURNING *` (atómico, respeita RLS). Chamada **antes** de servir cada download/otimização AI.
- **B2 – `gemini-proxy` deve**: (a) validar o JWT (já via verify_jwt), (b) **verificar `cv_credits > 0` ou premium** para ações pagas, (c) decrementar crédito, (d) aplicar rate-limit por user (reutilizar função `rate-limiter` ou `notification_rate_limit` como modelo).
- **B3 – Remover contagem `localStorage`** e passar o gate para server-side (B2).
- **B4 – Teste de regressão**: depois do fix, comprar/ganhar créditos → gerar 1 PDF → confirmar `cv_credits` desce na DB; a 0, bloquear download.

---

## 🔄 Transversal / Backend global

1. **Índices em falta (ação de maior impacto/custo)**
   - `jobs(status, posted_at DESC)`
   - `news_articles(status, published_at DESC)`
   - `orders(user_id)` (ou `(user_id, created_at)`)
   - `product_deals(status)`
   - `push_subscriptions(user_id)`
2. **Normalizar `status`** (4 variantes PT/EN → enum/check de 3 valores) em `jobs`, `news_articles`, `product_deals`; simplifica `getJobs`/`getNews`/`getDeals` e permite índices/particionamento melhores.
3. **Segredos**: confirmado — front só tem `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`, sem `service_role` (bom). **Nunca** adicionar service_role ao front.
4. **Storage buckets públicos**: validar políticas de escrita por bucket — `payment-receipts` e `exchange-proofs` contêm dados sensíveis (comprovativos); escrita deve ser `auth.uid() = owner` e leitura restrita/administrador, não público.
5. **Drift de edge functions**: `rate-limiter`, `api-handler`, `process-exchange-order`, `get-live-orders` estão deployados mas **não no repo** (`supabase/functions/`). Copiar fontes para o repo (source of truth) para evitar divergência futura.
6. **Notificações mock vs reais**: App.tsx:153-195 gera notificação aleatória a cada 3 min e re-alerta a mesma vaga. Com `notify-new-job` + push real implementados, substituir por: push apenas quando existe vaga **nova** (trigger/realtime + dedup por `notification_rate_limit`). Evita "spam" e desconexão com a realidade.
7. **Sentry**: ativo — manter; adicionar `beforeSend` filtrando ruído (AbortError, 429) e alertas para `gemini-proxy`.
8. **`rate-limiter` e `get-live-orders` com verify_jwt=False**: rever se o conteúdo exposto (ordens de câmbio em tempo real) é seguro de expor sem auth.
9. **RLS**: todas as tabelas com RLS ON (excelente). Auditoria pontual das políticas `select true` em tabelas de conteúdo (intencional para app público) vs sensíveis (orders, push_subscriptions, payment-receipts devem ser restritas).

---

## 🎯 Prioridades recomendadas (ordem de impacto)

1. **🔴 CV/monetização**: persistir `cv_credits` (consume-cv-credit) + gate de IA server-side + rate-limit no `gemini-proxy` (CVBuilderPage:32-37, 51-53, 88-92).
2. **🟠 Segurança storage**: políticas de escrita/leitura para `payment-receipts`, `exchange-proofs`, `avatars`.
3. **🟠 Índices** para jobs/news/orders/deals (baixo custo, ganho imediato).
4. **🟡 Escala de listagens**: paginação/infinite scroll + pesquisa server-side em Vagas e Notícias; `getLatestJobs(n)` na Home.
5. **🟡 Normalização de status** + simplificação dos serviços.
6. **🟡 Notificações reais** (substituir mock aleatório por push de conteúdo novo).
7. **🟡 Drift de edge functions** (trazer fontes para o repo).
8. **🟢 Reabastecer conteúdo**: Ofertas (deals-scraper ou admin), histórico de câmbio, imagens das notícias cacheadas em `news-images`.
