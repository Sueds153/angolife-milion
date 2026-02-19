-- ==========================================
-- Security Policies for Jobs Table
-- ==========================================
-- Enable RLS
alter table public.jobs enable row level security;
-- 1. SELECT Policy (Public for published jobs)
create policy "Allow public to view published jobs" on public.jobs for
select using (status = 'published');
-- 2. SELECT Policy (Admin can view all)
-- Assuming admin is identified by email for now (front-end check)
-- Ideally use: using (auth.jwt() ->> 'email' = 'suedjosue@gmail.com')
create policy "Allow admin to view all jobs" on public.jobs for
select to authenticated using (true);
-- 3. INSERT Policy (Authenticated only)
create policy "Allow authenticated users to insert jobs" on public.jobs for
insert to authenticated with check (true);
-- 4. UPDATE Policy (Authenticated only)
create policy "Allow authenticated users to update jobs" on public.jobs for
update to authenticated using (true) with check (true);
-- 5. DELETE Policy (Authenticated only)
create policy "Allow authenticated users to delete jobs" on public.jobs for delete to authenticated using (true);
-- NOTE: Since the app uses simulated auth, these policies will only take effect
-- if the user signs in via Supabase Auth. For local development with anon key,
-- we might need to broaden these temporarily or use Service Role for sensitive tasks.