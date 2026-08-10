-- ==========================================
-- Multicaixa — Lógica de negócio (RPCs)
--
-- - multicaixa_distancia          : haversine (km)
-- - multicaixa_nivel              : nível Bronze/Prata/Ouro por pontos
-- - multicaixa_estados            : estado atual de cada ATM (tempo de leitura)
-- - multicaixa_reportar           : insere reporte + pontos + nível + precisão
-- - multicaixa_recalcular_precisao: concordância do user com a maioria
-- - multicaixa_mais_proximo_com_dinheiro : rota otimizada (CTA)
-- - multicaixa_ranking            : top guardiões do mês
-- - multicaixa_adicionar          : contribuição comunitária (pendente)
-- - multicaixa_aprovar/rejeitar   : moderação admin
--
-- Estado calculado em tempo de leitura (sem cron):
--   peso decrescente por tempo (decay exponencial, meia-vida ~1.5h)
--   × fator de precisão do reporter (0.3–1.3, convergente com a maioria)
--   confirmado só com >=2 reportes concordantes em <30 min
--   sem reporte há >6h → 'desconhecido'
-- ==========================================

-- ──────────────────────────────────────────
-- 1. Distância (haversine)
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.multicaixa_distancia(
  lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT ROUND(
    6371 * 2 * asin(sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
    ))::numeric, 1);
$$;

-- ──────────────────────────────────────────
-- 2. Nível
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.multicaixa_nivel(p_pontos integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_pontos >= 25 THEN 'ouro'
    WHEN p_pontos >= 10 THEN 'prata'
    WHEN p_pontos >= 1  THEN 'bronze'
    ELSE 'novato'
  END;
$$;

-- ──────────────────────────────────────────
-- 3. Estados atuais (leitura)
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.multicaixa_estados(
  p_lat numeric,
  p_lng numeric,
  p_raio_km numeric DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  nome text,
  banco_operador text,
  bairro text,
  latitude numeric,
  longitude numeric,
  distancia_km numeric,
  estado text,
  confirmado boolean,
  ultimo_report_em timestamptz,
  min_ultimo_report integer,
  fiabilidade_30d numeric,
  total_reportes_30d bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id,
    m.nome,
    m.banco_operador,
    m.bairro,
    m.latitude,
    m.longitude,
    CASE WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL
           AND m.latitude IS NOT NULL AND m.longitude IS NOT NULL
      THEN public.multicaixa_distancia(p_lat, p_lng, m.latitude, m.longitude)
      ELSE NULL END AS distancia_km,
    CASE
      WHEN s.ultimo_report_em IS NULL OR s.ultimo_report_em < now() - interval '6 hours' THEN 'desconhecido'
      WHEN s.n_avariado_30m > 0 AND s.n_tem_30m = 0 THEN 'avariado'
      WHEN s.soma_w = 0 THEN 'desconhecido'
      WHEN s.soma_w_tem / s.soma_w >= 0.15 THEN 'tem_dinheiro'
      WHEN s.soma_w_sem / s.soma_w >= 0.15 THEN 'sem_dinheiro'
      ELSE 'desconhecido'
    END AS estado,
    CASE
      WHEN s.ultimo_report_em IS NULL OR s.ultimo_report_em < now() - interval '6 hours' THEN false
      ELSE (
        CASE
          WHEN s.n_avariado_30m > 0 AND s.n_tem_30m = 0 THEN s.n_avariado_30m
          WHEN s.soma_w_tem / s.soma_w >= 0.15 THEN s.n_tem_30m
          WHEN s.soma_w_sem / s.soma_w >= 0.15 THEN s.n_sem_30m
          ELSE 0
        END
      ) >= 2
    END AS confirmado,
    s.ultimo_report_em,
    CASE WHEN s.ultimo_report_em IS NULL THEN NULL
      ELSE GREATEST(0, EXTRACT(EPOCH FROM (now() - s.ultimo_report_em)) / 60)::int END AS min_ultimo_report,
    CASE WHEN h.total_30d >= 3
      THEN ROUND((h.tem_30d::numeric / h.total_30d) * 100)
      ELSE NULL END AS fiabilidade_30d,
    h.total_30d
  FROM public.multicaixas m
  LEFT JOIN LATERAL (
    SELECT
      COALESCE(SUM(CASE WHEN r.status_dinheiro = 'tem_dinheiro' THEN r.w ELSE 0 END), 0) AS soma_w_tem,
      COALESCE(SUM(CASE WHEN r.status_dinheiro = 'sem_dinheiro' THEN r.w ELSE 0 END), 0) AS soma_w_sem,
      COALESCE(SUM(CASE WHEN r.status_dinheiro IN ('tem_dinheiro', 'sem_dinheiro') THEN r.w ELSE 0 END), 0) AS soma_w,
      COUNT(*) FILTER (WHERE r.status_dinheiro = 'avariado'
        AND r.timestamp > now() - interval '30 minutes') AS n_avariado_30m,
      COUNT(*) FILTER (WHERE r.status_dinheiro = 'tem_dinheiro'
        AND r.timestamp > now() - interval '30 minutes') AS n_tem_30m,
      COUNT(*) FILTER (WHERE r.status_dinheiro = 'sem_dinheiro'
        AND r.timestamp > now() - interval '30 minutes') AS n_sem_30m,
      MAX(r.timestamp) AS ultimo_report_em
    FROM (
      SELECT
        rr.*,
        EXP(-EXTRACT(EPOCH FROM (now() - rr.timestamp)) / 3600.0 / 1.5)
          * COALESCE(GREATEST(0.3, LEAST(1.3, 0.5 + COALESCE(p.precisao_reportes, 50) / 100.0)), 1.0) AS w
      FROM public.reportes_multicaixa rr
      LEFT JOIN public.profiles p ON p.id = rr.user_id
      WHERE rr.multicaixa_id = m.id
        AND rr.timestamp > now() - interval '6 hours'
    ) r
  ) s ON true
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) AS total_30d,
      COUNT(*) FILTER (WHERE status_dinheiro = 'tem_dinheiro') AS tem_30d
    FROM public.reportes_multicaixa
    WHERE multicaixa_id = m.id
      AND timestamp > now() - interval '30 days'
  ) h ON true
  WHERE m.status_aprovacao = 'aprovado'
    AND (p_raio_km IS NULL OR (
      p_lat IS NOT NULL AND p_lng IS NOT NULL
      AND m.latitude IS NOT NULL AND m.longitude IS NOT NULL
      AND public.multicaixa_distancia(p_lat, p_lng, m.latitude, m.longitude) <= p_raio_km
    ))
  ORDER BY distancia_km NULLS LAST;
$$;

-- ──────────────────────────────────────────
-- 4. Precisão do reporter (concordância com a maioria no mesmo ATM ±1h)
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.multicaixa_recalcular_precisao(p_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_acertos integer := 0;
  v_total integer := 0;
  v_precisao numeric;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE x.modal = r.status_dinheiro)::int,
    COUNT(*)::int
  INTO v_acertos, v_total
  FROM public.reportes_multicaixa r
  JOIN LATERAL (
    SELECT m.status_dinheiro AS modal
    FROM public.reportes_multicaixa m
    WHERE m.multicaixa_id = r.multicaixa_id
      AND m.user_id <> r.user_id
      AND m.timestamp BETWEEN r.timestamp - interval '1 hour' AND r.timestamp + interval '1 hour'
    GROUP BY m.status_dinheiro
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ) x ON true
  WHERE r.user_id = p_user;

  v_precisao := CASE WHEN v_total = 0 THEN NULL
    ELSE ROUND((v_acertos::numeric / v_total) * 100, 1) END;

  UPDATE public.profiles SET precisao_reportes = v_precisao WHERE id = p_user;
END;
$$;

-- ──────────────────────────────────────────
-- 5. Reporte (pontos + nível + precisão + anti-abuso)
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.multicaixa_reportar(
  p_multicaixa uuid,
  p_status_dinheiro text,
  p_tipo_notas text DEFAULT 'nao_informado',
  p_valor_maximo numeric DEFAULT NULL,
  p_status_fila text DEFAULT 'nao_informado'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_ultimo timestamptz;
  v_pontos integer;
  v_nivel text;
  v_badges text[];
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Não autenticado');
  END IF;

  IF p_status_dinheiro NOT IN ('tem_dinheiro', 'sem_dinheiro', 'avariado') THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Estado de dinheiro inválido');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.multicaixas WHERE id = p_multicaixa AND status_aprovacao = 'aprovado'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Multicaixa não encontrado');
  END IF;

  -- Anti-abuso: 1 reporte por ATM por 10 minutos por utilizador
  SELECT MAX(timestamp) INTO v_ultimo
  FROM public.reportes_multicaixa
  WHERE multicaixa_id = p_multicaixa AND user_id = v_user;
  IF v_ultimo IS NOT NULL AND v_ultimo > now() - interval '10 minutes' THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Já reportaste este multicaixa nos últimos 10 minutos');
  END IF;

  INSERT INTO public.reportes_multicaixa
    (multicaixa_id, user_id, status_dinheiro, tipo_notas, valor_maximo_levantado, status_fila)
  VALUES
    (p_multicaixa, v_user, p_status_dinheiro, p_tipo_notas, p_valor_maximo, p_status_fila);

  UPDATE public.profiles
  SET pontos_guardiao = pontos_guardiao + 1
  WHERE id = v_user
  RETURNING pontos_guardiao INTO v_pontos;

  v_nivel := public.multicaixa_nivel(v_pontos);

  SELECT COALESCE(badges_multicaixa, '{}'::text[]) INTO v_badges
  FROM public.profiles WHERE id = v_user;
  IF NOT v_badges @> ARRAY[v_nivel] THEN
    UPDATE public.profiles SET badges_multicaixa = badges_multicaixa || ARRAY[v_nivel]
    WHERE id = v_user;
  END IF;

  PERFORM public.multicaixa_recalcular_precisao(v_user);

  RETURN jsonb_build_object('ok', true, 'pontos', v_pontos, 'nivel', v_nivel);
END;
$$;

-- ──────────────────────────────────────────
-- 6. Mais próximo com dinheiro (CTA "Leva-me")
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.multicaixa_mais_proximo_com_dinheiro(
  p_lat numeric,
  p_lng numeric
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_est record;
BEGIN
  SELECT * INTO v_est
  FROM public.multicaixa_estados(p_lat, p_lng, NULL) e
  WHERE e.estado = 'tem_dinheiro' AND e.confirmado = true
  ORDER BY e.distancia_km NULLS LAST
  LIMIT 1;

  IF v_est IS NULL THEN
    SELECT * INTO v_est
    FROM public.multicaixa_estados(p_lat, p_lng, NULL) e
    WHERE e.estado = 'tem_dinheiro'
    ORDER BY e.distancia_km NULLS LAST
    LIMIT 1;
  END IF;

  IF v_est IS NULL THEN
    RETURN jsonb_build_object('encontrado', false);
  END IF;

  RETURN jsonb_build_object(
    'encontrado', true,
    'id', v_est.id,
    'nome', v_est.nome,
    'banco_operador', v_est.banco_operador,
    'bairro', v_est.bairro,
    'latitude', v_est.latitude,
    'longitude', v_est.longitude,
    'distancia_km', v_est.distancia_km,
    'confirmado', v_est.confirmado,
    'min_ultimo_report', v_est.min_ultimo_report
  );
END;
$$;

-- ──────────────────────────────────────────
-- 7. Ranking (top guardiões do mês, por bairro ou geral)
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.multicaixa_ranking(
  p_bairro text DEFAULT NULL,
  p_limite integer DEFAULT 20
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  bairro text,
  reportes_mes bigint,
  pontos_guardiao integer,
  nivel text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS user_id,
    p.full_name,
    p.avatar_url,
    mm.bairro,
    COUNT(*) AS reportes_mes,
    p.pontos_guardiao,
    public.multicaixa_nivel(p.pontos_guardiao) AS nivel
  FROM public.reportes_multicaixa r
  JOIN public.multicaixas mm ON mm.id = r.multicaixa_id
  JOIN public.profiles p ON p.id = r.user_id
  WHERE r.timestamp >= date_trunc('month', now())
    AND (p_bairro IS NULL OR mm.bairro = p_bairro)
  GROUP BY p.id, p.full_name, p.avatar_url, mm.bairro, p.pontos_guardiao
  ORDER BY reportes_mes DESC
  LIMIT GREATEST(1, LEAST(p_limite, 100));
$$;

-- ──────────────────────────────────────────
-- 8. Contribuição comunitária (novo ATM, fica pendente)
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.multicaixa_adicionar(
  p_nome text,
  p_banco text,
  p_latitude numeric,
  p_longitude numeric,
  p_bairro text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_aviso text := NULL;
  v_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Não autenticado');
  END IF;

  IF NULLIF(BTRIM(p_nome), '') IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Nome é obrigatório');
  END IF;

  IF p_latitude IS NULL OR p_longitude IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Localização é obrigatória');
  END IF;

  -- Aviso de duplicado (ATM aprovado a menos de ~200m)
  IF EXISTS (
    SELECT 1 FROM public.multicaixas
    WHERE status_aprovacao = 'aprovado'
      AND latitude IS NOT NULL AND longitude IS NOT NULL
      AND public.multicaixa_distancia(p_latitude, p_longitude, latitude, longitude) <= 0.2
  ) THEN
    v_aviso := 'Já existe um multicaixa aprovado muito próximo. O teu fica pendente de revisão.';
  END IF;

  INSERT INTO public.multicaixas (nome, banco_operador, latitude, longitude, bairro, status_aprovacao, contribuidor_id)
  VALUES (p_nome, p_banco, p_latitude, p_longitude, p_bairro, 'pendente_aprovacao', v_user)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'id', v_id, 'aviso', v_aviso);
END;
$$;

-- ──────────────────────────────────────────
-- 9. Moderação (admin)
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.multicaixa_aprovar(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Sem permissão de administrador');
  END IF;

  UPDATE public.multicaixas SET status_aprovacao = 'aprovado' WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Multicaixa não encontrado');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.multicaixa_rejeitar(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Sem permissão de administrador');
  END IF;

  UPDATE public.multicaixas SET status_aprovacao = 'rejeitado' WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Multicaixa não encontrado');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ──────────────────────────────────────────
-- 10. Grants
-- ──────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.multicaixa_distancia(numeric, numeric, numeric, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.multicaixa_nivel(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.multicaixa_estados(numeric, numeric, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.multicaixa_mais_proximo_com_dinheiro(numeric, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.multicaixa_ranking(text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.multicaixa_reportar(uuid, text, text, numeric, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.multicaixa_adicionar(text, text, numeric, numeric, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.multicaixa_aprovar(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.multicaixa_rejeitar(uuid) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.multicaixa_distancia(numeric, numeric, numeric, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.multicaixa_nivel(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.multicaixa_estados(numeric, numeric, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.multicaixa_mais_proximo_com_dinheiro(numeric, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.multicaixa_ranking(text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.multicaixa_reportar(uuid, text, text, numeric, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.multicaixa_adicionar(text, text, numeric, numeric, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.multicaixa_aprovar(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.multicaixa_rejeitar(uuid) FROM anon;

GRANT EXECUTE ON FUNCTION public.multicaixa_distancia(numeric, numeric, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.multicaixa_nivel(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.multicaixa_estados(numeric, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.multicaixa_mais_proximo_com_dinheiro(numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.multicaixa_ranking(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.multicaixa_reportar(uuid, text, text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.multicaixa_adicionar(text, text, numeric, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.multicaixa_aprovar(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.multicaixa_rejeitar(uuid) TO authenticated;
