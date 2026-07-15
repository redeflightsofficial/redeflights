-- Run this in Supabase SQL Editor

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  service text not null default 'General',
  message text not null default '',
  status text not null default 'new' check (status in ('new', 'read', 'replied')),
  created_at timestamptz not null default now()
);

alter table public.enquiries enable row level security;

drop policy if exists "Public can submit enquiries" on public.enquiries;
create policy "Public can submit enquiries"
  on public.enquiries
  for insert
  to anon, authenticated
  with check (true);

create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);

-- Admin dashboard reads/updates use SUPABASE_SERVICE_ROLE_KEY in API routes.
