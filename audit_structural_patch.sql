-- ==========================================
-- AngoLife AUDIT PATCH (2026-02-24)
-- Normalization and Structural Fixes
-- ==========================================
DO $$ BEGIN -- 1. PATCH PROFILES
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'account_type'
) THEN
ALTER TABLE public.profiles
ADD COLUMN account_type TEXT DEFAULT 'free';
END IF;
-- 2. PATCH JOBS (Consistency)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'jobs'
        AND column_name = 'fonte'
) THEN
ALTER TABLE public.jobs
ADD COLUMN fonte TEXT;
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
IF NOT EXISTS (
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
-- 3. PATCH NEWS (Ensure Scraper Compatibility)
-- If news_articles was created with English names (title), we add Portuguese names safely
IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'news_articles'
        AND column_name = 'title'
) THEN
ALTER TABLE public.news_articles
    RENAME COLUMN title TO titulo;
ALTER TABLE public.news_articles
    RENAME COLUMN summary TO resumo;
ALTER TABLE public.news_articles
    RENAME COLUMN source TO fonte;
ALTER TABLE public.news_articles
    RENAME COLUMN url TO url_origem;
ALTER TABLE public.news_articles
    RENAME COLUMN category TO categoria;
END IF;
-- Ensure missing columns in news
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'news_articles'
        AND column_name = 'corpo'
) THEN
ALTER TABLE public.news_articles
ADD COLUMN corpo TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'news_articles'
        AND column_name = 'imagem_url'
) THEN
ALTER TABLE public.news_articles
ADD COLUMN imagem_url TEXT;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'news_articles'
        AND column_name = 'is_priority'
) THEN
ALTER TABLE public.news_articles
ADD COLUMN is_priority BOOLEAN DEFAULT false;
END IF;
END $$;
-- 4. REFRESH RLS POLICIES FOR SECURE ACCESS
-- Restrict profile access so users only see their own row
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Users see own profile" ON public.profiles FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Admin see all profiles" ON public.profiles FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = auth.uid()
                AND is_admin = true
        )
    );
-- Reload schema caches
NOTIFY pgrst,
'reload schema';