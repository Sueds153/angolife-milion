-- =================================================================
-- 🔐 Resolve.AO — Monetization Fix: CV credits / AI usage server-side
-- Data: 2026-08-08
-- Objectivo: substituir o gate client-side (localStorage + estado local)
-- por enforcement no servidor, para que créditos sejam de facto gastos
-- e a quota da IA seja limitada por utilizador.
-- =================================================================

-- 1) Tabela de controlo de uso de IA (mensal p/ otimizações grátis,
--    diário p/ fetchs de conteúdo). Substitui o localStorage.
CREATE TABLE IF NOT EXISTS public.ai_usage (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_month TEXT NOT NULL,
  count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, usage_month)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Sem políticas: o cliente não acede diretamente; apenas via funções
-- SECURITY DEFINER ou via service_role (Edge Functions).
REVOKE ALL ON public.ai_usage FROM anon;
REVOKE ALL ON public.ai_usage FROM authenticated;

-- 2) Gasta 1 crédito de CV de forma atómica (decremento server-side).
--    Usado no download do PDF e como mecanismo anti-bypass.
--    Lança 'sem_creditos' (45000) se o saldo for 0.
CREATE OR REPLACE FUNCTION public.consume_cv_credit(p_user_id UUID DEFAULT auth.uid())
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining INT;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING errcode = '42501';
  END IF;

  UPDATE public.profiles
     SET cv_credits = cv_credits - 1,
         updated_at = now()
   WHERE id = p_user_id
     AND cv_credits > 0
   RETURNING cv_credits INTO v_remaining;

  IF v_remaining IS NULL THEN
    RAISE EXCEPTION 'sem_creditos' USING errcode = '45000';
  END IF;

  RETURN v_remaining;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_cv_credit(UUID) TO authenticated, service_role;

-- 3) Lê o uso de IA para uma chave (YYYY-MM mensal ou YYYY-MM-DD diário)
CREATE OR REPLACE FUNCTION public.get_ai_usage(p_user_id UUID, p_month TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 0;
  END IF;
  SELECT count INTO v_count
    FROM public.ai_usage
   WHERE user_id = p_user_id
     AND usage_month = p_month;
  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ai_usage(UUID, TEXT) TO authenticated, service_role;

-- 4) Incrementa o uso de IA (retorna o novo contador)
CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id UUID, p_month TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 0;
  END IF;
  INSERT INTO public.ai_usage (user_id, usage_month, count)
  VALUES (p_user_id, p_month, 1)
  ON CONFLICT (user_id, usage_month)
  DO UPDATE SET count = public.ai_usage.count + 1
  RETURNING count INTO v_count;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_ai_usage(UUID, TEXT) TO authenticated, service_role;
