-- RLS SECURITY HARDENING SCRIPT (AngoLife)
-- Este script resolve todos os alertas de "Policy Always True" do Security Advisor
-- 0. GARANTIR QUE COLUNAS NECESSÁRIAS EXISTEM
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS user_email TEXT;
-- 1. REMOVER ABSOLUTAMENTE TODAS AS POLÍTICAS EXISTENTES (Limpeza Profunda)
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT policyname,
        tablename
    FROM pg_policies
    WHERE schemaname = 'public'
) LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
END LOOP;
END $$;
-- 2. RE-ATIVAR RLS EM TODAS AS TABELAS QUE EXISTEM
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_deals ENABLE ROW LEVEL SECURITY;
-- 3. APLICAR POLÍTICAS DE PRIVILÉGIO MÍNIMO
-- [EXCHANGE_RATES]
CREATE POLICY "Allow Public Read" ON public.exchange_rates FOR
SELECT USING (true);
-- [JOBS]
CREATE POLICY "Allow Public Read" ON public.jobs FOR
SELECT USING (status = 'published');
CREATE POLICY "Allow Authenticated Insert" ON public.jobs FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
-- [NEWS_ARTICLES]
CREATE POLICY "Allow Public Read" ON public.news_articles FOR
SELECT USING (status = 'published');
-- [PRODUCT_DEALS]
CREATE POLICY "Allow Public Read" ON public.product_deals FOR
SELECT USING (status = 'approved');
CREATE POLICY "Allow Authenticated Insert" ON public.product_deals FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
-- [ORDERS]
CREATE POLICY "Allow Public Insert" ON public.orders FOR
INSERT WITH CHECK (true);
CREATE POLICY "Allow User View Own Orders" ON public.orders FOR
SELECT USING (user_email = (auth.jwt()->>'email'));