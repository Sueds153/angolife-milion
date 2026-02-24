-- ==============================================================================
-- FIX SECURITY ADVISOR WARNINGS
-- ==============================================================================
-- 1. FIX FUNCTION SEARCH PATH MUTABLE WARNINGS
-- Security best practice: explicitly set the search_path to prevent search path hijacking.
ALTER FUNCTION public.handle_new_user()
SET search_path = public;
ALTER FUNCTION public.increment_deal_views(uuid)
SET search_path = public;
ALTER FUNCTION public.increment_deal_likes(uuid)
SET search_path = public;
ALTER FUNCTION public.increment_news_views(uuid)
SET search_path = public;
ALTER FUNCTION public.increment_news_likes(uuid)
SET search_path = public;
ALTER FUNCTION public.increment_job_views(uuid)
SET search_path = public;
ALTER FUNCTION public.increment_job_likes(uuid)
SET search_path = public;
-- 2. FIX RLS POLICY ALWAYS TRUE WARNINGS
-- Drop any overly permissive UPDATE/DELETE/INSERT/ALL policies
DO $$
DECLARE r RECORD;
BEGIN FOR r IN (
    SELECT policyname,
        tablename
    FROM pg_policies
    WHERE schemaname = 'public'
        AND tablename IN (
            'jobs',
            'news_articles',
            'product_deals',
            'exchange_rates'
        )
        AND cmd IN ('UPDATE', 'DELETE', 'INSERT', 'ALL')
) LOOP EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
END LOOP;
END $$;
-- 3. RECREATE SECURE POLICIES (ONLY ADMINS CAN UPDATE/DELETE/INSERT VIA FRONTEND)
-- For Jobs
CREATE POLICY "Admin Update Jobs Secure" ON public.jobs FOR
UPDATE USING (
        auth.uid() IN (
            SELECT id
            FROM public.profiles
            WHERE is_admin = true
        )
    );
CREATE POLICY "Admin Delete Jobs Secure" ON public.jobs FOR DELETE USING (
    auth.uid() IN (
        SELECT id
        FROM public.profiles
        WHERE is_admin = true
    )
);
CREATE POLICY "Admin Insert Jobs Secure" ON public.jobs FOR
INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id
            FROM public.profiles
            WHERE is_admin = true
        )
    );
-- For News
CREATE POLICY "Admin Update News Secure" ON public.news_articles FOR
UPDATE USING (
        auth.uid() IN (
            SELECT id
            FROM public.profiles
            WHERE is_admin = true
        )
    );
CREATE POLICY "Admin Delete News Secure" ON public.news_articles FOR DELETE USING (
    auth.uid() IN (
        SELECT id
        FROM public.profiles
        WHERE is_admin = true
    )
);
CREATE POLICY "Admin Insert News Secure" ON public.news_articles FOR
INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id
            FROM public.profiles
            WHERE is_admin = true
        )
    );
-- For Deals
CREATE POLICY "Admin Update Deals Secure" ON public.product_deals FOR
UPDATE USING (
        auth.uid() IN (
            SELECT id
            FROM public.profiles
            WHERE is_admin = true
        )
    );
CREATE POLICY "Admin Delete Deals Secure" ON public.product_deals FOR DELETE USING (
    auth.uid() IN (
        SELECT id
        FROM public.profiles
        WHERE is_admin = true
    )
);
CREATE POLICY "Admin Insert Deals Secure" ON public.product_deals FOR
INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id
            FROM public.profiles
            WHERE is_admin = true
        )
    );
-- For Exchange Rates
CREATE POLICY "Admin Update Rates Secure" ON public.exchange_rates FOR
UPDATE USING (
        auth.uid() IN (
            SELECT id
            FROM public.profiles
            WHERE is_admin = true
        )
    );
CREATE POLICY "Admin Insert Rates Secure" ON public.exchange_rates FOR
INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id
            FROM public.profiles
            WHERE is_admin = true
        )
    );
CREATE POLICY "Admin Delete Rates Secure" ON public.exchange_rates FOR DELETE USING (
    auth.uid() IN (
        SELECT id
        FROM public.profiles
        WHERE is_admin = true
    )
);
-- 4. RESTORE SELECT POLICIES (CRITICAL FOR VISIBILITY)
-- For Jobs
CREATE POLICY "Public Select Published Jobs" ON public.jobs FOR
SELECT USING (status IN ('publicado', 'published', 'aprovado'));
CREATE POLICY "Admin Select All Jobs" ON public.jobs FOR
SELECT USING (
        auth.uid() IN (
            SELECT id
            FROM public.profiles
            WHERE is_admin = true
        )
    );
-- For News
CREATE POLICY "Public Select Published News" ON public.news_articles FOR
SELECT USING (status IN ('publicado', 'published'));
CREATE POLICY "Admin Select All News" ON public.news_articles FOR
SELECT USING (
        auth.uid() IN (
            SELECT id
            FROM public.profiles
            WHERE is_admin = true
        )
    );
-- For Deals
CREATE POLICY "Public Select Published Deals" ON public.product_deals FOR
SELECT USING (status = 'approved');
CREATE POLICY "Admin Select All Deals" ON public.product_deals FOR
SELECT USING (
        auth.uid() IN (
            SELECT id
            FROM public.profiles
            WHERE is_admin = true
        )
    );
-- For Rates
CREATE POLICY "Public Select Rates" ON public.exchange_rates FOR
SELECT USING (true);
-- Reload schema caches
NOTIFY pgrst,
'reload schema';