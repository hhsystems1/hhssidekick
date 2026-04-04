-- Generic encrypted API-key storage for agent capabilities

create table if not exists public.tool_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  label text,
  secret_enc text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.tool_credentials enable row level security;

create policy "tool_credentials_no_access" on public.tool_credentials
  for all
  using (false)
  with check (false);
