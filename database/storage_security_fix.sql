-- ============================================================
-- STORAGE SECURITY FIX — Resolve.AO
-- Fecha furos de escrita/leitura nos buckets de storage.
-- O `owner` da coluna storage.objects é preenchido automaticamente
-- com auth.uid() em uploads autenticados (Supabase).
-- ============================================================

-- ── 1) DROP de políticas perigosas (por padrão, evita encoding) ──
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (
        -- exchange-proofs: escrita pública (anon pode apagar tudo)
        policyname LIKE '%Allow public%'
        -- avatars: escrita pública sem verificação de owner
        OR policyname LIKE '%own avatar%'
        -- ads: upload público
        OR policyname = 'Public Upload Ads'
        -- discount/news/job-logos: ALL para authenticated sem owner check
        OR policyname LIKE '%Gest%Imagens%'
        -- payment-receipts: leitura folder-based (deixa ver todos os receipts/)
        OR policyname LIKE '%view own receipts%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- ── 2) exchange-proofs: escrita restrita a authenticated (owner) / admin ──
CREATE POLICY "exchange_proofs_insert_owner"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'exchange-proofs');

CREATE POLICY "exchange_proofs_update_owner"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'exchange-proofs'
    AND (owner = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin))
  );

CREATE POLICY "exchange_proofs_delete_owner"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'exchange-proofs'
    AND (owner = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin))
  );

-- ── 3) avatars: escrita restrita a authenticated (owner) / admin ──
CREATE POLICY "avatars_insert_owner"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars_update_owner"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (owner = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin))
  );

CREATE POLICY "avatars_delete_owner"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (owner = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin))
  );

-- ── 4) ads: upload só authenticated, gestão só admin ──
CREATE POLICY "ads_insert_authenticated"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ads');

CREATE POLICY "ads_update_admin"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'ads'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin)
  );

CREATE POLICY "ads_delete_admin"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'ads'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin)
  );

-- ── 5) discount-images / news-images / job-logos: escrita owner / admin ──
CREATE POLICY "content_images_insert_owner"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('discount-images', 'news-images', 'job-logos'));

CREATE POLICY "content_images_update_owner"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('discount-images', 'news-images', 'job-logos')
    AND (owner = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin))
  );

CREATE POLICY "content_images_delete_owner"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('discount-images', 'news-images', 'job-logos')
    AND (owner = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin))
  );

-- ── 6) payment-receipts: leitura owner / admin (remove vazamento folder-based) ──
CREATE POLICY "receipts_select_owner"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND (owner = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin))
  );

CREATE POLICY "receipts_insert_owner"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-receipts');

CREATE POLICY "receipts_update_owner"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND (owner = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin))
  );

CREATE POLICY "receipts_delete_owner"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'payment-receipts'
    AND (owner = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin))
  );
