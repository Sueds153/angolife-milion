-- ==========================================
-- Security hardening (Fase 1+2)
-- 1. public.is_admin() — helper SECURITY DEFINER idempotente (sem recursão)
-- 2. referral_rewards — idempotência do edge function referral-reward
-- 3. product_deals — força pending/verified=false/is_admin=false em não-admins
-- 4. exchange_rates — só admin pode UPDATE
-- 5. orders — força status inicial pending em não-admins
-- 6. storage: exchange-proofs/cv-files por dono (pasta = auth.uid)
-- ==========================================

-- ──────────────────────────────────────────
-- 1. is_admin() helper (seguro contra recursão em profiles)
-- ──────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- ──────────────────────────────────────────
-- 2. referral_rewards (claim único por novo utilizador)
-- ──────────────────────────────────────────
create table if not exists public.referral_rewards (
  new_user_id uuid primary key references auth.users(id) on delete cascade,
  referral_code text not null,
  created_at timestamptz not null default now()
);

alter table public.referral_rewards enable row level security;

drop policy if exists "No client access to referral_rewards" on public.referral_rewards;
create policy "No client access to referral_rewards"
  on public.referral_rewards for all
  using (false)
  with check (false);

-- ──────────────────────────────────────────
-- 3. product_deals — não-admins nunca submetem aprovado
-- ──────────────────────────────────────────
create or replace function public.force_deal_moderation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if TG_OP = 'INSERT'
       or new.status is distinct from old.status
       or new.verified is distinct from old.verified
       or new.is_admin is distinct from old.is_admin
    then
      new.status := 'pending';
      new.verified := false;
      new.is_admin := false;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_force_deal_moderation on public.product_deals;
create trigger trg_force_deal_moderation
  before insert or update on public.product_deals
  for each row execute function public.force_deal_moderation();

drop policy if exists "Authed users can submit deals" on public.product_deals;
create policy "Authed users can submit deals"
  on public.product_deals for insert
  to authenticated
  with check (auth.uid() is not null);

-- ──────────────────────────────────────────
-- 4. exchange_rates — rates_admin já existe (is_admin()); garante UPDATE explícito
-- ──────────────────────────────────────────
alter table public.exchange_rates enable row level security;

drop policy if exists "rates_admin" on public.exchange_rates;
create policy "rates_admin"
  on public.exchange_rates for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ──────────────────────────────────────────
-- 5. orders — não-admins não escolhem status
--    (orders não tem coluna user_id — usa user_email)
-- ──────────────────────────────────────────
create or replace function public.force_order_pending()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.status is null or lower(new.status) not in ('pending', 'pendente', 'completed', 'cancelled', 'canceled', 'rejected') then
      new.status := 'pending';
    elsif lower(new.status) in ('completed', 'cancelled', 'canceled') then
      new.status := 'pending';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_force_order_pending on public.orders;
create trigger trg_force_order_pending
  before insert on public.orders
  for each row execute function public.force_order_pending();

-- ──────────────────────────────────────────
-- 6. storage.exchange-proofs — SELECT por owner (não foldername)
--    (uploads legados usam path proofs/, sem pasta de user)
-- ──────────────────────────────────────────
drop policy if exists "exchange_proofs_select_owner" on storage.objects;
drop policy if exists "exchange_proofs_access" on storage.objects;
create policy "exchange_proofs_select_owner"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'exchange-proofs'
    and (
      owner = auth.uid()
      or (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

drop policy if exists "exchange_proofs_insert_owner" on storage.objects;
create policy "exchange_proofs_insert_owner"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'exchange-proofs'
    and (
      owner = auth.uid()
      or (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

-- ──────────────────────────────────────────
-- 7. storage.cv-files — bucket privado (pasta própria)
-- ──────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('cv-files', 'cv-files', false)
on conflict (id) do nothing;

drop policy if exists "cv_files_insert_auth" on storage.objects;
create policy "cv_files_insert_auth"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'cv-files'
    and (
      owner = auth.uid()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

drop policy if exists "cv_files_select_own_or_admin" on storage.objects;
create policy "cv_files_select_own_or_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'cv-files'
    and (
      owner = auth.uid()
      or (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

drop policy if exists "cv_files_delete_own" on storage.objects;
create policy "cv_files_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'cv-files'
    and (
      owner = auth.uid()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );
