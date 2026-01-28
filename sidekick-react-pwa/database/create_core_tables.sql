-- ============================================================================
-- Sidekick Core Tables Schema
-- Creates: tasks, agents, conversations, messages, calendar_events
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- TASKS TABLE
-- ============================================================================
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  completed boolean default false,
  priority text default 'medium' check (priority in ('high', 'medium', 'low')),
  due_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  metadata jsonb default '{}'
);

-- ============================================================================
-- AGENTS TABLE
-- ============================================================================
create table if not exists agents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  status text default 'idle' check (status in ('active', 'idle', 'paused')),
  agent_type text not null,
  config jsonb default '{}',
  last_run timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================
create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  metadata jsonb default '{}'
);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender text not null check (sender in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now(),
  agent_type text,
  behavioral_mode text,
  metadata jsonb default '{}'
);

-- ============================================================================
-- CALENDAR_EVENTS TABLE
-- ============================================================================
create table if not exists calendar_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz,
  attendees text[],
  location text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================================================
-- ENABLE RLS (Row Level Security)
-- ============================================================================
alter table tasks enable row level security;
alter table agents enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table calendar_events enable row level security;

-- ============================================================================
-- RLS POLICIES - Tasks
-- ============================================================================
create policy "Users can view own tasks" on tasks
  for select using (auth.uid() = user_id);

create policy "Users can insert own tasks" on tasks
  for insert with check (auth.uid() = user_id);

create policy "Users can update own tasks" on tasks
  for update using (auth.uid() = user_id);

create policy "Users can delete own tasks" on tasks
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - Agents
-- ============================================================================
create policy "Users can view own agents" on agents
  for select using (auth.uid() = user_id);

create policy "Users can insert own agents" on agents
  for insert with check (auth.uid() = user_id);

create policy "Users can update own agents" on agents
  for update using (auth.uid() = user_id);

create policy "Users can delete own agents" on agents
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - Conversations
-- ============================================================================
create policy "Users can view own conversations" on conversations
  for select using (auth.uid() = user_id);

create policy "Users can insert own conversations" on conversations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own conversations" on conversations
  for update using (auth.uid() = user_id);

create policy "Users can delete own conversations" on conversations
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - Messages
-- ============================================================================
create policy "Users can view own messages" on messages
  for select using (auth.uid() = user_id);

create policy "Users can insert own messages" on messages
  for insert with check (auth.uid() = user_id);

create policy "Users can update own messages" on messages
  for update using (auth.uid() = user_id);

create policy "Users can delete own messages" on messages
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - Calendar Events
-- ============================================================================
create policy "Users can view own calendar events" on calendar_events
  for select using (auth.uid() = user_id);

create policy "Users can insert own calendar events" on calendar_events
  for insert with check (auth.uid() = user_id);

create policy "Users can update own calendar events" on calendar_events
  for update using (auth.uid() = user_id);

create policy "Users can delete own calendar events" on calendar_events
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
create index if not exists idx_tasks_user_id on tasks(user_id);
create index if not exists idx_tasks_due_date on tasks(due_date);
create index if not exists idx_tasks_completed on tasks(completed);
create index if not exists idx_tasks_priority on tasks(priority);

create index if not exists idx_agents_user_id on agents(user_id);
create index if not exists idx_agents_status on agents(status);

create index if not exists idx_conversations_user_id on conversations(user_id);
create index if not exists idx_conversations_created_at on conversations(created_at);

create index if not exists idx_messages_user_id on messages(user_id);
create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_messages_created_at on messages(created_at);

create index if not exists idx_calendar_events_user_id on calendar_events(user_id);
create index if not exists idx_calendar_events_start_time on calendar_events(start_time);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================
-- Reuse the update_updated_at() function from schema.sql if it exists
-- Otherwise create it
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply triggers to tables with updated_at columns
-- Drop existing triggers first to avoid conflicts
drop trigger if exists update_tasks_updated_at on tasks;
drop trigger if exists update_agents_updated_at on agents;
drop trigger if exists update_conversations_updated_at on conversations;

create trigger update_tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

create trigger update_agents_updated_at
  before update on agents
  for each row execute function update_updated_at();

create trigger update_conversations_updated_at
  before update on conversations
  for each row execute function update_updated_at();

-- ============================================================================
-- CLEANUP (optional - uncomment if you need to remove these tables)
-- ============================================================================
/*
drop trigger if exists update_tasks_updated_at on tasks;
drop trigger if exists update_agents_updated_at on agents;
drop trigger if exists update_conversations_updated_at on conversations;

drop table if exists messages;
drop table if exists conversations;
drop table if exists calendar_events;
drop table if exists agents;
drop table if exists tasks;
*/
