-- Run this in Supabase SQL Editor

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  from_city text not null,
  to_city text not null,
  from_airport_code text,
  to_airport_code text,
  airline_name text,
  airline_iata_code text,
  slug text not null,
  og_title text not null default '',
  og_description text not null default '',
  seo_keywords text not null default '',
  seo_title text not null,
  meta_description text not null,
  h1_heading text not null,
  page_url text not null,
  status text not null default 'active' check (status in ('pending', 'active')),
  created_at timestamptz not null default now()
);

create unique index if not exists routes_slug_unique_idx on public.routes (slug);
create index if not exists routes_status_created_idx on public.routes (status, created_at desc);

alter table public.routes add column if not exists airline_iata_code text;
alter table public.routes add column if not exists og_title text not null default '';
alter table public.routes add column if not exists og_description text not null default '';
alter table public.routes add column if not exists seo_keywords text not null default '';

alter table public.routes enable row level security;

drop policy if exists "Public can read active routes" on public.routes;
create policy "Public can read active routes"
  on public.routes for select to anon, authenticated
  using (status = 'active');

drop policy if exists "Admin can manage routes" on public.routes;
create policy "Admin can manage routes"
  on public.routes for all to anon, authenticated
  using (true) with check (true);
