-- Project daily log for agent coordination

create table if not exists public.project_daily_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  log_date date not null default current_date,
  summary text not null default '',
  tasks text not null default '',
  audits text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, log_date)
);

alter table public.project_daily_log enable row level security;

create policy "project_daily_log_read" on public.project_daily_log
  for select
  using (auth.uid() = (select user_id from public.projects where id = project_id));

create policy "project_daily_log_write" on public.project_daily_log
  for insert
  with check (auth.uid() = (select user_id from public.projects where id = project_id));

create policy "project_daily_log_update" on public.project_daily_log
  for update
  using (auth.uid() = (select user_id from public.projects where id = project_id))
  with check (auth.uid() = (select user_id from public.projects where id = project_id));
