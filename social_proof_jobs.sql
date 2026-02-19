-- ==========================================
-- Social Proof Update for Jobs Table
-- ==========================================
-- 1. Add column for application count
alter table public.jobs
add column if not exists application_count integer default 0;
-- 2. Add an index for faster date filtering (already handled by posted_at usually, but good to ensure)
create index if not exists idx_jobs_posted_at on public.jobs(posted_at desc);