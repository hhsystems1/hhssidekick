-- Connector framework tables (Phase 1)

create table if not exists public.connector_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  status text not null default 'connected',
  scopes text[] default '{}',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.connector_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  access_token_enc text not null,
  refresh_token_enc text,
  token_type text,
  scope text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.connector_oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  state text not null,
  redirect_to text,
  created_at timestamptz not null default now()
);

create table if not exists public.connector_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  action text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.connector_integrations enable row level security;
alter table public.connector_tokens enable row level security;
alter table public.connector_oauth_states enable row level security;
alter table public.connector_audit_logs enable row level security;

-- Users can read their own integration status
create policy "connector_integrations_read" on public.connector_integrations
  for select
  using (auth.uid() = user_id);

-- Only service role should read/write tokens and oauth states
create policy "connector_tokens_no_access" on public.connector_tokens
  for all
  using (false)
  with check (false);

create policy "connector_oauth_states_no_access" on public.connector_oauth_states
  for all
  using (false)
  with check (false);

create policy "connector_audit_logs_read" on public.connector_audit_logs
  for select
  using (auth.uid() = user_id);
