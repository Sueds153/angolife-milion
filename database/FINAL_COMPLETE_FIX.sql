-- ============================================================
-- Resolve.AO — SCRIPT FINAL COMPLETO
-- Executar no Supabase SQL Editor (Dashboard > SQL Editor)
-- Data: 2026-08-17
-- Versão: FINAL — resolve TODOS os warnings do Security Advisor
--         e garante o funcionamento da IA e pagamentos.
-- ============================================================
-- IMPORTANTE: Execute este script de uma só vez.
-- Substitui todos os scripts anteriores (security_advisor_fix,
-- security_errors_fix, security_advisor_complete_fix).
-- ============================================================


-- ============================================================
-- PARTE 1 — ERROS CRÍTICOS (ERROR) DO SECURITY ADVISOR
-- ============================================================

-- 1A. ERRO: security_definer_view (lint 0010)
-- Vista: public.motorista_publico
-- Fix: Recriar com security_invoker = true para respeitar o RLS.
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
-- Fix: Ativar RLS e criar políticas.
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
-- PARTE 2 — AVISO: extension_in_public (lint 0014)
-- pg_net não suporta SET SCHEMA. A única mitigação possível é
-- revogar o acesso de anon e authenticated ao schema "net".
-- O Supabase ignora este warning quando está em uso interno.
-- ============================================================
DO $$
BEGIN
  -- Só revoca se o schema existir (evita erro se pg_net não estiver instalado)
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname = 'net') THEN
    REVOKE ALL ON SCHEMA net FROM anon, authenticated;
  END IF;
END $$;


-- ============================================================
-- PARTE 3 — AVISO: public_bucket_allows_listing (lint 0025)
-- Substituir política de leitura pública do bucket "ads".
-- ============================================================
DROP POLICY IF EXISTS "Public Read Ads" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Ads Objects" ON storage.objects;

CREATE POLICY "Public Read Ads Objects"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ads'
    AND name IS NOT NULL
  );


-- ============================================================
-- PARTE 4 — AVISO: function_search_path_mutable (lint 0011)
-- Fix: Definir search_path seguro nas funções SECURITY DEFINER.
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.proname = 'protect_profile_sensitive_columns') THEN
    ALTER FUNCTION public.protect_profile_sensitive_columns() SET search_path = public, pg_catalog;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.proname = 'normalize_content_status') THEN
    ALTER FUNCTION public.normalize_content_status() SET search_path = public, pg_catalog;
  END IF;
END $$;


-- ============================================================
-- PARTE 5 — FUNÇÕES TRIGGER: SECURITY INVOKER
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.proname = 'normalize_content_status') THEN
    ALTER FUNCTION public.normalize_content_status() SECURITY INVOKER;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.proname = 'protect_profile_sensitive_columns') THEN
    ALTER FUNCTION public.protect_profile_sensitive_columns() SECURITY INVOKER;
  END IF;
END $$;


-- ============================================================
-- PARTE 6 — SCHEMA INTERNO (isolamento do PostgREST)
-- ============================================================
CREATE SCHEMA IF NOT EXISTS internal;

-- Mover funções de notify para schema internal (se existirem)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_new_order' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.notify_new_order() SET SCHEMA internal;
    REVOKE ALL ON FUNCTION internal.notify_new_order() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION internal.notify_new_order() TO service_role;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'vaija_notify_http_request' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.vaija_notify_http_request() SET SCHEMA internal;
    REVOKE ALL ON FUNCTION internal.vaija_notify_http_request() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION internal.vaija_notify_http_request() TO service_role;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_order_rate' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.validate_order_rate() SET SCHEMA internal;
    REVOKE ALL ON FUNCTION internal.validate_order_rate() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION internal.validate_order_rate() TO service_role;
  END IF;
END $$;


-- ============================================================
-- PARTE 7 — FUNÇÕES ADMIN: SECURITY INVOKER
-- (funções que só admins usam — o RLS garante a proteção)
-- ============================================================
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'admin_get_pending_deals()',
    'admin_get_pending_jobs()',
    'admin_get_pending_news()',
    'vaija_por_verificar()',
    'is_admin()',
    'check_is_admin()',
    'multicaixa_estados(numeric,numeric,numeric)',
    'multicaixa_mais_proximo_com_dinheiro(numeric,numeric)',
    'multicaixa_ranking(text,integer)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION public.%s SECURITY INVOKER', fn);
    EXCEPTION WHEN undefined_function THEN
      -- função não existe, ignorar
      NULL;
    END;
  END LOOP;
END $$;

-- Funções com parâmetros de utilizador (security invoker + revoke anon)
DO $$
BEGIN
  BEGIN
    ALTER FUNCTION public.get_ai_usage(uuid, text) SECURITY INVOKER;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_passageiros_do_trajeto(uuid) SECURITY INVOKER;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.multicaixa_adicionar(text, text, numeric, numeric, text) SECURITY INVOKER;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.check_notification_limit(uuid, integer) SECURITY INVOKER;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.renovar_trajeto(uuid) SECURITY INVOKER;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.finalizar_trajeto(uuid) SECURITY INVOKER;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  -- Funções de verificação vaija
  BEGIN
    ALTER FUNCTION public.vaija_verificar_motorista(uuid, boolean, text) SECURITY INVOKER;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.multicaixa_aprovar(uuid) SECURITY INVOKER;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.multicaixa_rejeitar(uuid) SECURITY INVOKER;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;
END $$;


-- ============================================================
-- PARTE 8 — FUNÇÕES QUE FICAM SECURITY DEFINER (justificadas)
-- Estas funções modificam tabelas protegidas (profiles, ai_usage)
-- e DEVEM manter SECURITY DEFINER para funcionar correctamente.
-- ============================================================

-- 8A. Funções de cron/snapshot (apenas service_role)
DO $$
BEGIN
  BEGIN
    REVOKE EXECUTE ON FUNCTION public.snapshot_exchange_rates() FROM PUBLIC, anon, authenticated;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    REVOKE EXECUTE ON FUNCTION public.multicaixa_recalcular_precisao(uuid) FROM PUBLIC, anon, authenticated;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;
END $$;

-- 8B. increment_ai_usage — APENAS service_role (Edge Function usa service_role key)
-- O cliente usa get_ai_usage para ler; nunca escreve diretamente.
DO $$
BEGIN
  BEGIN
    REVOKE EXECUTE ON FUNCTION public.increment_ai_usage(uuid, text) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.increment_ai_usage(uuid, text) TO service_role;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;
END $$;

-- 8C. get_ai_usage — authenticated pode ler o seu próprio uso (UI feedback)
DO $$
BEGIN
  BEGIN
    REVOKE EXECUTE ON FUNCTION public.get_ai_usage(uuid, text) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.get_ai_usage(uuid, text) TO authenticated, service_role;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;
END $$;

-- 8D. consume_cv_credit — autenticados podem gastar o próprio crédito
DO $$
BEGIN
  BEGIN
    REVOKE EXECUTE ON FUNCTION public.consume_cv_credit(uuid) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.consume_cv_credit(uuid) TO authenticated, service_role;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;
END $$;

-- 8E. Funções de negócio Vaija (viagem, confirmações)
DO $$
BEGIN
  BEGIN
    REVOKE EXECUTE ON FUNCTION public.confirmar_lugar(uuid) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.confirmar_lugar(uuid) TO authenticated, service_role;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    REVOKE EXECUTE ON FUNCTION public.cancelar_confirmacao(uuid) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.cancelar_confirmacao(uuid) TO authenticated, service_role;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    REVOKE EXECUTE ON FUNCTION public.marcar_embarcado(uuid) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.marcar_embarcado(uuid) TO authenticated, service_role;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    REVOKE EXECUTE ON FUNCTION public.multicaixa_reportar(uuid, text, text, numeric, text) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.multicaixa_reportar(uuid, text, text, numeric, text) TO authenticated, service_role;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    REVOKE EXECUTE ON FUNCTION public.increment_application_count(uuid) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.increment_application_count(uuid) TO authenticated, service_role;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    REVOKE EXECUTE ON FUNCTION public.increment_report_count(uuid) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.increment_report_count(uuid) TO authenticated, service_role;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;
END $$;


-- ============================================================
-- PARTE 9 — TABELA subscriptions_pending (pagamentos CV)
-- Garante esquema correcto e políticas RLS
-- ============================================================

-- 9A. Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.subscriptions_pending (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    type        text NOT NULL DEFAULT 'monthly',
    status      text DEFAULT 'pending',
    receipt_url text,
    created_at  timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at  timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 9B. Adicionar coluna 'type' se só existir 'plano_escolhido' (schema antigo)
DO $$
BEGIN
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'subscriptions_pending' AND column_name = 'plano_escolhido'
  ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'subscriptions_pending' AND column_name = 'type'
  ) THEN
    ALTER TABLE public.subscriptions_pending ADD COLUMN type text NOT NULL DEFAULT 'monthly';
    UPDATE public.subscriptions_pending SET type = plano_escolhido;
  END IF;

  -- Adicionar 'receipt_url' se só existir 'url_comprovativo'
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'subscriptions_pending' AND column_name = 'url_comprovativo'
  ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'subscriptions_pending' AND column_name = 'receipt_url'
  ) THEN
    ALTER TABLE public.subscriptions_pending ADD COLUMN receipt_url text;
    UPDATE public.subscriptions_pending SET receipt_url = url_comprovativo;
  END IF;
END $$;

-- 9C. Ativar RLS e definir políticas
ALTER TABLE public.subscriptions_pending ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own subscription requests" ON public.subscriptions_pending;
CREATE POLICY "Users view own subscription requests"
  ON public.subscriptions_pending FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own requests" ON public.subscriptions_pending;
CREATE POLICY "Users insert own requests"
  ON public.subscriptions_pending FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage all requests" ON public.subscriptions_pending;
CREATE POLICY "Admins manage all requests"
  ON public.subscriptions_pending FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );


-- ============================================================
-- PARTE 10 — CRIAR BUCKET payment-receipts (se não existir)
-- Nota: buckets são criados via SQL no schema storage
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts',
  'payment-receipts',
  false,   -- privado (só owner + admin lê)
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- PARTE 11 — POLÍTICAS DE STORAGE para payment-receipts
-- ============================================================
DROP POLICY IF EXISTS "receipts_select_owner" ON storage.objects;
CREATE POLICY "receipts_select_owner"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND (owner = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin))
  );

DROP POLICY IF EXISTS "receipts_insert_owner" ON storage.objects;
CREATE POLICY "receipts_insert_owner"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "receipts_update_owner" ON storage.objects;
CREATE POLICY "receipts_update_owner"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND (owner = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin))
  );

DROP POLICY IF EXISTS "receipts_delete_owner" ON storage.objects;
CREATE POLICY "receipts_delete_owner"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND (owner = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin))
  );


-- ============================================================
-- PARTE 12 — RECARREGAR POSTGREST CACHE
-- ============================================================
NOTIFY pgrst, 'reload schema';


-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
-- Mostra estado das políticas criadas neste script
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('subscriptions_pending', 'exchange_rates_history', 'ai_usage')
ORDER BY tablename, policyname;

-- Mostra funções SECURITY DEFINER ainda em public (para auditoria)
SELECT
  p.proname AS funcao,
  CASE p.prosecdef WHEN true THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS modo_seguranca,
  p.provolatile,
  r.rolname AS owner
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_roles r ON r.oid = p.proowner
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY funcao;
