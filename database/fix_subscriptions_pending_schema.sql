-- ============================================================
-- FIX: subscriptions_pending — Alinha colunas com o código
-- Executar no Supabase SQL Editor (Dashboard > SQL Editor)
-- Data: 2026-08-17
-- ============================================================

-- 1. Garantir que a tabela existe com o schema correcto
CREATE TABLE IF NOT EXISTS public.subscriptions_pending (
    id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    type        text NOT NULL DEFAULT 'monthly',   -- 'pack3', 'monthly', 'yearly'
    status      text DEFAULT 'pending',             -- 'pending', 'approved', 'rejected'
    receipt_url text,                               -- URL ou base64 do comprovativo
    created_at  timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at  timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Adicionar colunas em falta caso a tabela já exista com schema antigo
DO $$
BEGIN
    -- Adicionar 'type' se só existir 'plano_escolhido'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'subscriptions_pending'
          AND column_name  = 'plano_escolhido'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'subscriptions_pending'
          AND column_name  = 'type'
    ) THEN
        ALTER TABLE public.subscriptions_pending
            ADD COLUMN type text NOT NULL DEFAULT 'monthly';
        -- Migrar dados existentes
        UPDATE public.subscriptions_pending SET type = plano_escolhido WHERE type IS NULL OR type = 'monthly';
    END IF;

    -- Adicionar 'receipt_url' se só existir 'url_comprovativo'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'subscriptions_pending'
          AND column_name  = 'url_comprovativo'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'subscriptions_pending'
          AND column_name  = 'receipt_url'
    ) THEN
        ALTER TABLE public.subscriptions_pending
            ADD COLUMN receipt_url text;
        -- Migrar dados existentes
        UPDATE public.subscriptions_pending SET receipt_url = url_comprovativo;
    END IF;

    -- Normalizar status: 'aguardando' → 'pending'
    UPDATE public.subscriptions_pending
       SET status = 'pending'
     WHERE status = 'aguardando';
END $$;

-- 3. Habilitar RLS (idempotente)
ALTER TABLE public.subscriptions_pending ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
DROP POLICY IF EXISTS "Users view own subscription requests" ON public.subscriptions_pending;
CREATE POLICY "Users view own subscription requests"
    ON public.subscriptions_pending FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own requests" ON public.subscriptions_pending;
CREATE POLICY "Users insert own requests"
    ON public.subscriptions_pending FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage all requests" ON public.subscriptions_pending;
CREATE POLICY "Admins manage all requests"
    ON public.subscriptions_pending FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- 5. Verificar resultado
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'subscriptions_pending'
ORDER BY ordinal_position;
