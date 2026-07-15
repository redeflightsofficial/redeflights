-- tour_packages table + storage bucket
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
create policy "Public can read active tour packages"
  on public.tour_packages for select to anon, authenticated
  using (status = 'active');
drop policy if exists "Admin can manage tour packages" on public.tour_packages;
create policy "Admin can manage tour packages"
  on public.tour_packages for all to anon, authenticated
  using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('packages', 'packages', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read package files" on storage.objects;
create policy "Public read package files"
  on storage.objects for select to public
  using (bucket_id = 'packages');
drop policy if exists "Admin upload package files" on storage.objects;
create policy "Admin upload package files"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'packages');
drop policy if exists "Admin update package files" on storage.objects;
create policy "Admin update package files"
  on storage.objects for update to anon, authenticated
  using (bucket_id = 'packages');
drop policy if exists "Admin delete package files" on storage.objects;
create policy "Admin delete package files"
  on storage.objects for delete to anon, authenticated
  using (bucket_id = 'packages');
