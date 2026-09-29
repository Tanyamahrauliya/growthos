-- =============================================================
-- GrowthOS — Phase 2 Schema Additions
-- Run this in your Supabase SQL Editor AFTER the original schema.sql
-- =============================================================

-- -----------------------------------------------
-- ADD onboarding_completed TO PROFILES
-- -----------------------------------------------
alter table public.profiles
  add column if not exists onboarding_completed boolean default false;

-- -----------------------------------------------
-- TASKS TABLE
-- -----------------------------------------------
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  priority    text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status      text default 'todo' check (status in ('todo', 'in_progress', 'done')),
  due_date    date,
  goal_id     uuid references public.goals(id) on delete set null,
  completed_at timestamptz,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

comment on table public.tasks is 'User tasks with priority, due date, and optional goal link';

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.set_updated_at();

-- -----------------------------------------------
-- MILESTONES TABLE
-- -----------------------------------------------
create table if not exists public.milestones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  goal_id     uuid not null references public.goals(id) on delete cascade,
  title       text not null,
  is_completed boolean default false,
  completed_at timestamptz,
  due_date    date,
  sort_order  integer default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

comment on table public.milestones is 'Sub-milestones for goals';

drop trigger if exists set_milestones_updated_at on public.milestones;
create trigger set_milestones_updated_at
  before update on public.milestones
  for each row execute procedure public.set_updated_at();

-- -----------------------------------------------
-- RLS FOR NEW TABLES
-- -----------------------------------------------

-- Tasks
alter table public.tasks enable row level security;

drop policy if exists "Users can manage own tasks" on public.tasks;
create policy "Users can manage own tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Milestones
alter table public.milestones enable row level security;

drop policy if exists "Users can manage own milestones" on public.milestones;
create policy "Users can manage own milestones"
  on public.milestones for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------------
-- GRANTS
-- -----------------------------------------------
grant all on public.tasks to authenticated;
grant all on public.milestones to authenticated;
