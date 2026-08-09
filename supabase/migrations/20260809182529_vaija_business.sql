-- ==========================================
-- VaiJá — Lógica de negócio: triggers + RPC + cron
-- ==========================================

-- ──────────────────────────────────────────
-- 1. BEFORE INSERT/UPDATE em trajetos_ativos
--    - renova atualizado_em / expira_em (trajeto: 20 min; corredor: 2 h)
--    - status 'lotado' quando lugares_disponiveis = 0
--    - status de volta a 'ativo' se abrir lugar (cancelamento)
--    - bloqueia motoristas suspensos (INSERT)
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.vaija_trajeto_refresh()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (
      SELECT 1 FROM public.dados_motorista
      WHERE user_id = NEW.motorista_id AND status_conta = 'suspenso'
    ) THEN
      RAISE EXCEPTION 'Conta de motorista suspensa. Não é possível publicar trajetos.';
    END IF;

    NEW.criado_em := timezone('utc'::text, now());
    NEW.atualizado_em := timezone('utc'::text, now());
    NEW.lugares_disponiveis := NEW.lugares_totais;
    IF NEW.modo = 'corredor' THEN
      NEW.expira_em := timezone('utc'::text, now()) + interval '2 hours';
    ELSE
      NEW.expira_em := timezone('utc'::text, now()) + interval '20 minutes';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: renovar janela (qualquer atividade do motorista renova)
  NEW.atualizado_em := timezone('utc'::text, now());
  IF NEW.modo = 'corredor' THEN
    NEW.expira_em := timezone('utc'::text, now()) + interval '2 hours';
  ELSE
    NEW.expira_em := timezone('utc'::text, now()) + interval '20 minutes';
  END IF;

  IF NEW.status = 'ativo' AND NEW.lugares_disponiveis = 0 THEN
    NEW.status := 'lotado';
  ELSIF NEW.status = 'lotado' AND NEW.lugares_disponiveis > 0 THEN
    NEW.status := 'ativo';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vaija_trajeto_refresh ON public.trajetos_ativos;
CREATE TRIGGER trg_vaija_trajeto_refresh
  BEFORE INSERT OR UPDATE ON public.trajetos_ativos
  FOR EACH ROW EXECUTE FUNCTION public.vaija_trajeto_refresh();

-- ──────────────────────────────────────────
-- 2. AFTER UPDATE em trajetos_ativos -> 'finalizado' | 'expirado'
--    - passageiros que ficaram 'confirmado' passam a 'nao_apareceu' (+contador)
--    - copia para historico_trajetos
--    - se 'expirado' sem NENHUMA confirmação: +1 trajeto fantasma; aos 3 -> suspenso
--    - remove da tabela ativa
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.vaija_finalizar_trajeto()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('finalizado', 'expirado')
     AND OLD.status NOT IN ('finalizado', 'expirado') THEN

    -- 1. Quem confirmou mas nunca embarcou -> nao_apareceu
    UPDATE public.confirmacoes
    SET status = 'nao_apareceu'
    WHERE trajeto_id = NEW.id AND status = 'confirmado';

    -- 2. Contador de no-show do passageiro
    UPDATE public.profiles p
    SET passageiro_no_show_count = passageiro_no_show_count + 1
    WHERE p.id IN (
      SELECT passageiro_id FROM public.confirmacoes
      WHERE trajeto_id = NEW.id AND status = 'nao_apareceu'
    );

    -- 3. Cópia para o histórico
    INSERT INTO public.historico_trajetos (
      id, motorista_id, modo, corredor_id, ponto_partida, partida_lat, partida_lng,
      ponto_destino, destino_lat, destino_lng, lugares_totais, lugares_disponiveis,
      preco, modo_lotacao_rapida, status, incidente_reportado,
      criado_em, atualizado_em, expira_em, finalizado_em
    ) VALUES (
      NEW.id, NEW.motorista_id, NEW.modo, NEW.corredor_id, NEW.ponto_partida, NEW.partida_lat, NEW.partida_lng,
      NEW.ponto_destino, NEW.destino_lat, NEW.destino_lng, NEW.lugares_totais, NEW.lugares_disponiveis,
      NEW.preco, NEW.modo_lotacao_rapida, NEW.status, NEW.incidente_reportado,
      NEW.criado_em, NEW.atualizado_em, NEW.expira_em, timezone('utc'::text, now())
    );

    -- 4. Trajeto fantasma: expirou sem qualquer confirmação
    IF NEW.status = 'expirado' AND NOT EXISTS (
      SELECT 1 FROM public.confirmacoes WHERE trajeto_id = NEW.id
    ) THEN
      UPDATE public.dados_motorista
      SET trajetos_fantasma_count = trajetos_fantasma_count + 1
      WHERE user_id = NEW.motorista_id;

      UPDATE public.dados_motorista
      SET status_conta = 'suspenso'
      WHERE user_id = NEW.motorista_id
        AND trajetos_fantasma_count >= 3
        AND status_conta <> 'suspenso';
    END IF;

    -- 5. Remover da tabela ativa (as confirmações caem em cascata depois
    --    de já terem sido processadas nos passos 1-2)
    DELETE FROM public.trajetos_ativos WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vaija_finalizar_trajeto ON public.trajetos_ativos;
CREATE TRIGGER trg_vaija_finalizar_trajeto
  AFTER UPDATE OF status ON public.trajetos_ativos
  FOR EACH ROW EXECUTE FUNCTION public.vaija_finalizar_trajeto();

-- ──────────────────────────────────────────
-- 3. RPC: confirmar_lugar
--    Transação atómica com lock de linha para evitar lotação em corrida.
--    Guarda preco_acordado (preço travado no momento da confirmação).
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.confirmar_lugar(p_trajeto uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trajeto record;
  v_passageiro uuid := auth.uid();
BEGIN
  IF v_passageiro IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Não autenticado');
  END IF;

  SELECT * INTO v_trajeto
  FROM public.trajetos_ativos
  WHERE id = p_trajeto
  FOR UPDATE;

  IF v_trajeto IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Trajeto não encontrado');
  END IF;

  IF v_trajeto.status <> 'ativo' THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Trajeto não está ativo');
  END IF;

  IF v_trajeto.lugares_disponiveis <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Trajeto lotado');
  END IF;

  IF v_trajeto.motorista_id = v_passageiro THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Não podes confirmar o teu próprio trajeto');
  END IF;

  BEGIN
    INSERT INTO public.confirmacoes (trajeto_id, passageiro_id, preco_acordado, status)
    VALUES (p_trajeto, v_passageiro, v_trajeto.preco, 'confirmado');
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Já confirmaste este trajeto');
  END;

  UPDATE public.trajetos_ativos
  SET lugares_disponiveis = lugares_disponiveis - 1
  WHERE id = p_trajeto;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.confirmar_lugar(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.confirmar_lugar(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.confirmar_lugar(uuid) TO authenticated;

-- ──────────────────────────────────────────
-- 4. RPC: cancelar_confirmacao (liberto enquanto o trajeto está ativo)
--    Restaura o lugar; o status volta a 'ativo' automaticamente (trigger 1).
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cancelar_confirmacao(p_trajeto uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_passageiro uuid := auth.uid();
BEGIN
  IF v_passageiro IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Não autenticado');
  END IF;

  UPDATE public.confirmacoes
  SET status = 'cancelado'
  WHERE trajeto_id = p_trajeto
    AND passageiro_id = v_passageiro
    AND status = 'confirmado';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Confirmação não encontrada ou já cancelada');
  END IF;

  UPDATE public.trajetos_ativos
  SET lugares_disponiveis = lugares_disponiveis + 1
  WHERE id = p_trajeto;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancelar_confirmacao(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cancelar_confirmacao(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.cancelar_confirmacao(uuid) TO authenticated;

-- ──────────────────────────────────────────
-- 5. RPC: marcar_embarcado (apenas o motorista do trajeto)
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.marcar_embarcado(p_confirmacao uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_motorista uuid := auth.uid();
BEGIN
  IF v_motorista IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Não autenticado');
  END IF;

  UPDATE public.confirmacoes c
  SET status = 'embarcado'
  WHERE c.id = p_confirmacao
    AND c.status = 'confirmado'
    AND EXISTS (
      SELECT 1 FROM public.trajetos_ativos t
      WHERE t.id = c.trajeto_id AND t.motorista_id = v_motorista
    );

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Não autorizado ou confirmação inexistente');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.marcar_embarcado(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.marcar_embarcado(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.marcar_embarcado(uuid) TO authenticated;

-- ──────────────────────────────────────────
-- 6. RPC: finalizar_trajeto (apenas o motorista do trajeto)
--    Dispara a migração para histórico + no-shows (trigger 2).
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.finalizar_trajeto(p_trajeto uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Não autenticado');
  END IF;

  UPDATE public.trajetos_ativos
  SET status = 'finalizado'
  WHERE id = p_trajeto
    AND motorista_id = auth.uid()
    AND status IN ('ativo', 'lotado');

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Trajeto não encontrado ou sem autorização');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.finalizar_trajeto(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.finalizar_trajeto(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.finalizar_trajeto(uuid) TO authenticated;

-- ──────────────────────────────────────────
-- 7. Cron: expirar trajetos sem atividade (a cada minuto)
--    Atualiza status -> 'expirado'; o trigger 2 move para o histórico.
-- ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
DECLARE
  j RECORD;
BEGIN
  FOR j IN SELECT jobid FROM cron.job WHERE jobname = 'vaija-expira-trajetos' LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
END $$;

SELECT cron.schedule(
  'vaija-expira-trajetos',
  '* * * * *',
  $$ UPDATE public.trajetos_ativos
     SET status = 'expirado'
     WHERE status IN ('ativo', 'lotado')
       AND expira_em < now() $$
);
