-- 📺 Tabela de Anúncios (Banners e Vídeos)
create table if not exists public.ads (
    id uuid default uuid_generate_v4() primary key,
    type text not null check (type in ('hero', 'partner')),
    media_type text not null check (media_type in ('image', 'video')),
    format text default 'banner' check (format in ('banner', 'interstitial', 'rewarded')),
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
-- ⚙️ Tabela de Configurações Globais do Sistema
create table if not exists public.system_settings (
    key text primary key,
    value jsonb not null,
    description text,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);
-- Habilitar RLS
alter table public.ads enable row level security;
alter table public.system_settings enable row level security;
-- Políticas de Leitura Pública
drop policy if exists "Anyone can view active ads" on public.ads;
create policy "Anyone can view active ads" on public.ads for
select using (is_active = true);
drop policy if exists "Anyone can view public settings" on public.system_settings;
create policy "Anyone can view public settings" on public.system_settings for
select using (true);
-- Políticas de Gestão para Admins
drop policy if exists "Admins manage ads" on public.ads;
create policy "Admins manage ads" on public.ads for all using (
    exists (
        select 1
        from public.profiles
        where id = auth.uid()
            and is_admin = true
    )
);
drop policy if exists "Admins manage settings" on public.system_settings;
create policy "Admins manage settings" on public.system_settings for all using (
    exists (
        select 1
        from public.profiles
        where id = auth.uid()
            and is_admin = true
    )
);
-- Inserir Configurações Iniciais
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