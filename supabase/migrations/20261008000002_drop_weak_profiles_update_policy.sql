-- Higiene: public.profiles tinha DUAS policies de UPDATE concorrentes.
-- As policies permissivas combinam por OU, por isso a mais fraca ganha.
--
--   "Users can update own profile"  (security_patch_v2, a forte)
--     WITH CHECK trava is_admin, is_premium, cv_credits e account_type
--   "Users update own profile"      (a fraca, duplicada)
--     WITH CHECK so trava is_admin -> anulava a protecao da forte
--
-- Na pratica nao era exploravel (a migracao 20260805000000 revoga UPDATE e
-- concede apenas colunas seguras, e o trigger protect_profile_sensitive_columns
-- faz a mesma verificacao), mas removemos a duplicada para nao deixar uma
-- policy fraca ativa.
--
-- Mantemos "Users can update own profile", que e pelo menos tao permissiva
-- para as colunas seguras (full_name, phone, avatar_url, bio, location,
-- cv_history, saved_jobs, application_history).

drop policy if exists "Users update own profile" on public.profiles;

notify pgrst, 'reload schema';
