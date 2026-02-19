# Connectors Setup (Phase 1: Google)

1) Run SQL
- Execute `database/create_connectors.sql` in Supabase SQL editor.

2) Edge Function Secrets
Set these in Supabase → Project Settings → Functions → Secrets:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URL` (e.g. `https://YOUR_PROJECT.functions.supabase.co/google-callback`)
- `CONNECTOR_ENCRYPTION_KEY` (base64 32-byte key)

Generate encryption key (run locally):
```bash
openssl rand -base64 32
```

3) Deploy Functions
Use Supabase CLI:
```bash
supabase functions deploy google-connect
supabase functions deploy google-callback
supabase functions deploy google-status
supabase functions deploy google-disconnect
```

4) Google OAuth Setup (Shared Redirect)
In Google Cloud Console:
- Enable Gmail API + Drive API
- Create one OAuth client (Web app) owned by your org
- Authorized redirect URI = `GOOGLE_REDIRECT_URL`

Users do not need to create their own OAuth app. Sidekick handles OAuth centrally.

5) Frontend
Navigate to `/integrations` and click **Connect** under Google.
