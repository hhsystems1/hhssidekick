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
    const { data, error } = await admin
      .from('action_requests')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', actionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, action: data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
});
