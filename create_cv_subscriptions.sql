-- Create cv_subscriptions table
CREATE TABLE IF NOT EXISTS cv_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plano_id TEXT NOT NULL,
    url_comprovativo TEXT NOT NULL,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'ativo', 'rejeitado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE cv_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for cv_subscriptions
CREATE POLICY "Users can view their own subscriptions"
    ON cv_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
    ON cv_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
    ON cv_subscriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Create storage bucket for payment receipts if it doesn't exist
-- Note: This usually needs to be done via Supabase Dashboard or API, 
-- but we include it here as reference for what's needed.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for payment-receipts bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'payment-receipts' );

CREATE POLICY "Users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'payment-receipts' AND auth.role() = 'authenticated' );
