-- ==========================================
-- Resolve.AO: FIX RLS RECURSION (live database 42P17)
-- Verified against live DB via Management API snapshot.
-- The helper functions public.is_admin() and public.check_is_admin()
-- already exist and are SECURITY DEFINER (no recursion).
-- Problem: a second generation of admin policies still use inline
-- subqueries on public.profiles  ->  "infinite recursion detected in
-- policy for relation profiles" -> every public query on those tables
-- returns HTTP 500.
--
-- Fix: drop the recursive policies (exact live names) and recreate them
-- using public.is_admin(). Idempotent (DROP IF EXISTS + CREATE).
-- ==========================================

-- 1. DROP recursive admin policies (inline subquery -> profiles)
DROP POLICY IF EXISTS "Admins manage ads" ON public.ads;
DROP POLICY IF EXISTS "Admins can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "admin_gerir_vagas" ON public.jobs;
DROP POLICY IF EXISTS "Admins manage news" ON public.news_articles;
DROP POLICY IF EXISTS "Admins view all news" ON public.news_articles;
DROP POLICY IF EXISTS "admin_gerir_noticias" ON public.news_articles;
DROP POLICY IF EXISTS "Admins manage deals" ON public.product_deals;
DROP POLICY IF EXISTS "Admins view all deals" ON public.product_deals;
DROP POLICY IF EXISTS "admin_gerir_descontos" ON public.product_deals;
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin view all subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Admins manage all requests" ON public.subscriptions_pending;
DROP POLICY IF EXISTS "Admins manage settings" ON public.system_settings;

-- 2. Recreate with SECURITY DEFINER helper (no recursion)
CREATE POLICY "Admins manage ads" ON public.ads
    FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can insert jobs" ON public.jobs
    FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can view all jobs" ON public.jobs
    FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_gerir_vagas" ON public.jobs
    FOR ALL USING (public.is_admin());
CREATE POLICY "Admins manage news" ON public.news_articles
    FOR ALL USING (public.is_admin());
CREATE POLICY "Admins view all news" ON public.news_articles
    FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_gerir_noticias" ON public.news_articles
    FOR ALL USING (public.is_admin());
CREATE POLICY "Admins manage deals" ON public.product_deals
    FOR ALL USING (public.is_admin());
CREATE POLICY "Admins view all deals" ON public.product_deals
    FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_gerir_descontos" ON public.product_deals
    FOR ALL USING (public.is_admin());
CREATE POLICY "Admins view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin view all subscriptions" ON public.push_subscriptions
    FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins manage all requests" ON public.subscriptions_pending
    FOR ALL USING (public.is_admin());
CREATE POLICY "Admins manage settings" ON public.system_settings
    FOR ALL USING (public.is_admin());

-- 3. Grant EXECUTE so policies may call it under anon/authenticated roles
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- 4. Harden self-update: prevent non-admin self-promotion to is_admin=true
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND (NOT is_admin OR public.is_admin()));

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
