-- 📺 ads + system_settings: schema oficial idempotente + RLS com public.is_admin()
-- Evita depender de database/ads_management.sql avulso e de policies recursivas.

create table if not exists public.ads (
    id uuid default gen_random_uuid() primary key,
    type text not null check (type in ('hero', 'partner')),
    media_type text not null check (media_type in ('image', 'video')),
    format text default 'banner' check (format in ('banner', 'interstitial', 'rewarded', 'all')),
    location text default 'home' check (location in ('home', 'jobs', 'exchange', 'all')),
    duration_seconds int default 6,
    image_url text,
    video_url text,
    link text,
    title text,
    company_name text,
    is_active boolean default true,
    display_order int default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.system_settings (
    key text primary key,
    value jsonb not null,
    description text,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.ads enable row level security;
alter table public.system_settings enable row level security;

-- Leitura pública
drop policy if exists "Anyone can view active ads" on public.ads;
create policy "Anyone can view active ads" on public.ads
    for select using (is_active = true);

drop policy if exists "Anyone can view public settings" on public.system_settings;
create policy "Anyone can view public settings" on public.system_settings
    for select using (true);

-- Gestão admin via SECURITY DEFINER is_admin() (sem recursão em profiles)
drop policy if exists "Admins manage ads" on public.ads;
create policy "Admins manage ads" on public.ads
    for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage settings" on public.system_settings;
create policy "Admins manage settings" on public.system_settings
    for all using (public.is_admin()) with check (public.is_admin());

-- Grants
grant select on public.ads to anon, authenticated;
grant select on public.system_settings to anon, authenticated;
grant insert, update, delete on public.ads to authenticated;
grant insert, update, delete on public.system_settings to authenticated;

-- Seed idempotente
insert into public.system_settings (key, value, description)
values (
        'google_ads',
        '{
    "enabled": false,
    "client": "ca-pub-XXXXXXXXXXXXXXXX",
    "slots": {
      "homeHero": "XXXXXXXXXX",
      "homeFooter": "XXXXXXXXXX",
      "jobsList": "XXXXXXXXXX"
    }
  }'::jsonb,
        'Configurações do Google AdSense'
    ),
    (
        'contact_info',
        '{
    "whatsapp": "244921967122"
  }'::jsonb,
        'Informações de contacto globais'
    ) on conflict (key) do nothing;

notify pgrst, 'reload schema';
