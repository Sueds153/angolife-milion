-- 🛡️ Tabela para Gestão de Subscrições Pendentes (Pagamentos Manuais)
create table if not exists public.subscriptions_pending (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    type text not null,
    -- 'pack3', 'monthly', 'yearly'
    status text default 'pending',
    -- 'pending', 'approved', 'rejected'
    receipt_url text,
    -- Link para o comprovativo no Storage
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);
-- Habilitar RLS
alter table public.subscriptions_pending enable row level security;
-- Políticas de Segurança
drop policy if exists "Users view own subscription requests" on public.subscriptions_pending;
create policy "Users view own subscription requests" on public.subscriptions_pending for
select using (auth.uid() = user_id);
drop policy if exists "Users insert own requests" on public.subscriptions_pending;
create policy "Users insert own requests" on public.subscriptions_pending for
insert with check (auth.uid() = user_id);
drop policy if exists "Admins manage all requests" on public.subscriptions_pending;
create policy "Admins manage all requests" on public.subscriptions_pending for all using (
    exists (
        select 1
        from public.profiles
        where id = auth.uid()
            and is_admin = true
    )
);