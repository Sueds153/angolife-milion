-- ==========================================
-- VaiJá — Extensões ao perfil de utilizador
-- ==========================================

-- Campos novos em profiles (todos com default, não quebram handle_new_user):
--   tipo_utilizador       -> 'passageiro' | 'motorista' | 'ambos'
--   destinos_frequentes   -> lista de locais para notificações automáticas
--   avaliacao_media       -> apenas escrita por trigger (fase avaliações)
--   passageiro_no_show_count -> contador de "não apareceu" do passageiro
--   contacto_emergencia   -> para o SOS (fase 4)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tipo_utilizador text NOT NULL DEFAULT 'passageiro',
  ADD COLUMN IF NOT EXISTS destinos_frequentes text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avaliacao_media numeric,
  ADD COLUMN IF NOT EXISTS passageiro_no_show_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contacto_emergencia text;

-- Restrições canónicas (padrão do projeto: text + CHECK)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_profiles_tipo_utilizador;
ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_tipo_utilizador
  CHECK (tipo_utilizador IN ('passageiro', 'motorista', 'ambos'));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_profiles_avaliacao;
ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_avaliacao
  CHECK (avaliacao_media IS NULL OR (avaliacao_media >= 1 AND avaliacao_media <= 5));

-- RLS: conceder UPDATE apenas nos campos editáveis pelo próprio utilizador
-- (mesma filosofia da migration 20260805000000_strict_rls_profiles.sql).
-- avaliacao_media e passageiro_no_show_count são geridos por triggers/RPC e
-- ficam fora do alcance do cliente.
GRANT UPDATE (tipo_utilizador, destinos_frequentes, contacto_emergencia)
  ON public.profiles TO authenticated;
