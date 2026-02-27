-- ==========================================
-- AngoLife MASTER STRUCTURAL REPAIR
-- Solve: Missing Tables, RLS Recursion, Admin Permissions
-- ==========================================
-- 1. ENSURE MISSING TABLES EXIST
CREATE TABLE IF NOT EXISTS public.subscriptions_pending (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    plano_escolhido TEXT,
    url_comprovativo TEXT,
    status TEXT DEFAULT 'aguardando',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
-- 2. FIX RLS RECURSION (Helper Function)
-- This function allows checking admin status without causing "Infinite Recursion"
CREATE OR REPLACE FUNCTION public.check_is_admin() RETURNS boolean AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 3. APPLY REPAIR TO PROFILES
UPDATE public.profiles
SET is_admin = true
WHERE email = 'suedjosue@gmail.com';
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin see all profiles" ON public.profiles;
CREATE POLICY "Admin see all profiles" ON public.profiles FOR
SELECT USING (public.check_is_admin());
-- 4. CLEAN & RE-APPLY POLICIES FOR VISIBILITY
-- JOBS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can see all" ON public.jobs;
CREATE POLICY "Admin can see all" ON public.jobs FOR
SELECT USING (
        status IN ('pendente', 'pending', 'publicado', 'published')
        OR public.check_is_admin()
    );
-- NEWS
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can see all news" ON public.news_articles;
CREATE POLICY "Admin can see all news" ON public.news_articles FOR
SELECT USING (
        status IN ('pendente', 'pending', 'publicado', 'published')
        OR public.check_is_admin()
    );
-- DEALS
ALTER TABLE public.product_deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can see all deals" ON public.product_deals;
CREATE POLICY "Admin can see all deals" ON public.product_deals FOR
SELECT USING (
        status IN ('pendente', 'pending', 'publicado', 'published')
        OR public.check_is_admin()
    );
-- CV SUBSCRIPTIONS
ALTER TABLE public.subscriptions_pending ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin see all subscriptions" ON public.subscriptions_pending;
CREATE POLICY "Admin see all subscriptions" ON public.subscriptions_pending FOR
SELECT USING (public.check_is_admin());
-- RELOAD CACHES
NOTIFY pgrst,
'reload schema';