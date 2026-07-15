-- Run this in Supabase SQL Editor

create table if not exists public.hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  stars integer not null default 0,
  rating text,
  reviews text,
  amenities text[] not null default '{}',
  description text,
  image_url text,
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

create unique index if not exists hotels_slug_unique_idx on public.hotels (slug);
create index if not exists hotels_status_created_idx on public.hotels (status, created_at desc);

alter table public.hotels enable row level security;

drop policy if exists "Public can read active hotels" on public.hotels;
create policy "Public can read active hotels"
  on public.hotels for select to anon, authenticated
  using (status = 'active');

drop policy if exists "Admin can manage hotels" on public.hotels;
create policy "Admin can manage hotels"
  on public.hotels for all to anon, authenticated
  using (true) with check (true);
