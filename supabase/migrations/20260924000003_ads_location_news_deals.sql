-- Estende locations de anúncios: news + deals (targeting dedicado)
alter table public.ads drop constraint if exists ads_location_check;
alter table public.ads add constraint ads_location_check
  check (location in ('home', 'jobs', 'exchange', 'news', 'deals', 'all'));

notify pgrst, 'reload schema';
