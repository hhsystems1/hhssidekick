import { executeCapabilityAction } from '../_shared/capability-executor.ts';
import { getUserFromRequest } from '../_shared/supabase.ts';

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
    const actionType = body.action_type as string | undefined;
    const params = body.params || {};

    if (!actionType) {
      return new Response(JSON.stringify({ error: 'action_type required' }), { status: 400 });
    }

    const result = await executeCapabilityAction(user.id, actionType, params);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
});
