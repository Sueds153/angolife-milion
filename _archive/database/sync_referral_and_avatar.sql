-- ==========================================
-- AngoLife Synchronization: Referral System & Profile Photos
-- Execute this in the Supabase SQL Editor
-- ==========================================
-- 1. Update Profiles table with missing columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
    ADD COLUMN IF NOT EXISTS has_referral_discount boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS avatar_url text,
    ADD COLUMN IF NOT EXISTS invited_by text;
-- 2. Ensure Storage Buckets exist
-- Note: 'avatars' must be public for links to work
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
-- 3. Storage Security Policies (RLS)
-- Allow users to upload their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR
INSERT WITH CHECK (bucket_id = 'avatars');
-- Allow public to view avatars
CREATE POLICY "Public can view avatars" ON storage.objects FOR
SELECT USING (bucket_id = 'avatars');
-- Allow users to update/delete their own avatar
CREATE POLICY "Users can update own avatar" ON storage.objects FOR
UPDATE USING (bucket_id = 'avatars');
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');
-- 4. Initial Referral Code Generator Trigger (Optional but helpful)
-- This ensures new users get a code even if the app doesn't send one
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS TRIGGER AS $$ BEGIN IF NEW.referral_code IS NULL THEN NEW.referral_code := 'ANGO-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS tr_generate_referral_code ON public.profiles;
CREATE TRIGGER tr_generate_referral_code BEFORE
INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION generate_referral_code();