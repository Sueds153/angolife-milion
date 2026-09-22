-- ============================================================
-- Resolve.AO — Security Advisor ERROR Fix
-- Executar no Supabase SQL Editor (Dashboard > SQL Editor)
-- Data: 2026-08-17
-- Resolve os 2 erros ERROR nível crítico do Security Advisor
-- ============================================================


-- ============================================================
-- ERRO 1 — security_definer_view (lint 0010)
-- Vista: public.motorista_publico
--
-- Problema: A vista foi criada com SECURITY DEFINER (default no Postgres),
-- o que significa que executa com as permissões do CRIADOR, ignorando o
-- RLS e as permissões do utilizador que faz a query.
--
-- Fix: Recriar a vista com SECURITY INVOKER = true, o que faz com que
-- execute com as permissões do utilizador autenticado (respeitando RLS).
-- A vista já só expõe colunas públicas (sem dados sensíveis), portanto
-- funciona correctamente com SECURITY INVOKER.
-- ============================================================

-- Remover a vista antiga (SECURITY DEFINER por omissão)
DROP VIEW IF EXISTS public.motorista_publico;

-- Recriar com SECURITY INVOKER (seguro — respeita RLS do utilizador)
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

-- Restaurar o GRANT (necessário após DROP + recreate)
GRANT SELECT ON public.motorista_publico TO authenticated;

-- ============================================================
-- ERRO 2 — rls_disabled_in_public (lint 0013)
-- Tabela: public.exchange_rates_history
--
-- Problema: Tabela exposta via PostgREST (schema public) sem RLS
-- activado. Qualquer utilizador (incluindo anon) pode ler/escrever
-- sem restrição.
--
-- Fix: Activar RLS + criar política de leitura pública (dados de
-- histórico de câmbio são públicos por natureza, sem dados pessoais).
-- Apenas o service_role ou admin deve poder inserir/modificar.
-- ============================================================

-- Activar RLS na tabela
ALTER TABLE IF EXISTS public.exchange_rates_history ENABLE ROW LEVEL SECURITY;

-- Política: leitura pública (histórico de câmbio é informação pública)
DROP POLICY IF EXISTS "Exchange history public read" ON public.exchange_rates_history;
CREATE POLICY "Exchange history public read"
  ON public.exchange_rates_history
  FOR SELECT
  USING (true);

-- Política: escrita restrita a admins (o snapshot é feito server-side)
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

-- Bloquear update/delete para todos (histórico é imutável)
DROP POLICY IF EXISTS "Exchange history no update" ON public.exchange_rates_history;
-- Sem política de UPDATE/DELETE = bloqueado por default com RLS activo.


-- ============================================================
-- Verificação
-- ============================================================

-- Confirmar que a vista usa SECURITY INVOKER
SELECT
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public' AND viewname = 'motorista_publico';

-- Confirmar que RLS está activo na tabela
SELECT
  relname AS table_name,
  relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'exchange_rates_history';

-- Confirmar políticas activas
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'exchange_rates_history';
