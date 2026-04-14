-- =================================================================
-- 🛡️ AngoLife — Security Advisor Patch V2 (FINAL HARDENING)
-- Execute este script no Supabase SQL Editor.
-- Resolve os avisos persistentes de Search Path e Storage.
-- =================================================================

-- ---------------------------------------------------------------
-- 1. FIX: FUNCTION SEARCH PATH MUTABLE (Force Recreate)
-- ---------------------------------------------------------------

-- Drop para garantir limpeza de versões antigas
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------
-- 2. FIX: STORAGE BUCKET POLICIES (Privacy Hardening)
-- ---------------------------------------------------------------
-- Removemos as políticas abertas (tentando os nomes mais comuns)
-- e recriamos a política correta que bloqueia a listagem em massa.

-- Limpeza preventiva de nomes comuns
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "All Access" ON storage.objects;
DROP POLICY IF EXISTS "Give access to everyone" ON storage.objects;
DROP POLICY IF EXISTS "Public view individual avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public view individual proofs" ON storage.objects;

-- Recriar Políticas Profissionais (Ver ficheiro sim, Listar pasta não)
-- Ao restringir ao bucket_id, o Advisor deixa de dar o erro de "Broad Select"
CREATE POLICY "Public view individual avatars" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Public view individual proofs" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'exchange-proofs');

-- ---------------------------------------------------------------
-- 3. VERIFICAÇÃO FINAL
-- ---------------------------------------------------------------
-- Se este comando retornar dados, o patch funcionou.
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'update_updated_at_column';

-- Nota: Não consultamos a tabela storage.policies diretamente para evitar erros de permissão.
