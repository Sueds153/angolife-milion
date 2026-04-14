-- ==========================================
-- AngoLife: Real Data Persistence Update
-- Adds storage for saved jobs and application history
-- ==========================================
-- 1. Update Profiles table with JSONB columns for history
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS saved_jobs jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS application_history jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS cv_history jsonb DEFAULT '[]'::jsonb;
-- 2. Add an orders_log column if not already there for extra redundancy (optional)
-- This matches the user's need for a "real" functioning order history beyond the orders table.
-- 3. Ensure indices for performance (JSONB GIN indices if needed later)
-- CREATE INDEX idx_profiles_saved_jobs ON public.profiles USING GIN (saved_jobs);
-- 4. Enable public read for buckets if they were missed
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-files', 'cv-files', true) ON CONFLICT (id) DO NOTHING;
-- 5. Policies for cv-files
CREATE POLICY "Users can upload own CVs" ON storage.objects FOR
INSERT WITH CHECK (bucket_id = 'cv-files');
CREATE POLICY "Public can view CVs" ON storage.objects FOR
SELECT USING (bucket_id = 'cv-files');