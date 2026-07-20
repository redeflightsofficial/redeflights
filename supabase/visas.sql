-- Run this in Supabase SQL Editor

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
create policy "Public can read active visas"
  on public.visas for select to anon, authenticated
  using (status = 'active');

drop policy if exists "Admin can manage visas" on public.visas;
create policy "Admin can manage visas"
  on public.visas for all to anon, authenticated
  using (true) with check (true);

-- Storage bucket (public read for visa pages)
insert into storage.buckets (id, name, public)
values ('visas', 'visas', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read visa files" on storage.objects;
create policy "Public read visa files"
  on storage.objects for select to public
  using (bucket_id = 'visas');

drop policy if exists "Admin upload visa files" on storage.objects;
create policy "Admin upload visa files"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'visas');

drop policy if exists "Admin update visa files" on storage.objects;
create policy "Admin update visa files"
  on storage.objects for update to anon, authenticated
  using (bucket_id = 'visas');

drop policy if exists "Admin delete visa files" on storage.objects;
create policy "Admin delete visa files"
  on storage.objects for delete to anon, authenticated
  using (bucket_id = 'visas');
