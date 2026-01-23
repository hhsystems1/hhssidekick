-- Create PROFILES table
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  timezone text,
  preferences jsonb default '{"notifications": {"push": true, "email": true, "taskReminders": true}, "appearance": {"theme": "system", "fontSize": "medium"}, "privacy": {"twoFactorEnabled": false, "shareAnalytics": true}}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Create USER_SETTINGS table
create table if not exists user_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  push_notifications boolean default true,
  email_notifications boolean default true,
  task_reminders boolean default true,
  two_factor_enabled boolean default false,
  theme text default 'system',
  language text default 'en',
  font_size text default 'medium',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_settings enable row level security;

create policy "Users can manage their own settings" on user_settings
  for all using (auth.uid() = user_id);

-- Create a trigger to automatically create a profile for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
