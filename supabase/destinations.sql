-- Run this in Supabase SQL Editor

create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  country text not null,
  subtitle text not null default '',
  region text not null default 'Asia',
  travel_styles text[] not null default '{}',
  image_url text,
  packages_count integer not null default 0,
  popular_score integer not null default 0,
  slug text not null,
  seo_title text not null,
  meta_description text not null,
  h1_heading text not null,
  page_url text not null,
  og_title text not null default '',
  og_description text not null default '',
  seo_keywords text not null default '',
  status text not null default 'active' check (status in ('pending', 'active')),
  created_at timestamptz not null default now()
);

create unique index if not exists destinations_slug_unique_idx on public.destinations (slug);
create index if not exists destinations_status_created_idx on public.destinations (status, created_at desc);

alter table public.destinations enable row level security;

drop policy if exists "Public can read active destinations" on public.destinations;
create policy "Public can read active destinations"
  on public.destinations for select to anon, authenticated
  using (status = 'active');

drop policy if exists "Admin can manage destinations" on public.destinations;
create policy "Admin can manage destinations"
  on public.destinations for all to anon, authenticated
  using (true) with check (true);
