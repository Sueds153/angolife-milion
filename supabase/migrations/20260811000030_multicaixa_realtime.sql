-- ==========================================
-- Multicaixa — Realtime
--
-- Publica reportes_multicaixa e multicaixas na publicação supabase_realtime
-- para que o mapa/lista atualize ao vivo. Os broadcasts respeitam o RLS de
-- cada subscritor (só autenticados veem reportes).
-- ==========================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'reportes_multicaixa'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reportes_multicaixa;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'multicaixas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.multicaixas;
  END IF;
END $$;
