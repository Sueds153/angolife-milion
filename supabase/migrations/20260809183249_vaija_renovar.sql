-- ==========================================
-- VaiJá — RPC: renovar janela de trajeto (modo corredor)
-- Qualquer atividade do motorista renova a janela via trigger
-- (trg_vaija_trajeto_refresh). Este RPC permite renovar de forma explícita
-- ("continuo a trabalhar nesta rota") sem alterar dados.
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.renovar_trajeto(p_trajeto uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_atualizado timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Não autenticado');
  END IF;

  -- Atualização "toca" a linha e dispara o BEFORE UPDATE que renova
  -- atualizado_em / expira_em (20 min trajeto, 2 h corredor).
  UPDATE public.trajetos_ativos
  SET atualizado_em = timezone('utc'::text, now())
  WHERE id = p_trajeto
    AND motorista_id = auth.uid()
    AND status IN ('ativo', 'lotado')
  RETURNING atualizado_em INTO v_atualizado;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Trajeto não encontrado ou sem autorização');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.renovar_trajeto(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.renovar_trajeto(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.renovar_trajeto(uuid) TO authenticated;
