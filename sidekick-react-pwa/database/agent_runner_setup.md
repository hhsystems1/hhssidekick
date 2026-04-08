# Agent Runner Setup (MVP)

1) Run SQL
- Execute `database/create_agent_jobs.sql` in Supabase SQL editor.

2) Deploy Edge Functions
```bash
supabase functions deploy agent-enqueue
supabase functions deploy agent-runner
```

Notes as of 2026-04-07:
- `agent-enqueue` now accepts `payload.capability_instruction` and normalizes it into `payload.params`
- `agent-runner` can also normalize `payload.capability_instruction` at execution time as a fallback
- if you use local `code.exec` jobs, restart `workers/local-agent-runner.mjs` after pulling the latest changes so raw instruction parsing is live there too

3) Schedule Runner (Supabase Cron)
Supabase Dashboard → Edge Functions → Scheduled triggers:
- Function: `agent-runner`
- Interval: every 1–5 minutes

4) Run Now
On the Agents page, use **Run Now** to enqueue a job.
- You can now describe jobs in plain English or with `field: value` lines instead of raw JSON.
