CREATE TABLE IF NOT EXISTS subscriptions_pending (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plano_escolhido TEXT NOT NULL,
    url_comprovativo TEXT NOT NULL,
    status TEXT DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'premium', 'rejeitado')),
    data TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE subscriptions_pending ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pending subscriptions"
    ON subscriptions_pending FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pending subscriptions"
    ON subscriptions_pending FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all pending subscriptions"
    ON subscriptions_pending FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );
