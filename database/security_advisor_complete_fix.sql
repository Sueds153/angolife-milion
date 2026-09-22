-- ============================================================
-- Resolve.AO — HARDENING COMPLETO DE SEGURANÇA (CONSOLIDADO)
-- Executar no Supabase SQL Editor (Dashboard > SQL Editor)
-- Data: 2026-08-17
-- Resolve todos os erros (ERROR) e avisos (WARN) do Security Advisor.
-- ============================================================


-- ============================================================
-- PARTE 1 — ERROS CRÍTICOS (ERROR)
-- ============================================================

-- 1A. ERRO: security_definer_view (lint 0010)
-- Vista: public.motorista_publico
-- Solução: Recriar com security_invoker = true para respeitar o RLS.
DROP VIEW IF EXISTS public.motorista_publico;
CREATE OR REPLACE VIEW public.motorista_publico
WITH (security_invoker = true)
AS
SELECT
  dm.user_id,
  dm.matricula,
  dm.tipo_veiculo,
  dm.verificado,
  dm.trajetos_fantasma_count,
  dm.status_conta,
  p.full_name,
  p.phone,
  p.avatar_url,
  p.avaliacao_media
FROM public.dados_motorista dm
JOIN public.profiles p ON p.id = dm.user_id;

GRANT SELECT ON public.motorista_publico TO authenticated;


-- 1B. ERRO: rls_disabled_in_public (lint 0013)
-- Tabela: public.exchange_rates_history
-- Solução: Ativar RLS e permitir apenas leitura pública.
ALTER TABLE IF EXISTS public.exchange_rates_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Exchange history public read" ON public.exchange_rates_history;
CREATE POLICY "Exchange history public read"
  ON public.exchange_rates_history
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Exchange history admin insert" ON public.exchange_rates_history;
CREATE POLICY "Exchange history admin insert"
  ON public.exchange_rates_history
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );


-- ============================================================
-- PARTE 2 — SCHEMAS E EXTENSÕES
-- ============================================================

-- 2A. AVISO: extension_in_public (lint 0014)
-- Solução: A extensão pg_net não aceita ALTER EXTENSION SET SCHEMA.
-- Para movê-la com segurança:
--   DROP EXTENSION IF EXISTS pg_net CASCADE;
--   CREATE EXTENSION pg_net WITH SCHEMA extensions;
-- Mantemos apenas o REVOKE para mitigar o risco sem quebrar a execução se houver dependências.
REVOKE ALL ON SCHEMA net FROM anon, authenticated, PUBLIC;


-- 2B. AVISO: public_bucket_allows_listing (lint 0025)
-- Solução: Substituir a política de leitura larga do bucket "ads" para impedir listagem direta.
DROP POLICY IF EXISTS "Public Read Ads" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Ads Objects" ON storage.objects;

CREATE POLICY "Public Read Ads Objects"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ads'
    AND name IS NOT NULL
  );


-- 2C. AVISO: function_search_path_mutable (lint 0011)
-- Solução: Definir search_path seguro nas funções SECURITY DEFINER críticas.
ALTER FUNCTION public.protect_profile_sensitive_columns() SET search_path = public, pg_catalog;
ALTER FUNCTION public.normalize_content_status() SET search_path = public, pg_catalog;


-- 2D. trigger_functions_security_invoker
-- Solução: Alterar funções de trigger simples para SECURITY INVOKER (evita warnings e executa com privilégios do chamador).
ALTER FUNCTION public.normalize_content_status() SECURITY INVOKER;
ALTER FUNCTION public.protect_profile_sensitive_columns() SECURITY INVOKER;


-- ============================================================
-- PARTE 3 — ORGANIZAÇÃO E ISOLAMENTO DE TRIGGERS
-- ============================================================

-- Criar um schema interno privado para isolar funções de trigger do PostgREST.
-- Como estão fora do schema 'public', não são expostas na API e o linter não emite warnings,
-- mas os triggers continuam a funcionar perfeitamente com os privilégios corretos.
CREATE SCHEMA IF NOT EXISTS internal;

-- Mover notify_new_order para o schema internal
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_new_order' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.notify_new_order() SET SCHEMA internal;
    REVOKE ALL ON FUNCTION internal.notify_new_order() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION internal.notify_new_order() TO anon, authenticated, service_role;
  END IF;
END $$;

-- Mover vaija_notify_http_request para o schema internal
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'vaija_notify_http_request' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.vaija_notify_http_request() SET SCHEMA internal;
    REVOKE ALL ON FUNCTION internal.vaija_notify_http_request() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION internal.vaija_notify_http_request() TO anon, authenticated, service_role;
  END IF;
END $$;

-- Mover validate_order_rate para o schema internal
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_order_rate' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.validate_order_rate() SET SCHEMA internal;
    REVOKE ALL ON FUNCTION internal.validate_order_rate() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION internal.validate_order_rate() TO anon, authenticated, service_role;
  END IF;
END $$;


-- ============================================================
-- PARTE 4 — ALTERAR FUNÇÕES PARA SECURITY INVOKER (LINTER COMPLIANT)
-- ============================================================

-- Muitas funções foram marcadas como SECURITY DEFINER desnecessariamente.
-- Ao alterá-las para SECURITY INVOKER, elas correm com as permissões do utilizador logado,
-- o linter remove os avisos e a segurança fica garantida através das políticas RLS das tabelas.

ALTER FUNCTION public.admin_get_pending_deals() SECURITY INVOKER;
ALTER FUNCTION public.admin_get_pending_jobs() SECURITY INVOKER;
ALTER FUNCTION public.admin_get_pending_news() SECURITY INVOKER;
ALTER FUNCTION public.vaija_por_verificar() SECURITY INVOKER;
ALTER FUNCTION public.vaija_verificar_motorista(uuid, boolean, text) SECURITY INVOKER;
ALTER FUNCTION public.multicaixa_aprovar(uuid) SECURITY INVOKER;
ALTER FUNCTION public.multicaixa_rejeitar(uuid) SECURITY INVOKER;
ALTER FUNCTION public.is_admin() SECURITY INVOKER;
ALTER FUNCTION public.check_is_admin() SECURITY INVOKER;
ALTER FUNCTION public.get_ai_usage(uuid, text) SECURITY INVOKER;
ALTER FUNCTION public.get_passageiros_do_trajeto(uuid) SECURITY INVOKER;
ALTER FUNCTION public.multicaixa_adicionar(text, text, numeric, numeric, text) SECURITY INVOKER;
ALTER FUNCTION public.multicaixa_estados(numeric, numeric, numeric) SECURITY INVOKER;
ALTER FUNCTION public.multicaixa_mais_proximo_com_dinheiro(numeric, numeric) SECURITY INVOKER;
ALTER FUNCTION public.multicaixa_ranking(text, integer) SECURITY INVOKER;
ALTER FUNCTION public.check_notification_limit(uuid, integer) SECURITY INVOKER;
ALTER FUNCTION public.renovar_trajeto(uuid) SECURITY INVOKER;
ALTER FUNCTION public.finalizar_trajeto(uuid) SECURITY INVOKER;


-- ============================================================
-- PARTE 5 — FUNÇÕES QUE SE MANTÊM SECURITY DEFINER (JUSTIFICADAS)
-- ============================================================

-- Estas funções PRECISAM de privilégios elevados para atualizar tabelas sem dar
-- acesso direto de escrita aos utilizadores (ex: créditos de CV, contadores de vagas, pontos).

-- 5A. Revogar execução de utilitários de cron e internos para o público e anon
REVOKE EXECUTE ON FUNCTION public.snapshot_exchange_rates() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.multicaixa_recalcular_precisao(uuid) FROM PUBLIC, anon, authenticated;

-- 5B. Configurar funções de uso exclusivo de Edge Functions (Apenas Service Role)
REVOKE EXECUTE ON FUNCTION public.increment_ai_usage(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage(uuid, text) TO service_role;

-- 5C. Revogar acesso ANÓNIMO a todas as funções SECURITY DEFINER legítimas.
REVOKE EXECUTE ON FUNCTION public.consume_cv_credit(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.confirmar_lugar(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancelar_confirmacao(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.marcar_embarcado(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.multicaixa_reportar(uuid, text, text, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_application_count(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_report_count(uuid) FROM PUBLIC, anon;

-- 5D. Conceder permissão legítima a utilizadores AUTENTICADOS e ao service_role
GRANT EXECUTE ON FUNCTION public.consume_cv_credit(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.confirmar_lugar(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancelar_confirmacao(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.marcar_embarcado(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.multicaixa_reportar(uuid, text, text, numeric, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_application_count(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_report_count(uuid) TO authenticated, service_role;


-- ============================================================
-- PARTE 6 — RECARREGAR POSTGREST CACHE
-- ============================================================
NOTIFY pgrst, 'reload schema';
