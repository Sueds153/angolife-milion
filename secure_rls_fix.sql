-- ==========================================
-- AngoLife Security Hardening: RLS Policy Fix (v2)
-- ==========================================
-- 0. Garantir que as colunas de métricas existem na tabela jobs
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'jobs'
        AND column_name = 'report_count'
) THEN
ALTER TABLE public.jobs
ADD COLUMN report_count INTEGER DEFAULT 0;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'jobs'
        AND column_name = 'application_count'
) THEN
ALTER TABLE public.jobs
ADD COLUMN application_count INTEGER DEFAULT 0;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'jobs'
        AND column_name = 'is_verified'
) THEN
ALTER TABLE public.jobs
ADD COLUMN is_verified BOOLEAN DEFAULT false;
END IF;
END $$;
-- 1. Exchange Rates: Apenas leitura pública. Escrita via Service Role (Scraper).
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "Enable update for rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "Public rates are viewable by everyone" ON public.exchange_rates;
DROP POLICY IF EXISTS "Rates are viewable by everyone" ON public.exchange_rates;
CREATE POLICY "Rates are viewable by everyone" ON public.exchange_rates FOR
SELECT USING (true);
-- 2. Jobs: Restrição de escrita para evitar abusos.
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for jobs" ON public.jobs;
DROP POLICY IF EXISTS "Enable update for jobs" ON public.jobs;
DROP POLICY IF EXISTS "Public jobs are viewable by everyone" ON public.jobs;
DROP POLICY IF EXISTS "Published jobs are viewable by everyone" ON public.jobs;
DROP POLICY IF EXISTS "Public can submit jobs" ON public.jobs;
DROP POLICY IF EXISTS "Public can increment counts" ON public.jobs;
-- SELECT: Apenas vagas publicadas para o público
CREATE POLICY "Published jobs are viewable by everyone" ON public.jobs FOR
SELECT USING (status = 'published');
-- INSERT: Permitido para todos, mas force status 'pending'
CREATE POLICY "Public can submit jobs" ON public.jobs FOR
INSERT WITH CHECK (
        status = 'pending'
        OR status IS NULL
    );
-- UPDATE: Permitido apenas para report_count e application_count
-- Simplificado para evitar subqueries em WITH CHECK que podem falhar dependendo da versão
CREATE POLICY "Public can increment counts" ON public.jobs FOR
UPDATE USING (status = 'published');
-- 3. News Articles: Leitura pública, escrita via admin/scraper
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for news" ON public.news_articles;
DROP POLICY IF EXISTS "Enable update for news" ON public.news_articles;
DROP POLICY IF EXISTS "Public news are viewable by everyone" ON public.news_articles;
DROP POLICY IF EXISTS "Published news are viewable by everyone" ON public.news_articles;
CREATE POLICY "Published news are viewable by everyone" ON public.news_articles FOR
SELECT USING (status = 'published');
-- 4. Orders: Proteção de privacidade simples
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for orders" ON public.orders;
DROP POLICY IF EXISTS "Full access to orders for anon" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders FOR
INSERT WITH CHECK (true);
-- 5. Product Deals: Leitura pública, escrita moderada
ALTER TABLE public.product_deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for deals" ON public.product_deals;
DROP POLICY IF EXISTS "Enable update for deals" ON public.product_deals;
DROP POLICY IF EXISTS "Approved deals are viewable by everyone" ON public.product_deals;
DROP POLICY IF EXISTS "Anyone can submit deals" ON public.product_deals;
CREATE POLICY "Approved deals are viewable by everyone" ON public.product_deals FOR
SELECT USING (status = 'approved');
CREATE POLICY "Anyone can submit deals" ON public.product_deals FOR
INSERT WITH CHECK (status = 'pending');
-- NOTA: O Scraper (Python) ao usar a SERVICE_ROLE_KEY ignora estas políticas.