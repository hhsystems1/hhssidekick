# Action Approval Setup

1) Run SQL
- Execute `database/create_actions.sql` in Supabase SQL editor.

2) Deploy Edge Functions
```bash
supabase functions deploy action-request
supabase functions deploy action-approve
supabase functions deploy action-reject
```

3) Approvals UI
Pending actions appear in Settings → Pending Actions.
