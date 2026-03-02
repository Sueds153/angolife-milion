-- 🚨 AngoLife Security Hardening Script 🚨
-- Este script ativa e reforça as políticas de RLS em todas as tabelas.
-- 1. Tabela de PERFIS (Profiles)
alter table public.profiles enable row level security;
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for
select using (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for
update using (auth.uid() = id);
-- NOTA: A política de Admin já existe e não deve ser alterada conforme solicitado.
-- create policy "Admins can view all profiles" on public.profiles for select using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
-- 2. Tabela de SUBSCRIPÇÕES PUSH (Push Subscriptions)
alter table public.push_subscriptions enable row level security;
drop policy if exists "Users manage own subscriptions" on public.push_subscriptions;
create policy "Users manage own subscriptions" on public.push_subscriptions for all using (auth.uid() = user_id);
-- 3. Tabela de VAGAS (Jobs)
alter table public.jobs enable row level security;
drop policy if exists "Anyone can view approved jobs" on public.jobs;
create policy "Anyone can view approved jobs" on public.jobs for
select using (status = 'approved');
drop policy if exists "Admins manage jobs" on public.jobs;
create policy "Admins manage jobs" on public.jobs for all using (
    exists (
        select 1
        from profiles
        where id = auth.uid()
            and is_admin = true
    )
);
-- 4. Tabela de NOTÍCIAS (News)
alter table public.news enable row level security;
drop policy if exists "Anyone can view news" on public.news;
create policy "Anyone can view news" on public.news for
select using (true);
drop policy if exists "Admins manage news" on public.news;
create policy "Admins manage news" on public.news for all using (
    exists (
        select 1
        from profiles
        where id = auth.uid()
            and is_admin = true
    )
);
-- 5. Tabela de OFERTAS (Deals)
alter table public.deals enable row level security;
drop policy if exists "Anyone can view active deals" on public.deals;
create policy "Anyone can view active deals" on public.deals for
select using (true);
-- 6. Tabela de ORDENS (Orders/Exchange/CV Purchase)
alter table public.orders enable row level security;
drop policy if exists "Users view own orders" on public.orders;
create policy "Users view own orders" on public.orders for
select using (
        user_email = (
            select email
            from auth.users
            where id = auth.uid()
        )
    );
drop policy if exists "Admins view all orders" on public.orders;
create policy "Admins view all orders" on public.orders for all using (
    exists (
        select 1
        from profiles
        where id = auth.uid()
            and is_admin = true
    )
);