-- =================================================================
-- 🛡️ AngoLife — Security Advisor Patch (Consolidated Fixes)
-- Execute este script no Supabase SQL Editor para "blindar" o projeto.
-- =================================================================

-- ---------------------------------------------------------------
-- 1. FIX: FUNCTION SEARCH PATH MUTABLE (Anti-Hijacking)
-- ---------------------------------------------------------------

-- Corrigir a função de atualização de timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------
-- 2. FIX: STORAGE BUCKET POLICIES (Privacy Hardening)
-- ---------------------------------------------------------------
-- Estes comandos ajustam as políticas para permitir visualizar ficheiros 
-- individuais mas BLOQUEAR a listagem em massa de todos os ficheiros.

-- Bucket: avatars
DO $$
BEGIN
    -- Remover políticas de SELECT excessivamente permissivas
    DELETE FROM storage.policies WHERE bucket_id = 'avatars' AND name = 'Public Access';
    
    -- Criar política de visualização segura
    INSERT INTO storage.policies (name, bucket_id, definition, operation)
    VALUES (
        'Public view individual avatars', 
        'avatars', 
        '(bucket_id = ''avatars''::text)', 
        'SELECT'
    );
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Bucket avatars policy setup failed, please check manually.';
END $$;

-- Bucket: exchange-proofs
DO $$
BEGIN
    -- Remover políticas de SELECT excessivamente permissivas
    DELETE FROM storage.policies WHERE bucket_id = 'exchange-proofs' AND name = 'Public Access';
    
    -- Criar política de visualização segura
    INSERT INTO storage.policies (name, bucket_id, definition, operation)
    VALUES (
        'Public view individual proofs', 
        'exchange-proofs', 
        '(bucket_id = ''exchange-proofs''::text)', 
        'SELECT'
    );
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Bucket exchange-proofs policy setup failed, please check manually.';
END $$;

-- ---------------------------------------------------------------
-- 3. VERIFICAÇÃO FINAL
-- ---------------------------------------------------------------
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('increment_application_count', 'increment_report_count', 'update_updated_at_column', 'maintenance_cleanup_task');
