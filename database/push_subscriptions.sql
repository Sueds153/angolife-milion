-- Create push_subscriptions table
create table if not exists public.push_subscriptions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    subscription jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);
-- Enable RLS
alter table public.push_subscriptions enable row level security;
-- Policies
create policy "Users manage own subscriptions" on public.push_subscriptions for all using (auth.uid() = user_id);
create policy "Admin view all subscriptions" on public.push_subscriptions for
select using (
        exists (
            select 1
            from public.profiles
            where id = auth.uid()
                and is_admin = true
        )
    );