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
-- 2. FIX: STORAGE BUCKET POLICIES (Aggressive Cleanup)
-- ---------------------------------------------------------------
-- Remove QUALQUER política de SELECT nos buckets críticos e recria
-- as políticas de forma a não permitir a listagem (LIST) de ficheiros.

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Limpeza para o bucket 'avatars'
    FOR policy_record IN 
        SELECT name FROM storage.policies 
        WHERE bucket_id = 'avatars' AND operation = 'SELECT'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.name);
    END LOOP;

    -- Limpeza para o bucket 'exchange-proofs'
    FOR policy_record IN 
        SELECT name FROM storage.policies 
        WHERE bucket_id = 'exchange-proofs' AND operation = 'SELECT'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.name);
    END LOOP;
END $$;

-- Recriar Políticas Profissionais (Ver ficheiro sim, Listar pasta não)
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

SELECT name, bucket_id, operation 
FROM storage.policies 
WHERE bucket_id IN ('avatars', 'exchange-proofs');
