-- ==========================================
-- VaiJá — Service role key movida para o Supabase Vault
--
-- A migration 20260810090000 tinha a service role key embutida na definição
-- do trigger. Esta migration redefine vaija_notify_http_request() para ler a
-- chave do Vault (segredo "vaija_service_role_key") em runtime, evitando
-- segredos no código. O segredo é criado no Vault pela migration seguinte
-- (20260810090002_vaija_seed_vault.sql), que é temporária e não fica no repo.
-- ==========================================

CREATE OR REPLACE FUNCTION public.vaija_notify_http_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key text;
  v_headers jsonb;
  v_url text := 'https://efhelvzdlwewsjkdknkl.functions.supabase.co/notify-vaija-trajeto';
BEGIN
  BEGIN
    SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
    WHERE name = 'vaija_service_role_key'
    LIMIT 1;

    IF v_key IS NULL THEN
      RAISE EXCEPTION 'Segredo vaija_service_role_key nao encontrado no Vault';
    END IF;

    v_headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', concat('Bearer ', v_key)
    );

    PERFORM supabase_functions.http_request(
      v_url,
      'POST',
      v_headers::text,
      jsonb_build_object(
        'type', 'INSERT',
        'table', 'trajetos_ativos',
        'record', to_jsonb(NEW)
      )::text,
      '5000'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Nunca bloquear a publicação de um trajeto por causa de push
    RAISE LOG 'vaija push ignorado: %', SQLERRM;
    NULL;
  END;
  RETURN NEW;
END;
$$;
