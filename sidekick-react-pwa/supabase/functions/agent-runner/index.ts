import { getAdminClient } from '../_shared/supabase.ts';

const MAX_JOBS = 5;

Deno.serve(async () => {
  try {
    const admin = getAdminClient();

    const { data: jobs, error } = await admin
      .from('agent_jobs')
      .select('*')
      .eq('status', 'queued')
      .order('scheduled_at', { ascending: true })
      .limit(MAX_JOBS);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    const results = [];

    for (const job of jobs || []) {
      const startedAt = new Date().toISOString();

      await admin.from('agent_jobs').update({
        status: 'running',
        started_at: startedAt,
      }).eq('id', job.id);

      // TODO: Replace with real agent execution
      const finishedAt = new Date().toISOString();

      await admin.from('agent_jobs').update({
        status: 'completed',
        finished_at: finishedAt,
        result: { message: 'Agent run completed (stub)' },
      }).eq('id', job.id);

      // Update agent metric as a heartbeat
      await admin.from('agents').update({
        last_run: finishedAt,
      }).eq('id', job.agent_id);

      results.push({ id: job.id, status: 'completed' });
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
});
