-- Projects + context

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  repo_url text,
  deploy_target text,
  approvals_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_memory (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id)
);

alter table public.projects enable row level security;
alter table public.project_memory enable row level security;

create policy "projects_read" on public.projects
  for select
  using (auth.uid() = user_id);

create policy "projects_write" on public.projects
  for insert
  with check (auth.uid() = user_id);

create policy "projects_update" on public.projects
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "project_memory_read" on public.project_memory
  for select
  using (auth.uid() = (select user_id from public.projects where id = project_id));

create policy "project_memory_write" on public.project_memory
  for insert
  with check (auth.uid() = (select user_id from public.projects where id = project_id));

create policy "project_memory_update" on public.project_memory
  for update
  using (auth.uid() = (select user_id from public.projects where id = project_id))
  with check (auth.uid() = (select user_id from public.projects where id = project_id));
