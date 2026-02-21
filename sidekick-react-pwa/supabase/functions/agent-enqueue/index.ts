import { getAdminClient, getUserFromRequest } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { user } = await getUserFromRequest(req);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const agentId = body.agent_id as string | undefined;
    const payload = body.payload || {};

    if (!agentId) {
      return new Response(JSON.stringify({ error: 'agent_id required' }), { status: 400 });
    }

    const admin = getAdminClient();
    const { data, error } = await admin.from('agent_jobs').insert({
      user_id: user.id,
      agent_id: agentId,
      status: 'queued',
      payload,
      scheduled_at: new Date().toISOString(),
    }).select().single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, job: data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
});
