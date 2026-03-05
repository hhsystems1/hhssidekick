import { getUserFromRequest, getAdminClient } from '../_shared/supabase.ts';
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
      return jsonResponse({ connected: false });
    }

    const admin = getAdminClient();
    const { data } = await admin
      .from('connector_integrations')
      .select('status, scopes, expires_at')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (!data) {
      return jsonResponse({ connected: false });
    }

    return jsonResponse({
      connected: data.status === 'connected',
      scopes: data.scopes || [],
      expires_at: data.expires_at,
    });
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
