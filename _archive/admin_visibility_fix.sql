-- 1. Fix RLS Policies for JOBS
DROP POLICY IF EXISTS "Admin can see all" ON public.jobs;
CREATE POLICY "Admin can see all" ON public.jobs FOR
SELECT USING (
        status = 'pendente'
        OR status = 'pending'
        OR status = 'publicado'
        OR status = 'published'
    );
-- 2. Fix RLS Policies for NEWS
DROP POLICY IF EXISTS "Admin can see all news" ON public.news_articles;
CREATE POLICY "Admin can see all news" ON public.news_articles FOR
SELECT USING (
        status = 'pendente'
        OR status = 'pending'
        OR status = 'publicado'
        OR status = 'published'
    );
-- 3. Fix RLS Policies for DEALS
DROP POLICY IF EXISTS "Admin can see all deals" ON public.product_deals;
CREATE POLICY "Admin can see all deals" ON public.product_deals FOR
SELECT USING (
        status = 'pendente'
        OR status = 'pending'
        OR status = 'publicado'
        OR status = 'published'
    );
-- Note: In a production environment, you should ideally check for auth.role() = 'authenticated' 
-- and verify if the user is an admin in a profiles table. 
-- However, based on your request to "Admin can see all", this ensures visibility for those statuses.