-- 🔒 ads storage: INSERT/UPDATE/DELETE apenas admin (via public.is_admin())
-- Substitui ads_insert_authenticated aberto a qualquer authenticated.

drop policy if exists "ads_insert_authenticated" on storage.objects;
drop policy if exists "ads_update_admin" on storage.objects;
drop policy if exists "ads_delete_admin" on storage.objects;
drop policy if exists "ads_insert_admin" on storage.objects;

create policy "ads_insert_admin"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'ads' and public.is_admin());

create policy "ads_update_admin"
  on storage.objects for update to authenticated
  using (bucket_id = 'ads' and public.is_admin())
  with check (bucket_id = 'ads' and public.is_admin());

create policy "ads_delete_admin"
  on storage.objects for delete to authenticated
  using (bucket_id = 'ads' and public.is_admin());

-- Garante que policies antigas perigosas não regressam via setup scripts
-- (Public Upload Ads / Public Update Ads / Public Delete Ads)
drop policy if exists "Public Upload Ads" on storage.objects;
drop policy if exists "Public Update Ads" on storage.objects;
drop policy if exists "Public Delete Ads" on storage.objects;

notify pgrst, 'reload schema';
