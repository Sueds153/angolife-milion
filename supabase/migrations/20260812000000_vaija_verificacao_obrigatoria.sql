-- ==========================================
-- VaiJá — Verificação documental obrigatória
-- O motorista só pode publicar trajetos se:
--   1. Estiver autenticado (RLS: INSERT exige motorista_id = auth.uid())
--   2. Tiver registo em dados_motorista
--   3. Tiver documentos submetidos E dados_motorista.verificado = true
-- A verificação é feita pelo admin (AdminVaiJaSection). Até lá, o INSERT
-- do trigger abaixo rejeita com mensagem clara.
-- ==========================================

CREATE OR REPLACE FUNCTION public.vaija_trajeto_refresh()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_registo public.dados_motorista%ROWTYPE;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 0. Só autenticados publicam (defesa em profundidade; o RLS já exige
    --    motorista_id = auth.uid(), mas o trigger valida de novo).
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Tens de estar autenticado para publicar trajetos.';
    END IF;

    -- 1. Não se pode publicar em nome de outro motorista
    IF NEW.motorista_id <> auth.uid() THEN
      RAISE EXCEPTION 'Não podes publicar em nome de outro motorista.';
    END IF;

    -- 2. Tem de existir registo de motorista ativo
    SELECT * INTO v_registo
    FROM public.dados_motorista
    WHERE user_id = NEW.motorista_id
    FOR UPDATE;

    IF v_registo IS NULL THEN
      RAISE EXCEPTION 'Ativa o modo motorista no teu perfil e preenche a matrícula e o tipo de veículo.';
    END IF;

    IF v_registo.status_conta = 'suspenso' THEN
      RAISE EXCEPTION 'Conta de motorista suspensa. Não é possível publicar trajetos.';
    END IF;

    IF v_registo.foto_documento_url IS NULL OR v_registo.foto_documento_url = '' THEN
      RAISE EXCEPTION 'Submete o teu BI ou carta de condução no perfil antes de publicar.';
    END IF;

    IF v_registo.verificado IS NOT TRUE THEN
      RAISE EXCEPTION 'A tua identificação ainda está por verificar. A equipa Resolve.AO aprova normalmente em menos de 24h.';
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

-- ──────────────────────────────────────────────
-- Segurança: impedir auto-verificação
-- O motorista só pode editar matricula, tipo_veiculo e foto_documento_url.
-- verificado / status_conta / trajetos_fantasma_count passam a ser geridos
-- APENAS pelo admin (RPCs SECURITY DEFINER abaixo).
-- ──────────────────────────────────────────────
REVOKE UPDATE ON public.dados_motorista FROM authenticated;
GRANT UPDATE (matricula, tipo_veiculo, foto_documento_url) ON public.dados_motorista TO authenticated;
REVOKE INSERT ON public.dados_motorista FROM authenticated;
GRANT INSERT (user_id, matricula, tipo_veiculo, foto_documento_url) ON public.dados_motorista TO authenticated;

-- Trigger de proteção (mesmo padrão do protect_profile_sensitive_columns):
-- na criação, forçar verificado=false e status 'ativo'. Em UPDATE, a proteção
-- é feita pelas column-grants acima (authenticated não pode mexer em
-- verificado/status_conta/trajetos_fantasma_count), por isso o trigger não
-- mexe nesses campos em UPDATE para não interferir com a lógica interna
-- (suspensão automática / contador de trajetos fantasma, que corre como postgres).
CREATE OR REPLACE FUNCTION public.vaija_dados_motorista_protect()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    NEW.verificado := false;
    NEW.status_conta := 'ativo';
    NEW.trajetos_fantasma_count := 0;
  END IF;

  NEW.atualizado_em := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vaija_dados_motorista_protect ON public.dados_motorista;
CREATE TRIGGER trg_vaija_dados_motorista_protect
  BEFORE INSERT OR UPDATE ON public.dados_motorista
  FOR EACH ROW EXECUTE FUNCTION public.vaija_dados_motorista_protect();

-- Lista pendentes (admin): também devolve nome/telefone do perfil via
-- SECURITY DEFINER para não expor profiles ao cliente.
CREATE OR REPLACE FUNCTION public.vaija_por_verificar()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resultado jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RETURN '{"ok": false, "erro": "Sem permissão de administrador"}'::jsonb;
  END IF;

  SELECT jsonb_agg(jsonb_build_object(
    'userId', dm.user_id,
    'nome', p.full_name,
    'phone', p.phone,
    'matricula', dm.matricula,
    'tipoVeiculo', dm.tipo_veiculo,
    'fotoDocumentoUrl', dm.foto_documento_url,
    'criadoEm', dm.criado_em
  ) ORDER BY dm.criado_em ASC)
  INTO v_resultado
  FROM public.dados_motorista dm
  JOIN public.profiles p ON p.id = dm.user_id
  WHERE dm.foto_documento_url IS NOT NULL
    AND dm.foto_documento_url <> ''
    AND dm.verificado IS NOT TRUE;

  RETURN jsonb_build_object(
    'ok', true,
    'data', COALESCE(v_resultado, '[]'::jsonb)
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.vaija_por_verificar() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.vaija_por_verificar() FROM anon;
GRANT EXECUTE ON FUNCTION public.vaija_por_verificar() TO authenticated;

-- Aprovar/rejeitar verificação (admin)
CREATE OR REPLACE FUNCTION public.vaija_verificar_motorista(p_user uuid, p_aprovado boolean, p_motivo text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RETURN '{"ok": false, "erro": "Sem permissão de administrador"}'::jsonb;
  END IF;

  IF p_aprovado THEN
    UPDATE public.dados_motorista
    SET verificado = true,
        atualizado_em = timezone('utc'::text, now())
    WHERE user_id = p_user;
  ELSE
    UPDATE public.dados_motorista
    SET verificado = false,
        foto_documento_url = NULL,
        atualizado_em = timezone('utc'::text, now())
    WHERE user_id = p_user;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Motorista não encontrado');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.vaija_verificar_motorista(uuid, boolean, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.vaija_verificar_motorista(uuid, boolean, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.vaija_verificar_motorista(uuid, boolean, text) TO authenticated;

-- ──────────────────────────────────────────────
-- Storage: admin precisa de ver o documento para aprovar.
-- Grants sempre AFTER criação da policy para a Data API ver o objeto.
-- ──────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'vaija_admin_ler_documentos'
  ) THEN
    CREATE POLICY "vaija_admin_ler_documentos" ON storage.objects
      FOR SELECT TO authenticated USING (
        bucket_id = 'documentos-motorista'
        AND EXISTS (
          SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
        )
      );
  END IF;
END $$;