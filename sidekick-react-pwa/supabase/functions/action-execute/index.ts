import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { executeCapabilityAction } from '../_shared/capability-executor.ts';
import { getAdminClient, getUserFromRequest } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const { user } = await getUserFromRequest(req);
    if (!user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const actionId = body.action_id as string | undefined;
    if (!actionId) {
      return jsonResponse({ error: 'action_id required' }, 400);
    }

    const admin = getAdminClient();
    const { data: action, error } = await admin
      .from('action_requests')
      .select('*')
      .eq('id', actionId)
      .eq('user_id', user.id)
      .single();

    if (error || !action) {
      return jsonResponse({ error: 'Action not found' }, 404);
    }

    if (action.status !== 'approved') {
      return jsonResponse({ error: 'Action not approved' }, 400);
    }

    let execData;
    try {
      execData = await executeCapabilityAction(user.id, action.action_type, action.params || {});
    } catch (execError) {
      await admin.from('action_requests').update({
        status: 'failed',
        error: (execError as Error).message,
        executed_at: new Date().toISOString(),
      }).eq('id', actionId);
      return jsonResponse({ error: (execError as Error).message }, 500);
    }

    await admin.from('action_requests').update({
      status: 'executed',
      executed_at: new Date().toISOString(),
    }).eq('id', actionId);

    return jsonResponse({ success: true, result: execData });
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
