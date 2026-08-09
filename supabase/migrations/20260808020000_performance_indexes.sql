-- ============================================================
-- PERFORMANCE INDEXES — Resolve.AO
-- Índices desenhados a partir dos padrões reais de query da app
-- (services/api/*.ts)
-- ============================================================

-- jobs: filtro status (público) + ordenação por data
CREATE INDEX IF NOT EXISTS idx_jobs_status_posted
  ON public.jobs (status, posted_at DESC);

-- news_articles: filtro status (público) + ordenação por data
CREATE INDEX IF NOT EXISTS idx_news_status_published
  ON public.news_articles (status, published_at DESC);

-- product_deals: filtro status (público)
CREATE INDEX IF NOT EXISTS idx_deals_status_created
  ON public.product_deals (status, created_at DESC);

-- orders: listagem por utilizador (getUserOrders)
CREATE INDEX IF NOT EXISTS idx_orders_user_email_created
  ON public.orders (user_email, created_at DESC);

-- orders: consultas por data (getActiveOrdersCount, getLatestOrders)
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON public.orders (created_at DESC);

-- subscriptions_pending: listagem por utilizador (admin/user)
CREATE INDEX IF NOT EXISTS idx_subscriptions_pending_user_created
  ON public.subscriptions_pending (user_id, created_at DESC);

-- ads: apenas ativos + ordem de exibição (getAds)
CREATE INDEX IF NOT EXISTS idx_ads_active_order
  ON public.ads (is_active, display_order ASC);

-- exchange_rates: lookup por moeda (ExchangeService)
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency
  ON public.exchange_rates (currency);

-- push_subscriptions: consultas por utilizador (notificações)
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON public.push_subscriptions (user_id);

-- notification_rate_limit: rate-limit por utilizador
CREATE INDEX IF NOT EXISTS idx_notification_rate_limit_user
  ON public.notification_rate_limit (user_id);

-- admin_notifications: feed de notificações do admin
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created
  ON public.admin_notifications (created_at DESC);
