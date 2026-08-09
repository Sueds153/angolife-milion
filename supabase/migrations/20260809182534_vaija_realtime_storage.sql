-- ==========================================
-- VaiJá — Realtime + Storage (bucket privado de documentos)
-- ==========================================

-- ──────────────────────────────────────────
-- 1. Realtime: expor trajetos_ativos e confirmacoes
--    Os broadcasts respeitam o RLS de cada subscritor (contadores ao vivo,
--    ecrã de espera e listas sem refresh manual).
-- ──────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'trajetos_ativos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trajetos_ativos;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'confirmacoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.confirmacoes;
  END IF;
END $$;

-- ──────────────────────────────────────────
-- 2. Bucket privado para BI / carta de condução
--    Acesso: apenas o dono (pasta {user_id}/) e admin (via Edge Function com
--    service role, fase de verificação). Nunca exposto publicamente.
-- ──────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-motorista', 'documentos-motorista', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "vaija_upload_documentos" ON storage.objects;
CREATE POLICY "vaija_upload_documentos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'documentos-motorista'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "vaija_ler_documentos" ON storage.objects;
CREATE POLICY "vaija_ler_documentos" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'documentos-motorista'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "vaija_atualizar_documentos" ON storage.objects;
CREATE POLICY "vaija_atualizar_documentos" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'documentos-motorista'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
