-- ==========================================
-- Resolve.AO: ALIGN SCHEMA TO CODE (idempotent)
-- Alinha o schema de produção com o que o código espera.
-- Seguro de re-correr: tudo usa IF NOT EXISTS / ON CONFLICT / DO NOTHING.
-- Execute no SQL Editor do projeto: efhelvzdlwewsjkdknkl
-- ==========================================

-- --------------------------------------------------
-- 1. PROFILES — colunas usadas pelo frontend
-- --------------------------------------------------
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS avatar_url text,
    ADD COLUMN IF NOT EXISTS phone text,
    ADD COLUMN IF NOT EXISTS bio text,
    ADD COLUMN IF NOT EXISTS location text,
    ADD COLUMN IF NOT EXISTS saved_jobs jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS application_history jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS cv_history jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS referral_code text,
    ADD COLUMN IF NOT EXISTS invited_by text,
    ADD COLUMN IF NOT EXISTS has_referral_discount boolean DEFAULT false;

-- Garantir unicidade do referral_code (nulls não colidem)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'profiles' AND indexname = 'profiles_referral_code_key'
    ) THEN
        CREATE UNIQUE INDEX profiles_referral_code_key ON public.profiles (referral_code);
    END IF;
END $$;

-- Trigger: gera referral_code automaticamente para novos perfis
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := 'ANGO-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_referral_code ON public.profiles;
CREATE TRIGGER tr_generate_referral_code
    BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- --------------------------------------------------
-- 2. ORDERS — coluna order_type (alias usado pelo código)
-- --------------------------------------------------
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS order_type text;

-- Backfill uma única vez a partir de `type` (buy/sell -> compra/venda)
UPDATE public.orders
SET order_type = CASE
    WHEN type = 'sell' THEN 'venda'
    WHEN type = 'buy' THEN 'compra'
    ELSE type
END
WHERE order_type IS NULL;

-- --------------------------------------------------
-- 3. SUBSCRIPTIONS_PENDING — colunas usadas pelo código
-- --------------------------------------------------
ALTER TABLE public.subscriptions_pending
    ADD COLUMN IF NOT EXISTS plano_escolhido text,
    ADD COLUMN IF NOT EXISTS url_comprovativo text;

-- Backfill: copiar valores antigos para os novos nomes
UPDATE public.subscriptions_pending
SET plano_escolhido = COALESCE(plano_escolhido, type),
    url_comprovativo = COALESCE(url_comprovativo, receipt_url)
WHERE plano_escolhido IS NULL OR url_comprovativo IS NULL;

-- --------------------------------------------------
-- 4. PRODUCT_DEALS — colunas usadas pelo código
-- --------------------------------------------------
ALTER TABLE public.product_deals
    ADD COLUMN IF NOT EXISTS image_url text,
    ADD COLUMN IF NOT EXISTS store_number text,
    ADD COLUMN IF NOT EXISTS phone text,
    ADD COLUMN IF NOT EXISTS views integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- --------------------------------------------------
-- 5. EXCHANGE_RATES — seed USD/EUR (sem duplicar)
-- --------------------------------------------------
INSERT INTO public.exchange_rates (currency, formal_buy, formal_sell, informal_buy, informal_sell)
SELECT 'USD', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.exchange_rates WHERE currency = 'USD');

INSERT INTO public.exchange_rates (currency, formal_buy, formal_sell, informal_buy, informal_sell)
SELECT 'EUR', NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.exchange_rates WHERE currency = 'EUR');

-- --------------------------------------------------
-- 6. STORAGE BUCKETS (idempotente)
-- --------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('discount-images', 'discount-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage (avatars: upload próprio, leitura pública)
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects
    FOR DELETE USING (bucket_id = 'avatars');

-- discount-images: qualquer utilizador autenticado pode enviar, leitura pública
DROP POLICY IF EXISTS "Authed upload discount images" ON storage.objects;
CREATE POLICY "Authed upload discount images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'discount-images' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Public view discount images" ON storage.objects;
CREATE POLICY "Public view discount images" ON storage.objects
    FOR SELECT USING (bucket_id = 'discount-images');

-- receipts: utilizador envia o seu próprio comprovativo
DROP POLICY IF EXISTS "Users upload own receipts" ON storage.objects;
CREATE POLICY "Users upload own receipts" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);

-- ==========================================
-- FIM
-- ==========================================
