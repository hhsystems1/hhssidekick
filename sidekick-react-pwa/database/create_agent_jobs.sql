-- Agent runner jobs (Phase 1)

create table if not exists public.agent_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  agent_id uuid not null references public.agents (id) on delete cascade,
  status text not null default 'queued',
  payload jsonb default '{}'::jsonb,
  scheduled_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  result jsonb,
  error text,
  created_at timestamptz not null default now()
);

alter table public.agent_jobs enable row level security;

create policy "agent_jobs_read" on public.agent_jobs
  for select
  using (auth.uid() = user_id);

create policy "agent_jobs_insert" on public.agent_jobs
  for insert
  with check (auth.uid() = user_id);
