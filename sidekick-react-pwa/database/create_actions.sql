-- Action requests (approval gate)

create table if not exists public.action_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action_type text not null,
  params jsonb not null default '{}'::jsonb,
  status text not null default 'pending', -- pending | approved | rejected | executed | failed
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  executed_at timestamptz,
  error text
);

alter table public.action_requests enable row level security;

create policy "action_requests_read" on public.action_requests
  for select
  using (auth.uid() = user_id);

create policy "action_requests_write" on public.action_requests
  for insert
  with check (auth.uid() = user_id);

create policy "action_requests_update" on public.action_requests
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
