import { getAdminClient, getUserFromRequest } from '../_shared/supabase.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';

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
    const { data, error } = await admin
      .from('action_requests')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', actionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ success: true, action: data });
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
