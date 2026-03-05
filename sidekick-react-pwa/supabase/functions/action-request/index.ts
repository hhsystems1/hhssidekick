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
    const actionType = body.action_type as string | undefined;
    const params = body.params || {};

    if (!actionType) {
      return jsonResponse({ error: 'action_type required' }, 400);
    }

    const admin = getAdminClient();
    const { data, error } = await admin
      .from('action_requests')
      .insert({
        user_id: user.id,
        action_type: actionType,
        params,
        status: 'pending',
      })
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
