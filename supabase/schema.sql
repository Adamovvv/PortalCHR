create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  first_name text not null,
  last_name text,
  username text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portal_notice (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  author_telegram_id bigint not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  category text not null default 'Новости',
  author_telegram_id bigint not null,
  published_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  author_telegram_id bigint not null,
  published_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.portal_notice enable row level security;
alter table public.news enable row level security;
alter table public.announcements enable row level security;

drop policy if exists "no direct reads profiles" on public.profiles;
create policy "no direct reads profiles"
on public.profiles
for select
to anon
using (false);

drop policy if exists "no direct writes profiles" on public.profiles;
create policy "no direct writes profiles"
on public.profiles
for all
to anon
using (false)
with check (false);

drop policy if exists "no direct reads notice" on public.portal_notice;
create policy "no direct reads notice"
on public.portal_notice
for select
to anon
using (false);

drop policy if exists "no direct reads news" on public.news;
create policy "no direct reads news"
on public.news
for select
to anon
using (false);

drop policy if exists "no direct reads announcements" on public.announcements;
create policy "no direct reads announcements"
on public.announcements
for select
to anon
using (false);
