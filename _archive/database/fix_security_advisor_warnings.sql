-- ==========================================
-- AngoLife SECURITY ADVISOR FIXES
-- Solve: Search Path Mutability, Disabled RLS on pending tables
-- ==========================================
-- 1. Fix: Function Search Path Mutable
-- Secures the admin check function to prevent potentially malicious search path hijacking.
ALTER FUNCTION public.check_is_admin()
SET search_path = public,
    pg_temp;
-- 2. Fix: RLS Disabled in Public / Policy exists RLS Disabled
-- Ensure Row Level Security is truly enabled for the pending subscriptions table.
ALTER TABLE public.subscriptions_pending ENABLE ROW LEVEL SECURITY;
-- 3. Re-Verify or Create Admin Policy
-- Ensures that only authorized admins can see the records in this table.
DROP POLICY IF EXISTS "Admin see all subscriptions" ON public.subscriptions_pending;
CREATE POLICY "Admin see all subscriptions" ON public.subscriptions_pending FOR
SELECT USING (public.check_is_admin());
-- 4. Force Schema Cache Reload
-- Ensures PostgREST picks up the security changes immediately.
NOTIFY pgrst,
'reload schema';