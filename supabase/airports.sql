-- Run this in Supabase SQL Editor

create table if not exists public.airports (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  iata_code text not null,
  city text not null,
  country text,
  slug text not null,
  seo_title text not null,
  meta_description text not null,
  h1_heading text not null,
  page_url text not null,
  status text not null default 'active' check (status in ('pending', 'active')),
  created_at timestamptz not null default now()
);

create unique index if not exists airports_iata_unique_idx on public.airports (upper(iata_code));
create unique index if not exists airports_slug_unique_idx on public.airports (slug);
create index if not exists airports_status_created_idx on public.airports (status, created_at desc);

alter table public.airports enable row level security;

drop policy if exists "Public can read active airports" on public.airports;
create policy "Public can read active airports"
  on public.airports for select to anon, authenticated
  using (status = 'active');

drop policy if exists "Admin can manage airports" on public.airports;
create policy "Admin can manage airports"
  on public.airports for all to anon, authenticated
  using (true) with check (true);
