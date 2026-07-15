-- Run once in Supabase SQL Editor (or via scripts/setup-supabase-and-migrate.mjs)
-- Creates / updates all tables, RLS policies, and the banners storage bucket.

-- routes
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
create policy "Public can read active routes" on public.routes for select to anon, authenticated using (status = 'active');
drop policy if exists "Admin can manage routes" on public.routes;
create policy "Admin can manage routes" on public.routes for all to anon, authenticated using (true) with check (true);

-- hotels
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
create policy "Public can read active hotels" on public.hotels for select to anon, authenticated using (status = 'active');
drop policy if exists "Admin can manage hotels" on public.hotels;
create policy "Admin can manage hotels" on public.hotels for all to anon, authenticated using (true) with check (true);

-- visas
create table if not exists public.visas (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  visa_type text not null,
  processing_time text,
  description text,
  image_url text,
  storage_path text,
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

create unique index if not exists visas_slug_unique_idx on public.visas (slug);
create index if not exists visas_status_created_idx on public.visas (status, created_at desc);
alter table public.visas enable row level security;
drop policy if exists "Public can read active visas" on public.visas;
create policy "Public can read active visas" on public.visas for select to anon, authenticated using (status = 'active');
drop policy if exists "Admin can manage visas" on public.visas;
create policy "Admin can manage visas" on public.visas for all to anon, authenticated using (true) with check (true);

-- banners (upgrade legacy table + storage)
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  alt text not null default '',
  slug text,
  seo_title text,
  meta_description text,
  h1_heading text,
  image_url text not null,
  storage_path text not null,
  status text not null default 'active' check (status in ('pending', 'active')),
  created_at timestamptz not null default now()
);

alter table public.banners add column if not exists slug text;
alter table public.banners add column if not exists seo_title text;
alter table public.banners add column if not exists meta_description text;
alter table public.banners add column if not exists h1_heading text;
create unique index if not exists banners_slug_unique_idx on public.banners (slug) where slug is not null;
create index if not exists banners_status_created_idx on public.banners (status, created_at desc);
alter table public.banners enable row level security;
drop policy if exists "Public can read active banners" on public.banners;
create policy "Public can read active banners" on public.banners for select to anon, authenticated using (status = 'active');
drop policy if exists "Admin can read all banners" on public.banners;
create policy "Admin can read all banners" on public.banners for select to anon, authenticated using (true);
drop policy if exists "Admin can insert banners" on public.banners;
create policy "Admin can insert banners" on public.banners for insert to anon, authenticated with check (true);
drop policy if exists "Admin can update banners" on public.banners;
create policy "Admin can update banners" on public.banners for update to anon, authenticated using (true);
drop policy if exists "Admin can delete banners" on public.banners;
create policy "Admin can delete banners" on public.banners for delete to anon, authenticated using (true);

insert into storage.buckets (id, name, public) values ('banners', 'banners', true) on conflict (id) do update set public = true;
drop policy if exists "Public read banner files" on storage.objects;
create policy "Public read banner files" on storage.objects for select to public using (bucket_id = 'banners');
drop policy if exists "Admin upload banner files" on storage.objects;
create policy "Admin upload banner files" on storage.objects for insert to anon, authenticated with check (bucket_id = 'banners');
drop policy if exists "Admin update banner files" on storage.objects;
create policy "Admin update banner files" on storage.objects for update to anon, authenticated using (bucket_id = 'banners');
drop policy if exists "Admin delete banner files" on storage.objects;
create policy "Admin delete banner files" on storage.objects for delete to anon, authenticated using (bucket_id = 'banners');

-- airlines
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
create policy "Public can read active airlines" on public.airlines for select to anon, authenticated using (status = 'active');
drop policy if exists "Admin can manage airlines" on public.airlines;
create policy "Admin can manage airlines" on public.airlines for all to anon, authenticated using (true) with check (true);

-- airports
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
create policy "Public can read active airports" on public.airports for select to anon, authenticated using (status = 'active');
drop policy if exists "Admin can manage airports" on public.airports;
create policy "Admin can manage airports" on public.airports for all to anon, authenticated using (true) with check (true);

-- destinations
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
create policy "Public can read active destinations" on public.destinations for select to anon, authenticated using (status = 'active');
drop policy if exists "Admin can manage destinations" on public.destinations;
create policy "Admin can manage destinations" on public.destinations for all to anon, authenticated using (true) with check (true);

-- tour_packages
create table if not exists public.tour_packages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  tag text not null default '',
  route text not null default '',
  duration text not null default '',
  region text not null default '',
  theme text not null default '',
  includes text[] not null default '{}',
  image_url text,
  storage_path text,
  slug text not null,
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('pending', 'active')),
  created_at timestamptz not null default now()
);

create unique index if not exists tour_packages_slug_unique_idx on public.tour_packages (slug);
create index if not exists tour_packages_status_created_idx on public.tour_packages (status, created_at desc);
alter table public.tour_packages enable row level security;
drop policy if exists "Public can read active tour packages" on public.tour_packages;
create policy "Public can read active tour packages" on public.tour_packages for select to anon, authenticated using (status = 'active');
drop policy if exists "Admin can manage tour packages" on public.tour_packages;
create policy "Admin can manage tour packages" on public.tour_packages for all to anon, authenticated using (true) with check (true);

insert into storage.buckets (id, name, public) values ('packages', 'packages', true) on conflict (id) do update set public = true;
drop policy if exists "Public read package files" on storage.objects;
create policy "Public read package files" on storage.objects for select to public using (bucket_id = 'packages');
drop policy if exists "Admin upload package files" on storage.objects;
create policy "Admin upload package files" on storage.objects for insert to anon, authenticated with check (bucket_id = 'packages');
drop policy if exists "Admin update package files" on storage.objects;
create policy "Admin update package files" on storage.objects for update to anon, authenticated using (bucket_id = 'packages');
drop policy if exists "Admin delete package files" on storage.objects;
create policy "Admin delete package files" on storage.objects for delete to anon, authenticated using (bucket_id = 'packages');
