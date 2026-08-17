-- Run this in Supabase SQL Editor

create table if not exists public.umrah_packages (
  id uuid primary key default gen_random_uuid(),
  package_code text not null default '',
  title text not null,
  departure_city text not null default '',
  destination text not null default 'Makkah & Madinah',
  hotel_category text not null default '',
  hotel_name text not null default '',
  nights integer not null default 0,
  airline text not null default '',
  price_aed text not null default '',
  visa_included boolean not null default false,
  transfer_included boolean not null default false,
  focus_keyword text not null default '',
  short_description text not null default '',
  long_description text not null default '',
  h2_heading text not null default '',
  image_url text,
  image_alt text not null default '',
  faqs text[] not null default '{}',
  schema_description text not null default '',
  instagram_caption text not null default '',
  instagram_hashtags text not null default '',
  internal_links text not null default '',
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

create unique index if not exists umrah_packages_slug_unique_idx on public.umrah_packages (slug);
create index if not exists umrah_packages_status_created_idx on public.umrah_packages (status, created_at desc);

alter table public.umrah_packages enable row level security;

drop policy if exists "Public can read active umrah packages" on public.umrah_packages;
create policy "Public can read active umrah packages"
  on public.umrah_packages for select to anon, authenticated
  using (status = 'active');

drop policy if exists "Admin can manage umrah packages" on public.umrah_packages;
create policy "Admin can manage umrah packages"
  on public.umrah_packages for all to anon, authenticated
  using (true) with check (true);
