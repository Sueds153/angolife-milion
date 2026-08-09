-- ==========================================
-- VaiJá — Notificações push para destinos frequentes
--
-- 1. RPC vaija_obter_subscricoes_alvo: devolve (user_id, subscription) dos
--    utilizadores cujos destinos_frequentes correspondem (ILIKE) à rota de um
--    trajeto recém-publicado. Filtra o próprio motorista.
-- 2. Trigger AFTER INSERT em trajetos_ativos -> chama a Edge Function
--    notify-vaija-trajeto (envio Web Push). Falhas são silenciosas: nunca
--    bloqueiam a publicação.
--
-- NOTA DE SEGURANÇA: a service role key NÃO fica neste ficheiro. A função
-- do trigger lê o segredo "vaija_service_role_key" do Supabase Vault em
-- runtime (ver 20260810090001_vaija_push_vault.sql).
-- ==========================================

-- ──────────────────────────────────────────
-- 1. RPC de matching (usada pela Edge Function com service role)
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.vaija_obter_subscricoes_alvo(
  p_destino text,
  p_partida text,
  p_motorista_id uuid
)
RETURNS TABLE (user_id uuid, subscription jsonb)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT ps.user_id, ps.subscription
  FROM public.push_subscriptions ps
  JOIN public.profiles p ON p.id = ps.user_id
  WHERE ps.subscription IS NOT NULL
    AND p.id <> p_motorista_id
    AND p.destinos_frequentes IS NOT NULL
    AND cardinality(p.destinos_frequentes) > 0
    AND EXISTS (
      SELECT 1
      FROM unnest(p.destinos_frequentes) AS d(local)
      WHERE position(lower(d.local) IN lower(p_destino)) > 0
         OR position(lower(d.local) IN lower(p_partida)) > 0
         OR position(lower(p_destino) IN lower(d.local)) > 0
         OR position(lower(p_partida) IN lower(d.local)) > 0
    );
$$;

REVOKE EXECUTE ON FUNCTION public.vaija_obter_subscricoes_alvo(text, text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.vaija_obter_subscricoes_alvo(text, text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.vaija_obter_subscricoes_alvo(text, text, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.vaija_obter_subscricoes_alvo(text, text, uuid) TO service_role;

-- ──────────────────────────────────────────
-- 2. Trigger AFTER INSERT -> Edge Function notify-vaija-trajeto
--    A função vaija_notify_http_request() lê a chave do Vault e é
--    redefinida em 20260810090001_vaija_push_vault.sql.
-- ──────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_vaija_notify_trajeto ON public.trajetos_ativos;
CREATE TRIGGER trg_vaija_notify_trajeto
  AFTER INSERT ON public.trajetos_ativos
  FOR EACH ROW EXECUTE FUNCTION public.vaija_notify_http_request();
