-- ==========================================
-- Security Hardening Script
-- Resolves Supabase Security Advisor warnings
-- ==========================================
-- 1. Fix: Function Search Path Mutable
-- Description: Functions should specify a search_path to prevent hijacking.
-- Target: public.generate_referral_code
CREATE OR REPLACE FUNCTION public.generate_referral_code() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$ BEGIN -- Generate a random code like ANGO-XXXXXX if it doesn't exist
    IF NEW.referral_code IS NULL THEN NEW.referral_code := 'ANGO-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
END IF;
RETURN NEW;
END;
$$;
-- 2. Recommendation: Leaked Password Protection
-- Description: This is a configuration setting in Supabase Auth Dashboard.
-- Action: 
--   a. Go to Supabase Dashboard > Authentication > Settings.
--   b. Enable "Leaked password protection".
--   c. This ensures users cannot use passwords leaked in known data breaches.
-- 3. Optimization: Ensure RLS is enabled on any missed tables (Audit)
ALTER TABLE IF EXISTS public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;