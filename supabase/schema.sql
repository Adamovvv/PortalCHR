create extension if not exists "pgcrypto";

drop table if exists public.question_answers cascade;
drop table if exists public.questions cascade;
drop table if exists public.lost_found cascade;
drop table if exists public.problems cascade;
drop table if exists public.announcements cascade;
drop table if exists public.news cascade;
drop table if exists public.portal_notice cascade;

drop table if exists public.game_results cascade;
drop table if exists public.task_claims cascade;
drop table if exists public.tasks cascade;
drop table if exists public.profiles cascade;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  first_name text not null,
  last_name text,
  username text,
  photo_url text,
  language text not null default 'ru' check (language in ('ru', 'en')),
  token_balance integer not null default 0,
  farming_started_at timestamptz,
  farming_ends_at timestamptz,
  best_game_score integer not null default 0,
  total_game_sessions integer not null default 0,
  referred_by bigint references public.profiles(telegram_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_ru text not null,
  title_en text not null,
  description_ru text not null,
  description_en text not null,
  reward_tokens integer not null check (reward_tokens > 0),
  action_url text,
  icon text not null default 'telegram',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.task_claims (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  profile_telegram_id bigint not null references public.profiles(telegram_id) on delete cascade,
  reward_tokens integer not null,
  created_at timestamptz not null default now(),
  unique (task_id, profile_telegram_id)
);

create table public.game_results (
  id uuid primary key default gen_random_uuid(),
  profile_telegram_id bigint not null references public.profiles(telegram_id) on delete cascade,
  score integer not null,
  reward_tokens integer not null,
  created_at timestamptz not null default now()
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
alter table public.tasks enable row level security;
alter table public.task_claims enable row level security;
alter table public.game_results enable row level security;

drop policy if exists "no direct profile access" on public.profiles;
create policy "no direct profile access"
on public.profiles
for all
to anon
using (false)
with check (false);

drop policy if exists "no direct tasks access" on public.tasks;
create policy "no direct tasks access"
on public.tasks
for all
to anon
using (false)
with check (false);

drop policy if exists "no direct task claims access" on public.task_claims;
create policy "no direct task claims access"
on public.task_claims
for all
to anon
using (false)
with check (false);

drop policy if exists "no direct game results access" on public.game_results;
create policy "no direct game results access"
on public.game_results
for all
to anon
using (false)
with check (false);

insert into public.tasks (slug, title_ru, title_en, description_ru, description_en, reward_tokens, action_url, icon, sort_order)
values
  (
    'join-channel',
    'Подписаться на канал',
    'Join the channel',
    'Открой канал проекта в Telegram и подпишись.',
    'Open the project Telegram channel and subscribe.',
    150,
    'https://t.me/moqaz',
    'telegram',
    1
  ),
  (
    'open-news',
    'Открыть новости проекта',
    'Open project news',
    'Открой новостной пост проекта и вернись в приложение.',
    'Open the project news post and come back to the app.',
    100,
    'https://t.me/moqaz',
    'news',
    2
  ),
  (
    'invite-friend',
    'Пригласить друга',
    'Invite a friend',
    'Поделись своей реферальной ссылкой и приведи нового игрока.',
    'Share your referral link and bring a new player.',
    200,
    null,
    'friends',
    3
  )
on conflict (slug) do update
set
  title_ru = excluded.title_ru,
  title_en = excluded.title_en,
  description_ru = excluded.description_ru,
  description_en = excluded.description_en,
  reward_tokens = excluded.reward_tokens,
  action_url = excluded.action_url,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  is_active = true;
