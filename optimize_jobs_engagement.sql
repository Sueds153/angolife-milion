-- ==========================================
-- Optimization for Engagement in Jobs Table
-- ==========================================
-- 1. Add columns for verification and reports
alter table public.jobs
add column if not exists is_verified boolean default false,
    add column if not exists report_count integer default 0;
-- 2. Update RLS (optional but good to have)
-- If reports >= 3, the job shouldn't be publicly visible if status is still 'published'
-- However, we will handle the status flip in the service for simpler logic.
-- 3. Add an index on location for faster filtering
create index if not exists idx_jobs_location on public.jobs(location);
create index if not exists idx_jobs_status on public.jobs(status);