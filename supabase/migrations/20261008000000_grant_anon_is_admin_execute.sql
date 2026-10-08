-- FIX 42501: anon perdeu EXECUTE em public.is_admin().
--
-- Sintoma em producao: toda a leitura anonima (postgrest role anon) de
--   jobs, news_articles, product_deals, ads, system_settings
-- devolvia 401 {"code":"42501","message":"permission denied for function is_admin"}.
-- Causa: REVOKE ... FROM public, anon aplicado em 20260924100000_security_hardening.sql
-- (+ o script manual database/security_advisor_fix.sql), enquanto 16 policies
-- de leitura publica continuam a chamar is_admin() no seu USING/WITH CHECK.
--
-- Seguranca: is_admin() e SECURITY DEFINER mas devolve false quando
-- auth.uid() IS NULL, portanto para anon e apenas um false. O grant e
-- explicito, por isso sobrevive ao REVOKE ... FROM public que a migracao
-- 20260924100000 faz (aqui corre antes deste ficheiro).
--
-- Trade-off aceite: o advisor Supabase volta a sinalizar
-- "SECURITY DEFINER function accessible by anon" como warning.
grant execute on function public.is_admin() to anon;

notify pgrst, 'reload schema';
