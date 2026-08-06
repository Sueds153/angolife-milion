-- Automatic cleanup of old content (free up DB space).
-- Option A: pg_cron deletes old jobs (> 30 days) and old news (> 60 days)
-- every night, regardless of status. Option B (admin button) lives in the app
-- and reuses the same thresholds.

-- 1. Enable pg_cron (idempotent).
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Remove any previous jobs with the same names so this migration is idempotent.
DO $$
DECLARE
  j RECORD;
BEGIN
  FOR j IN SELECT jobid FROM cron.job WHERE jobname IN ('cleanup-old-jobs', 'cleanup-old-news') LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
END $$;

-- 3. Schedule nightly cleanups.
--    Jobs: daily at 04:00 (WAT) -> posted_at older than 30 days.
SELECT cron.schedule(
  'cleanup-old-jobs',
  '0 4 * * *',
  $$ DELETE FROM public.jobs WHERE posted_at < now() - interval '30 days' $$
);

--    News: daily at 05:00 (WAT) -> published_at older than 60 days.
SELECT cron.schedule(
  'cleanup-old-news',
  '0 5 * * *',
  $$ DELETE FROM public.news_articles WHERE published_at < now() - interval '60 days' $$
);
