-- ==========================================
-- Fix: registo de novos utilizadores guardava full_name = NULL
--
-- A função public.handle_new_user (trigger on_auth_user_created) só inseria
-- (id, email, is_admin) no profiles, ignorando o raw_user_meta_data que o
-- cliente envia em options.data ({ full_name, invited_by }).
-- ==========================================

-- 1. Função que cria o profile no registo, agora a preencher full_name e
--    invited_by a partir do metadata do utilizador auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, invited_by, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', '')), ''),
    NULLIF(BTRIM(COALESCE(NEW.raw_user_meta_data ->> 'invited_by', '')), ''),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Backfill: nomes/convites já presentes no metadata de utilizadores que se
--    registaram antes da correção (inclui o utilizador de teste).
UPDATE public.profiles p
SET full_name = COALESCE(
        NULLIF(BTRIM(a.raw_user_meta_data ->> 'full_name'), ''),
        NULLIF(BTRIM(a.raw_user_meta_data ->> 'name'), ''),
        p.full_name
      ),
    invited_by = COALESCE(
        NULLIF(BTRIM(a.raw_user_meta_data ->> 'invited_by'), ''),
        p.invited_by
      ),
    updated_at = now()
FROM auth.users a
WHERE a.id = p.id
  AND (
    (p.full_name IS NULL OR BTRIM(p.full_name) = '')
    OR (p.invited_by IS NULL AND NULLIF(BTRIM(a.raw_user_meta_data ->> 'invited_by'), '') IS NOT NULL)
  );
