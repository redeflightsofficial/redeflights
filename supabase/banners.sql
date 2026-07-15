-- Run this in Supabase SQL Editor

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

alter table public.banners enable row level security;

drop policy if exists "Public can read active banners" on public.banners;
create policy "Public can read active banners"
  on public.banners
  for select
  to anon, authenticated
  using (status = 'active');

drop policy if exists "Admin can read all banners" on public.banners;
create policy "Admin can read all banners"
  on public.banners
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Admin can insert banners" on public.banners;
create policy "Admin can insert banners"
  on public.banners
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admin can update banners" on public.banners;
create policy "Admin can update banners"
  on public.banners
  for update
  to anon, authenticated
  using (true);

drop policy if exists "Admin can delete banners" on public.banners;
create policy "Admin can delete banners"
  on public.banners
  for delete
  to anon, authenticated
  using (true);

create index if not exists banners_status_created_idx on public.banners (status, created_at desc);

-- Storage bucket (public read for home page carousel)
insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read banner files" on storage.objects;
create policy "Public read banner files"
  on storage.objects
  for select
  to public
  using (bucket_id = 'banners');

drop policy if exists "Admin upload banner files" on storage.objects;
create policy "Admin upload banner files"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'banners');

drop policy if exists "Admin update banner files" on storage.objects;
create policy "Admin update banner files"
  on storage.objects
  for update
  to anon, authenticated
  using (bucket_id = 'banners');

drop policy if exists "Admin delete banner files" on storage.objects;
create policy "Admin delete banner files"
  on storage.objects
  for delete
  to anon, authenticated
  using (bucket_id = 'banners');

-- Recommended: add SUPABASE_SERVICE_ROLE_KEY in .env.local for production.
