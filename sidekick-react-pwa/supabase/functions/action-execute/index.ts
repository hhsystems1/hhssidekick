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
    const actionId = body.action_id as string | undefined;
    if (!actionId) {
      return new Response(JSON.stringify({ error: 'action_id required' }), { status: 400 });
    }

    const admin = getAdminClient();
    const { data: action, error } = await admin
      .from('action_requests')
      .select('*')
      .eq('id', actionId)
      .eq('user_id', user.id)
      .single();

    if (error || !action) {
      return new Response(JSON.stringify({ error: 'Action not found' }), { status: 404 });
    }

    if (action.status !== 'approved') {
      return new Response(JSON.stringify({ error: 'Action not approved' }), { status: 400 });
    }

    const { data: execData, error: execError } = await admin.functions.invoke('google-actions', {
      body: {
        action_type: action.action_type,
        params: action.params,
      },
      headers: {
        Authorization: req.headers.get('Authorization') || '',
      },
    });

    if (execError) {
      await admin.from('action_requests').update({
        status: 'failed',
        error: execError.message,
        executed_at: new Date().toISOString(),
      }).eq('id', actionId);
      return new Response(JSON.stringify({ error: execError.message }), { status: 500 });
    }

    await admin.from('action_requests').update({
      status: 'executed',
      executed_at: new Date().toISOString(),
    }).eq('id', actionId);

    return new Response(JSON.stringify({ success: true, result: execData }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
});
