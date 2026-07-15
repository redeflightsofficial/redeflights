-- Run this in Supabase SQL Editor

create table if not exists public.airlines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  iata_code text not null,
  icao_code text,
  country text,
  slug text not null,
  seo_title text not null,
  meta_description text not null,
  h1_heading text not null,
  page_url text not null,
  status text not null default 'active' check (status in ('pending', 'active')),
  created_at timestamptz not null default now()
);

create unique index if not exists airlines_iata_unique_idx on public.airlines (upper(iata_code));
create unique index if not exists airlines_slug_unique_idx on public.airlines (slug);
create index if not exists airlines_status_created_idx on public.airlines (status, created_at desc);

alter table public.airlines enable row level security;

drop policy if exists "Public can read active airlines" on public.airlines;
create policy "Public can read active airlines"
  on public.airlines for select to anon, authenticated
  using (status = 'active');

drop policy if exists "Admin can manage airlines" on public.airlines;
create policy "Admin can manage airlines"
  on public.airlines for all to anon, authenticated
  using (true) with check (true);
