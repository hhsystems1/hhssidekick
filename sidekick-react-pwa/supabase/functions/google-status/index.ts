import { getUserFromRequest, getAdminClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  try {
    const { user } = await getUserFromRequest(req);
    if (!user) {
      return new Response(JSON.stringify({ connected: false }), { status: 401 });
    }

    const admin = getAdminClient();
    const { data } = await admin
      .from('connector_integrations')
      .select('status, scopes, expires_at')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (!data) {
      return new Response(JSON.stringify({ connected: false }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        connected: data.status === 'connected',
        scopes: data.scopes || [],
        expires_at: data.expires_at,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
});
