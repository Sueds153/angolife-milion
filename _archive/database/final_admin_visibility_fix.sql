-- ==========================================
-- AngoLife FINAL ADMIN VISIBILITY FIX
-- 1. Eliminate RLS Recursion
-- 2. Ensure Admin Status for Sued Josué
-- 3. Standardize RLS for All Modules
-- ==========================================
-- A. Create a SECURITY DEFINER function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.check_is_admin() RETURNS boolean AS $$ BEGIN RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
            AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    pg_temp;
-- B. Ensure structural integrity and Admin Status
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'account_type'
) THEN
ALTER TABLE public.profiles
ADD COLUMN account_type TEXT DEFAULT 'free';
END IF;
END $$;
UPDATE public.profiles
SET is_admin = true,
    account_type = 'premium',
    is_premium = true
WHERE email = 'suedjosue@gmail.com';
-- C. RESET and APPLY Non-Recursive RLS Policies
-- 1. Profiles
DROP POLICY IF EXISTS "Admin see all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users see own profile" ON public.profiles;
CREATE POLICY "Users see own profile" ON public.profiles FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Admin see all profiles" ON public.profiles FOR
SELECT USING (public.check_is_admin());
CREATE POLICY "Admin update all profiles" ON public.profiles FOR
UPDATE USING (public.check_is_admin());
-- 2. Jobs
DROP POLICY IF EXISTS "Admin view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Public view published jobs" ON public.jobs;
CREATE POLICY "Public view published jobs" ON public.jobs FOR
SELECT USING (status IN ('publicado', 'published', 'aprovado'));
CREATE POLICY "Admin view all jobs" ON public.jobs FOR
SELECT USING (public.check_is_admin());
CREATE POLICY "Admin manage jobs" ON public.jobs FOR ALL USING (public.check_is_admin());
-- 3. News
DROP POLICY IF EXISTS "Admin view all news" ON public.news_articles;
DROP POLICY IF EXISTS "Public view published news" ON public.news_articles;
CREATE POLICY "Public view published news" ON public.news_articles FOR
SELECT USING (status IN ('publicado', 'published', 'aprovado'));
CREATE POLICY "Admin view all news" ON public.news_articles FOR
SELECT USING (public.check_is_admin());
CREATE POLICY "Admin manage news" ON public.news_articles FOR ALL USING (public.check_is_admin());
-- 4. Deals (product_deals)
DROP POLICY IF EXISTS "Public view deals" ON public.product_deals;
DROP POLICY IF EXISTS "Admin view all deals" ON public.product_deals;
ALTER TABLE public.product_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view published deals" ON public.product_deals FOR
SELECT USING (status IN ('approved', 'publicado', 'published'));
CREATE POLICY "Admin manage deals" ON public.product_deals FOR ALL USING (public.check_is_admin());
-- 5. Orders
DROP POLICY IF EXISTS "Admin see all orders" ON public.orders;
DROP POLICY IF EXISTS "Users see own orders" ON public.orders;
CREATE POLICY "Users see own orders" ON public.orders FOR
SELECT USING (
        auth.uid() IS NOT NULL
        AND user_email = (
            SELECT email
            FROM auth.users
            WHERE id = auth.uid()
        )
    );
CREATE POLICY "Admin manage orders" ON public.orders FOR ALL USING (public.check_is_admin());
-- Refresh caches
NOTIFY pgrst,
'reload schema';