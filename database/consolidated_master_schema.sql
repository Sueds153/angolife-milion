-- ==========================================
-- AngoLife MASTER Database Schema v2 (CONSOLIDATED)
-- Created during Rigorous Audit: 2026-02-24
-- This schema matches the reality of the code (Scrapers + SupabaseService)
-- ==========================================
-- Extensions
create extension if not exists "uuid-ossp";
-- 1. Exchange Rates Table
create table if not exists public.exchange_rates (
    id uuid default uuid_generate_v4() primary key,
    currency text not null,
    -- 'USD', 'EUR'
    formal_buy numeric,
    formal_sell numeric,
    informal_buy numeric,
    informal_sell numeric,
    last_updated timestamp with time zone default timezone('utc'::text, now())
);
-- 2. Product Deals Table
create table if not exists public.product_deals (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    store text not null,
    original_price numeric,
    discount_price numeric,
    location text,
    description text,
    image_placeholder text,
    -- URL or icon name
    url text,
    -- Store/Product link
    category text,
    status text default 'pending',
    -- 'pending', 'approved', 'rejected'
    submitted_by text,
    created_at timestamp with time zone default timezone('utc'::text, now())
);
-- 3. Jobs Table (Mixed English/Portuguese to match scrapers)
create table if not exists public.jobs (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    company text not null,
    location text,
    type text,
    -- 'Presencial', 'Remoto', 'Híbrido'
    salary text,
    description text,
    requirements text [],
    -- JSON Array of strings
    source_url text,
    application_email text,
    status text default 'pending',
    -- 'pending', 'publicado'
    posted_at timestamp with time zone default timezone('utc'::text, now()),
    imagem_url text,
    -- Added for company logos
    categoria text,
    -- Added for job categorization
    fonte text,
    -- Added for tracking source
    is_verified boolean default false,
    report_count integer default 0,
    application_count integer default 0
);
-- 4. News Articles Table (Fully matches Scraper/Service in Portuguese)
create table if not exists public.news_articles (
    id uuid default uuid_generate_v4() primary key,
    titulo text not null,
    resumo text,
    corpo text,
    imagem_url text,
    categoria text,
    fonte text,
    url_origem text,
    is_priority boolean default false,
    status text default 'pending',
    -- 'pending', 'publicado'
    published_at timestamp with time zone default timezone('utc'::text, now())
);
-- 5. Orders Table
create table if not exists public.orders (
    id uuid default uuid_generate_v4() primary key,
    type text default 'buy',
    -- 'buy', 'sell'
    full_name text,
    age text,
    gender text,
    wallet text,
    coordinates text,
    amount numeric,
    currency text,
    total_kz numeric,
    bank text,
    iban text,
    account_holder text,
    payment_method text,
    proof_url text,
    status text default 'pending',
    user_email text,
    -- For tracking authenticated users
    created_at timestamp with time zone default timezone('utc'::text, now())
);
-- 6. User Profiles Table
create table if not exists public.profiles (
    id uuid not null references auth.users(id) on delete cascade primary key,
    email text unique not null,
    full_name text,
    is_premium boolean default false,
    account_type text default 'free',
    -- Added for tiered features
    cv_credits integer default 0,
    referral_count integer default 0,
    is_admin boolean default false,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
-- ==========================================
-- Security & RLS Policies (Consolidated)
-- ==========================================
-- Enable RLS
alter table public.exchange_rates enable row level security;
alter table public.product_deals enable row level security;
alter table public.jobs enable row level security;
alter table public.news_articles enable row level security;
alter table public.orders enable row level security;
alter table public.profiles enable row level security;
-- Rate Policies
create policy "Rates are public" on public.exchange_rates for
select using (true);
-- Jobs Policies
create policy "Public view published jobs" on public.jobs for
select using (status = 'publicado');
create policy "Admin view all jobs" on public.jobs for
select using (
        exists (
            select 1
            from public.profiles
            where id = auth.uid()
                and is_admin = true
        )
    );
-- News Policies
create policy "Public view published news" on public.news_articles for
select using (status = 'publicado');
create policy "Admin view all news" on public.news_articles for
select using (
        exists (
            select 1
            from public.profiles
            where id = auth.uid()
                and is_admin = true
        )
    );
-- Profile Policies
create policy "Users see own profile" on public.profiles for
select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for
update using (auth.uid() = id);
create policy "Admin see all profiles" on public.profiles for
select using (
        exists (
            select 1
            from public.profiles
            where id = auth.uid()
                and is_admin = true
        )
    );
-- Orders Policies
create policy "Users see own orders" on public.orders for
select using (
        auth.uid() is not null
        and user_email = (
            select email
            from auth.users
            where id = auth.uid()
        )
    );
create policy "Enable insert for authenticated users only" on public.orders for
insert with check (auth.uid() is not null);
create policy "Admin see all orders" on public.orders for
select using (
        exists (
            select 1
            from public.profiles
            where id = auth.uid()
                and is_admin = true
        )
    );