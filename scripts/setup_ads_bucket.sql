-- ==========================================================
-- RESOLVE.AO — CRIAR BUCKET 'ads' NO SUPABASE STORAGE
-- Correr no Supabase Dashboard → SQL Editor
-- ==========================================================

-- 1. Criar o bucket 'ads' se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Permitir acesso de LEITURA pública para todos os ficheiros no bucket 'ads'
DROP POLICY IF EXISTS "Public Read Ads" ON storage.objects;
CREATE POLICY "Public Read Ads" ON storage.objects
FOR SELECT USING (bucket_id = 'ads');

-- 3. Permitir UPLOAD público / autenticado para o bucket 'ads'
DROP POLICY IF EXISTS "Public Upload Ads" ON storage.objects;
CREATE POLICY "Public Upload Ads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'ads');

-- 4. Permitir UPDATE no bucket 'ads'
DROP POLICY IF EXISTS "Public Update Ads" ON storage.objects;
CREATE POLICY "Public Update Ads" ON storage.objects
FOR UPDATE USING (bucket_id = 'ads');

-- 5. Permitir DELETE no bucket 'ads'
DROP POLICY IF EXISTS "Public Delete Ads" ON storage.objects;
CREATE POLICY "Public Delete Ads" ON storage.objects
FOR DELETE USING (bucket_id = 'ads');
