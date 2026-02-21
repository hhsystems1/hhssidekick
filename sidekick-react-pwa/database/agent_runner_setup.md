# Agent Runner Setup (MVP)

1) Run SQL
- Execute `database/create_agent_jobs.sql` in Supabase SQL editor.

2) Deploy Edge Functions
```bash
supabase functions deploy agent-enqueue
supabase functions deploy agent-runner
```

3) Schedule Runner (Supabase Cron)
Supabase Dashboard → Edge Functions → Scheduled triggers:
- Function: `agent-runner`
- Interval: every 1–5 minutes

4) Run Now
On the Agents page, use **Run Now** to enqueue a job.
