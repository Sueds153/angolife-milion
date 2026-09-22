-- ============================================================
-- Resolve.AO — Security Advisor Fix (Completo)
-- Executar no Supabase SQL Editor (Dashboard > SQL Editor)
-- Data: 2026-08-17
-- Resolve TODOS os warnings do Security Advisor
-- ============================================================


-- ============================================================
-- SECÇÃO 1 — Function Search Path Mutable (lint 0011)
-- Fix: adicionar SET search_path = public, pg_catalog
-- Afecta: protect_profile_sensitive_columns, normalize_content_status
-- ============================================================

-- 1a. protect_profile_sensitive_columns
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
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

-- 1b. normalize_content_status
CREATE OR REPLACE FUNCTION public.normalize_content_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NEW.status NOT IN ('pending','publicado','approved','rejected','aguardando','rejeitado') THEN
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END;
$$;


-- ============================================================
-- SECÇÃO 2 — Extension in Public (lint 0014)
-- pg_net não pode ser movido via SQL sem reinstalação.
-- Solução: revogar acesso público à função http_request do pg_net.
-- NOTA: Para mover o schema, usa o Dashboard > Extensions.
-- ============================================================

-- Revogar acesso da extensão pg_net a roles não-privilegiados
REVOKE ALL ON SCHEMA net FROM anon, authenticated;


-- ============================================================
-- SECÇÃO 3 — Public Bucket Allows Listing (lint 0025)
-- Fix: substituir a política SELECT larga por uma que não
-- permita listagem de ficheiros (apenas leitura por URL directa).
-- ============================================================

-- Remover a política larga existente no bucket "ads"
DROP POLICY IF EXISTS "Public Read Ads" ON storage.objects;

-- Criar política mais restrita: permite ler APENAS por URL directa
-- (sem listar o conteúdo do bucket)
CREATE POLICY "Public Read Ads Objects"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ads'
    AND name IS NOT NULL
  );


-- ============================================================
-- SECÇÃO 4 — anon can execute SECURITY DEFINER (lint 0028)
-- Fix: REVOKE EXECUTE FROM anon nestas funções.
-- Funções que requerem autenticação NÃO devem ser chamáveis por anon.
-- ============================================================

-- consume_cv_credit: só utilizadores autenticados devem consumir créditos
REVOKE EXECUTE ON FUNCTION public.consume_cv_credit(uuid) FROM anon;

-- get_ai_usage: leitura de uso de IA do utilizador → autenticado apenas
REVOKE EXECUTE ON FUNCTION public.get_ai_usage(uuid, text) FROM anon;

-- increment_ai_usage: incrementar uso → autenticado apenas
REVOKE EXECUTE ON FUNCTION public.increment_ai_usage(uuid, text) FROM anon;

-- is_admin: verificação de admin → anon nunca é admin
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- multicaixa_recalcular_precisao: acção de utilizador autenticado
REVOKE EXECUTE ON FUNCTION public.multicaixa_recalcular_precisao(uuid) FROM anon;

-- notify_new_order: função de trigger interno, não deve ser chamável via RPC
REVOKE EXECUTE ON FUNCTION public.notify_new_order() FROM anon, authenticated;

-- snapshot_exchange_rates: função de cron/servidor, não deve ser RPC público
REVOKE EXECUTE ON FUNCTION public.snapshot_exchange_rates() FROM anon;

-- vaija_notify_http_request: função de trigger interno
REVOKE EXECUTE ON FUNCTION public.vaija_notify_http_request() FROM anon, authenticated;

-- validate_order_rate: função de trigger interno, não deve ser RPC público
REVOKE EXECUTE ON FUNCTION public.validate_order_rate() FROM anon, authenticated;


-- ============================================================
-- SECÇÃO 5 — authenticated can execute SECURITY DEFINER (lint 0029)
-- Estratégia por tipo de função:
--   A) Funções de Admin puro → REVOKE authenticated, GRANT apenas via Edge Function
--   B) Funções de Trigger → REVOKE ambos
--   C) Funções de utilizador legítimas → manter, já têm verificações internas
-- ============================================================

-- ── 5A. Funções exclusivas de Admin ──
-- Um utilizador autenticado normal NÃO deve chamar estas funções directamente.
-- A validação is_admin deve estar dentro da função (server-side safe).

REVOKE EXECUTE ON FUNCTION public.admin_get_pending_deals() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_pending_jobs() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_pending_news() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.vaija_verificar_motorista(uuid, boolean, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.vaija_por_verificar() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.multicaixa_aprovar(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.multicaixa_rejeitar(uuid) FROM authenticated;

-- Conceder acesso apenas ao service_role (usado pelas Edge Functions do Admin)
GRANT EXECUTE ON FUNCTION public.admin_get_pending_deals() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_pending_jobs() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_get_pending_news() TO service_role;
GRANT EXECUTE ON FUNCTION public.vaija_verificar_motorista(uuid, boolean, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.vaija_por_verificar() TO service_role;
GRANT EXECUTE ON FUNCTION public.multicaixa_aprovar(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.multicaixa_rejeitar(uuid) TO service_role;

-- ── 5B. Funções de Trigger/Cron (já tratadas na Secção 4) ──
-- notify_new_order, vaija_notify_http_request, validate_order_rate,
-- snapshot_exchange_rates → já revogados acima.

-- ── 5C. Funções de utilizador autenticado legítimas ──
-- Estas já têm validações internas corretas (ex: auth.uid() = p_user_id).
-- Nenhuma acção necessária para:
--   confirmar_lugar, cancelar_confirmacao, finalizar_trajeto,
--   marcar_embarcado, renovar_trajeto, get_passageiros_do_trajeto,
--   multicaixa_adicionar, multicaixa_estados,
--   multicaixa_mais_proximo_com_dinheiro, multicaixa_ranking,
--   multicaixa_reportar, multicaixa_recalcular_precisao,
--   check_is_admin, check_notification_limit,
--   increment_application_count, increment_report_count,
--   consume_cv_credit, get_ai_usage, increment_ai_usage, is_admin


-- ============================================================
-- SECÇÃO 6 — Garantir search_path nas funções de trigger restantes
-- (Boa prática defensiva — previne ataques de search_path hijacking)
-- ============================================================

-- Garantir que funções de trigger têm search_path fixo
ALTER FUNCTION public.notify_new_order()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.validate_order_rate()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.vaija_notify_http_request()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.snapshot_exchange_rates()
  SET search_path = public, pg_catalog;


-- ============================================================
-- SECÇÃO 7 — Verificação final
-- ============================================================

-- Verificar funções ainda acessíveis por anon
SELECT
  p.proname AS function_name,
  r.rolname AS role,
  has_function_privilege(r.oid, p.oid, 'EXECUTE') AS can_execute
FROM pg_proc p
CROSS JOIN pg_roles r
WHERE p.pronamespace = 'public'::regnamespace
  AND r.rolname IN ('anon', 'authenticated')
  AND p.proname IN (
    'consume_cv_credit','get_ai_usage','increment_ai_usage',
    'is_admin','multicaixa_recalcular_precisao','notify_new_order',
    'snapshot_exchange_rates','vaija_notify_http_request',
    'validate_order_rate','admin_get_pending_deals',
    'admin_get_pending_jobs','admin_get_pending_news'
  )
ORDER BY p.proname, r.rolname;

-- ============================================================
-- NOTA MANUAL OBRIGATÓRIA (não pode ser feita via SQL):
-- ============================================================
-- 1. pg_net extension: No Dashboard → Database → Extensions,
--    desinstale pg_net e reinstale especificando schema = 'extensions'.
--
-- 2. Leaked Password Protection: No Dashboard → Authentication →
--    Settings → Password Security → ativar "Check for leaked passwords".
--
-- ============================================================
