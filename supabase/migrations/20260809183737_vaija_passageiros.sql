-- ==========================================
-- VaiJá — RPC: passageiros de um trajeto (visão do motorista)
-- O motorista precisa de identificar os passageiros (nome/telefone) para os
-- apanhar, mas os perfis são privados. Esta função devolve apenas os
-- passageiros confirmados do próprio trajeto, apenas ao motorista dono.
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_passageiros_do_trajeto(p_trajeto uuid)
RETURNS TABLE (
  confirmacao_id uuid,
  passageiro_id uuid,
  status text,
  preco_acordado numeric,
  full_name text,
  phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Autorização: apenas o motorista do trajeto (ainda ativo)
  IF NOT EXISTS (
    SELECT 1 FROM public.trajetos_ativos t
    WHERE t.id = p_trajeto AND t.motorista_id = auth.uid()
  ) THEN
    RETURN; -- sem autorização -> zero linhas
  END IF;

  RETURN QUERY
  SELECT
    c.id AS confirmacao_id,
    c.passageiro_id,
    c.status::text,
    c.preco_acordado,
    p.full_name,
    p.phone
  FROM public.confirmacoes c
  JOIN public.profiles p ON p.id = c.passageiro_id
  WHERE c.trajeto_id = p_trajeto
  ORDER BY c.criado_em ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_passageiros_do_trajeto(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_passageiros_do_trajeto(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_passageiros_do_trajeto(uuid) TO authenticated;
