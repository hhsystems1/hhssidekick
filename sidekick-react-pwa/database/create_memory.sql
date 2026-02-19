-- Memory tables (shared base + per-agent overlays)

create table if not exists public.user_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.agent_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  agent_type text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, agent_type)
);

create table if not exists public.memory_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scope text not null,
  action text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.user_memory enable row level security;
alter table public.agent_memory enable row level security;
alter table public.memory_audit_logs enable row level security;

create policy "user_memory_read" on public.user_memory
  for select
  using (auth.uid() = user_id);

create policy "user_memory_write" on public.user_memory
  for insert
  with check (auth.uid() = user_id);

create policy "user_memory_update" on public.user_memory
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "agent_memory_read" on public.agent_memory
  for select
  using (auth.uid() = user_id);

create policy "agent_memory_write" on public.agent_memory
  for insert
  with check (auth.uid() = user_id);

create policy "agent_memory_update" on public.agent_memory
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "memory_audit_logs_read" on public.memory_audit_logs
  for select
  using (auth.uid() = user_id);

create policy "memory_audit_logs_write" on public.memory_audit_logs
  for insert
  with check (auth.uid() = user_id);
