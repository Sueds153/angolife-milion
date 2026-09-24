-- ⚠️ DEPRECADO / NEUTRALIZADO
-- Este script criava políticas de escrita PÚBLICAS no bucket ads
-- (Public Upload/Update/Delete Ads) — qualquer visitante podia reescrever
-- anúncios. Não execute no ambiente live.
--
-- Use em vez disso:
--   supabase/migrations/20260924000000_ads_system_settings.sql
--   supabase/migrations/20260924000001_ads_storage_admin_only.sql
--
-- Mantido apenas como referência histórica (sem policies de escrita).

select 1;
