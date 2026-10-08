-- ============================================================
-- Fix de regressões de segurança verificadas em produção (2026-10-08)
--
-- 1) get_ai_usage: database/FINAL_COMPLETE_FIX.sql e
--    database/security_advisor_complete_fix.sql passaram-na a
--    SECURITY INVOKER, mas public.ai_usage tem REVOKE ALL de
--    authenticated -> "permission denied for table ai_usage" (403)
--    no contador de IA do cliente. Volta a SECURITY DEFINER com
--    guarda de ownership (cada um só lê o próprio registo;
--    a edge gemini-proxy continua a ler como service_role).
--
-- 2) protect_profile_sensitive_columns: revertia ALWAYS as colunas
--    privilegiadas quando auth.uid() IS NULL, o que inclui pedidos
--    da edge subscription-approve (service_role) -> a aprovação de
--    pagamento nunca aplicava is_premium/account_type/cv_credits.
--    Passa a permitir service_role/postgres; clientes normais
--    (anon/authenticated não-admin) continuam completamente bloqueados.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_ai_usage(p_user_id UUID, p_month TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_count INT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 0;
  END IF;
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RETURN 0;
  END IF;
  SELECT count INTO v_count
    FROM public.ai_usage
   WHERE user_id = p_user_id
     AND usage_month = p_month;
  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ai_usage(UUID, TEXT) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.get_ai_usage(UUID, TEXT) FROM anon, PUBLIC;

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  -- Perfis de servidor (Edge Functions via service_role / SQL directo postgres)
  IF current_user IN ('service_role', 'postgres') THEN
    RETURN NEW;
  END IF;
  -- Impede que utilizadores normais alterem campos privilegiados
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    NEW.is_admin     := OLD.is_admin;
    NEW.is_premium   := OLD.is_premium;
    NEW.cv_credits   := OLD.cv_credits;
    NEW.account_type := OLD.account_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_sensitive_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_sensitive_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_columns();
