-- Enforce strict RLS on public.profiles

-- 1. Remove the anonymous read-all policy (data leak).
--    Before: "profiles_ver_publico" (SELECT using true) let ANY client,
--    including anonymous, read every profile (email, phone, cv_history,
--    application_history, saved_jobs, is_admin, is_premium, ...).
DROP POLICY IF EXISTS "profiles_ver_publico" ON public.profiles;

-- 2. Revoke all privileges from anon (defense-in-depth).
--    Signup inserts run through the SECURITY DEFINER trigger
--    (handle_new_user) as postgres, so no client flow needs anon access.
REVOKE ALL ON public.profiles FROM anon;

-- 3. Restrict authenticated privileges to safe columns (defense-in-depth).
--    The trigger protect_profile_sensitive_columns already rejects changes to
--    is_admin / cv_credits / referral_count / is_premium / account_type for
--    non-privileged roles; column grants additionally prevent editing email,
--    premium_expiry, has_referral_discount, referred_by, referral_code, etc.
REVOKE DELETE, INSERT, TRUNCATE, REFERENCES, TRIGGER ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, avatar_url, bio, location, cv_history, saved_jobs, application_history) ON public.profiles TO authenticated;
