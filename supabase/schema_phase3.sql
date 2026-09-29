-- =============================================================
-- GrowthOS — Phase 3 Schema Additions
-- Run this in your Supabase SQL Editor AFTER schema_phase2.sql
-- =============================================================

-- -----------------------------------------------
-- FOCUS SESSIONS TABLE
-- -----------------------------------------------
create table if not exists public.focus_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  goal_id      uuid references public.goals(id) on delete set null,
  task_id      uuid references public.tasks(id) on delete set null,
  duration_min integer not null check (duration_min > 0),
  label        text,
  notes        text,
  started_at   timestamptz not null default now(),
  created_at   timestamptz default now()
);

comment on table public.focus_sessions is 'Completed focus/pomodoro sessions with optional goal or task link';

-- Index for fast daily queries
create index if not exists idx_focus_sessions_user_date
  on public.focus_sessions(user_id, started_at);

-- RLS
alter table public.focus_sessions enable row level security;

drop policy if exists "Users can manage own focus sessions" on public.focus_sessions;
create policy "Users can manage own focus sessions"
  on public.focus_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Grant
grant all on public.focus_sessions to authenticated;

-- -----------------------------------------------
-- UPDATE journal_entries: add structured prompts columns
-- These are stored as jsonb so no migration required if using jsonb
-- We add a mood_label text and prompts jsonb column
-- -----------------------------------------------
alter table public.journal_entries
  add column if not exists mood_label text,
  add column if not exists prompts    jsonb default '{}';
