import { executeCapabilityAction } from '../_shared/capability-executor.ts';
import {
  normalizeCapabilityInstruction,
  type JobActionType,
} from '../_shared/capability-instruction.ts';
import { getAdminClient } from '../_shared/supabase.ts';

const MAX_JOBS = 5;

async function runJob(job: Record<string, any>) {
  const payload = normalizeJobPayload((job.payload || {}) as Record<string, any>);

  if (payload.action_id) {
    const admin = getAdminClient();
    const { data: action, error } = await admin
      .from('action_requests')
      .select('*')
      .eq('id', payload.action_id)
      .eq('user_id', job.user_id)
      .single();

    if (error || !action) {
      throw new Error('Linked action request not found');
    }

    if (action.status !== 'approved') {
      throw new Error('Linked action request is not approved');
    }

    const execution = await executeCapabilityAction(job.user_id, action.action_type, action.params || {});

    await admin.from('action_requests').update({
      status: 'executed',
      executed_at: new Date().toISOString(),
      error: null,
    }).eq('id', action.id);

    return {
      mode: 'action_request',
      action_id: action.id,
      ...execution,
    };
  }

  if (payload.capability_action) {
    const execution = await executeCapabilityAction(
      job.user_id,
      String(payload.capability_action),
      (payload.params || {}) as Record<string, unknown>
    );

    return {
      mode: 'capability_action',
      ...execution,
    };
  }

  if (payload.reason === 'manual_run') {
    return {
      mode: 'manual_run',
      message: 'Agent runner is live, but this job did not include an executable capability action.',
      next_step:
        'Enqueue a job with payload.capability_action and either payload.params or payload.capability_instruction.',
    };
  }

  throw new Error('No executable payload found');
}

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
      const payload = (job.payload || {}) as Record<string, any>;
      const isLocalCodeJob =
        typeof payload.capability_action === 'string' && payload.capability_action.startsWith('code.');
      if (isLocalCodeJob) {
        results.push({ id: job.id, status: 'skipped', reason: 'local_worker_required' });
        continue;
      }

      const startedAt = new Date().toISOString();

      await admin.from('agent_jobs').update({
        status: 'running',
        started_at: startedAt,
      }).eq('id', job.id);

      try {
        const result = await runJob(job);
        const finishedAt = new Date().toISOString();

        await admin.from('agent_jobs').update({
          status: 'completed',
          finished_at: finishedAt,
          result,
          error: null,
        }).eq('id', job.id);

        await admin.from('agents').update({
          last_run: finishedAt,
        }).eq('id', job.agent_id);

        results.push({ id: job.id, status: 'completed' });
      } catch (error) {
        const finishedAt = new Date().toISOString();

        await admin.from('agent_jobs').update({
          status: 'failed',
          finished_at: finishedAt,
          error: (error as Error).message,
        }).eq('id', job.id);

        results.push({ id: job.id, status: 'failed', error: (error as Error).message });
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
});

function normalizeJobPayload(payload: Record<string, unknown>) {
  const nextPayload = { ...payload } as Record<string, unknown>;
  const action = typeof nextPayload.capability_action === 'string'
    ? (nextPayload.capability_action as JobActionType)
    : null;
  const instruction = typeof nextPayload.capability_instruction === 'string'
    ? nextPayload.capability_instruction
    : null;
  const existingParams = nextPayload.params;

  if (!action || !instruction || (existingParams && typeof existingParams === 'object')) {
    return nextPayload;
  }

  const timeZone = typeof nextPayload.capability_timezone === 'string'
    ? nextPayload.capability_timezone
    : 'UTC';
  nextPayload.params = normalizeCapabilityInstruction(action, instruction, timeZone);
  nextPayload.normalized_from_instruction = true;
  return nextPayload;
}
