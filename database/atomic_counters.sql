-- ==========================================
-- AngoLife: Funções para Contadores Atómicos
-- Estes scripts garantem que os incrementos sejam seguros (sem race conditions)
-- ==========================================

-- 1. Incrementar contagem de candidaturas
CREATE OR REPLACE FUNCTION increment_application_count(job_id UUID)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.jobs
  SET application_count = COALESCE(application_count, 0) + 1
  WHERE id = job_id;
END;
$$;

-- 2. Incrementar contagem de denúncias e tratar auto-pendente
-- Se uma vaga atingir 3 denúncias, ela volta para 'pending' para revisão
CREATE OR REPLACE FUNCTION increment_report_count(job_id UUID)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.jobs
  SET report_count = COALESCE(report_count, 0) + 1
  WHERE id = job_id
  RETURNING report_count INTO new_count;

  IF new_count >= 3 THEN
    UPDATE public.jobs
    SET status = 'pending'
    WHERE id = job_id;
  END IF;
END;
$$;
