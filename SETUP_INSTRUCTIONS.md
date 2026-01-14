# Sidekick Setup Instructions

## Issue: Database Not Set Up

You're seeing errors because:
1. You're not logged in (using MOCK_USER_ID)
2. Database tables (`profiles`, `user_settings`) don't exist yet
3. Row Level Security (RLS) policies require authentication

## Solution Steps:

### Step 1: Set Up Supabase Database

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `/database/schema.sql`
4. Paste and run it in the SQL Editor
5. Wait for "Success. No rows returned" message

This will create all tables: tasks, agents, conversations, messages, profiles, user_settings, calendar_events

### Step 2: Sign Up / Log In

1. Open your deployed app
2. Click **"Sign In"** button in the sidebar
3. Choose **"Sign Up"** tab
4. Enter an email and password (minimum 6 characters)
5. Click "Sign Up"

A profile and settings will be automatically created for you!

### Step 3: Try Creating Tasks/Agents

Now you should be able to:
- ✅ Add tasks (+ Task button)
- ✅ Add focus items
- ✅ Deploy agents (+ Deploy New Agent)
- ✅ Chat with AI

## Troubleshooting

**Still seeing errors?**
1. Check browser console (F12) for specific error messages
2. Verify you're logged in (should see your email in sidebar)
3. Confirm database schema was applied successfully in Supabase

**Tables already exist?**
The schema uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times.

**Need to reset?**
To start fresh, drop all tables in Supabase SQL Editor:
```sql
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
```

Then re-run the schema.sql file.
