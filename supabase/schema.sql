-- =============================================================
-- GrowthOS — Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================================

-- -----------------------------------------------
-- PROFILES TABLE
-- -----------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  bio         text,
  timezone    text default 'UTC',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

comment on table public.profiles is 'Extended user profiles linked to auth.users';

-- Trigger: auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- -----------------------------------------------
-- GOALS TABLE
-- -----------------------------------------------
create table if not exists public.goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  category    text default 'general',
  status      text default 'active' check (status in ('active', 'completed', 'paused', 'archived')),
  target_date date,
  progress    integer default 0 check (progress >= 0 and progress <= 100),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

comment on table public.goals is 'User goals with progress tracking';

drop trigger if exists set_goals_updated_at on public.goals;
create trigger set_goals_updated_at
  before update on public.goals
  for each row execute procedure public.set_updated_at();

-- -----------------------------------------------
-- HABITS TABLE
-- -----------------------------------------------
create table if not exists public.habits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  description  text,
  icon         text default '⭐',
  color        text default '#6366f1',
  frequency    text default 'daily' check (frequency in ('daily', 'weekly', 'monthly')),
  target_count integer default 1,
  is_active    boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

comment on table public.habits is 'User habits for tracking';

drop trigger if exists set_habits_updated_at on public.habits;
create trigger set_habits_updated_at
  before update on public.habits
  for each row execute procedure public.set_updated_at();

-- -----------------------------------------------
-- HABIT LOGS TABLE
-- -----------------------------------------------
create table if not exists public.habit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  habit_id   uuid not null references public.habits(id) on delete cascade,
  logged_at  date not null default current_date,
  notes      text,
  created_at timestamptz default now()
);

comment on table public.habit_logs is 'Individual habit completion records';
create unique index if not exists unique_habit_log_per_day on public.habit_logs(habit_id, logged_at);

-- -----------------------------------------------
-- JOURNAL ENTRIES TABLE
-- -----------------------------------------------
create table if not exists public.journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,
  content     text not null,
  mood        integer check (mood >= 1 and mood <= 10),
  tags        text[] default '{}',
  is_private  boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

comment on table public.journal_entries is 'User journal entries with mood tracking';

drop trigger if exists set_journal_entries_updated_at on public.journal_entries;
create trigger set_journal_entries_updated_at
  before update on public.journal_entries
  for each row execute procedure public.set_updated_at();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

-- Profiles
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Goals
alter table public.goals enable row level security;

drop policy if exists "Users can manage own goals" on public.goals;
create policy "Users can manage own goals"
  on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Habits
alter table public.habits enable row level security;

drop policy if exists "Users can manage own habits" on public.habits;
create policy "Users can manage own habits"
  on public.habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Habit Logs
alter table public.habit_logs enable row level security;

drop policy if exists "Users can manage own habit logs" on public.habit_logs;
create policy "Users can manage own habit logs"
  on public.habit_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Journal Entries
alter table public.journal_entries enable row level security;

drop policy if exists "Users can manage own journal entries" on public.journal_entries;
create policy "Users can manage own journal entries"
  on public.journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================================
-- GRANT PERMISSIONS
-- =============================================================
grant usage on schema public to anon, authenticated;
grant all on public.profiles to authenticated;
grant all on public.goals to authenticated;
grant all on public.habits to authenticated;
grant all on public.habit_logs to authenticated;
grant all on public.journal_entries to authenticated;

-- Allow anon to read nothing (RLS blocks everything for anon)
grant select on public.profiles to anon;
