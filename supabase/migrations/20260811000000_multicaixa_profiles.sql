-- ==========================================
-- Multicaixa — Campos de gamificação em profiles
--
-- Geridos apenas server-side (RPC/trigger), nunca pelo cliente:
-- ficam fora dos column-grants UPDATE do cliente (filosofia do projeto).
-- Todos os campos têm DEFAULT para não quebrar handle_new_user.
-- ==========================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pontos_guardiao    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS precisao_reportes  numeric,
  ADD COLUMN IF NOT EXISTS badges_multicaixa  text[] NOT NULL DEFAULT '{}';
