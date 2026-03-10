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
  category text not null default 'Афиша',
  author_telegram_id bigint not null,
  published_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null default 'other',
  author_name text not null default 'Telegram User',
  author_username text,
  price numeric(12,2),
  image_urls text[] not null default '{}',
  is_free boolean not null default true,
  status text not null default 'pending',
  moderated_by bigint,
  moderated_at timestamptz,
  author_telegram_id bigint not null,
  published_at timestamptz not null default now()
);

create table if not exists public.problems (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  author_name text not null default 'Telegram User',
  author_username text,
  author_telegram_id bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lost_found (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  author_name text not null default 'Telegram User',
  author_username text,
  author_telegram_id bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  author_name text not null default 'Telegram User',
  author_username text,
  author_telegram_id bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists public.question_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  body text not null,
  author_name text not null default 'Telegram User',
  author_username text,
  author_telegram_id bigint not null,
  created_at timestamptz not null default now()
);

alter table public.announcements add column if not exists category text not null default 'other';
alter table public.announcements add column if not exists author_name text not null default 'Telegram User';
alter table public.announcements add column if not exists author_username text;
alter table public.announcements add column if not exists price numeric(12,2);
alter table public.announcements add column if not exists image_urls text[] not null default '{}';
alter table public.announcements add column if not exists is_free boolean not null default true;
alter table public.announcements add column if not exists status text not null default 'pending';
alter table public.announcements add column if not exists moderated_by bigint;
alter table public.announcements add column if not exists moderated_at timestamptz;

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
alter table public.problems enable row level security;
alter table public.lost_found enable row level security;
alter table public.questions enable row level security;
alter table public.question_answers enable row level security;

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

drop policy if exists "no direct reads problems" on public.problems;
create policy "no direct reads problems"
on public.problems
for select
to anon
using (false);

drop policy if exists "no direct reads lost_found" on public.lost_found;
create policy "no direct reads lost_found"
on public.lost_found
for select
to anon
using (false);

drop policy if exists "no direct reads questions" on public.questions;
create policy "no direct reads questions"
on public.questions
for select
to anon
using (false);

drop policy if exists "no direct reads question_answers" on public.question_answers;
create policy "no direct reads question_answers"
on public.question_answers
for select
to anon
using (false);

insert into storage.buckets (id, name, public)
select 'portal-announcements', 'portal-announcements', true
where not exists (
  select 1 from storage.buckets where id = 'portal-announcements'
);

drop policy if exists "public read portal announcement images" on storage.objects;
create policy "public read portal announcement images"
on storage.objects
for select
to public
using (bucket_id = 'portal-announcements');
