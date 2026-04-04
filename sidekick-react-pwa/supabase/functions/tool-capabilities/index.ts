import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getUserFromRequest } from '../_shared/supabase.ts';
import { listCapabilityStatuses } from '../_shared/capabilities.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const { user } = await getUserFromRequest(req);
    if (!user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const capabilities = await listCapabilityStatuses(user.id);
    return jsonResponse({ capabilities });
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
