-- SECURITY AUDIT SCRIPT
-- Execute this in your Supabase SQL Editor to audit and harden your database.
-- 1. Check tables without RLS
SELECT relname as table_name,
    relrowsecurity as rls_enabled
FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND relrowsecurity = false;
-- 2. Force Enable RLS on core tables if not enabled
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exchange_rates ENABLE ROW LEVEL SECURITY;
-- 3. Basic Security Policies Example (Profiles)
-- Users can only update their own profile
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Users can update own profile'
) THEN CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (auth.uid() = id);
END IF;
END $$;
-- Anyone can read published content (Jobs/News/Deals)
-- (Assuming 'published' status is the gatekeeper)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE policyname = 'Public can read published jobs'
) THEN CREATE POLICY "Public can read published jobs" ON public.jobs FOR
SELECT USING (
        status = 'publicado'
        OR status = 'published'
    );
END IF;
END $$;
-- 4. Audit Table Permissions
-- Ensure the 'anon' role doesn't have excessive permissions
-- (Supabase defaults are usually good, but it's good to check)
SELECT grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
    AND grantee = 'anon'
    AND table_name NOT IN (
        'exchange_rates',
        'jobs',
        'news_articles',
        'product_deals'
    );