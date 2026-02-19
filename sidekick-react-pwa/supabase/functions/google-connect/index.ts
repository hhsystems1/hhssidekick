import { getAdminClient, getUserFromRequest } from '../_shared/supabase.ts';

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
];

Deno.serve(async (req) => {
  try {
    const { user } = await getUserFromRequest(req);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    let redirectTo = '';
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      redirectTo = body.redirect_to || '';
    }
    if (!redirectTo) {
      const url = new URL(req.url);
      redirectTo = url.origin + '/integrations';
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URL');

    if (!clientId || !redirectUri) {
      return new Response(JSON.stringify({ error: 'Google OAuth not configured' }), { status: 500 });
    }

    const state = crypto.randomUUID();
    const admin = getAdminClient();

    const { error } = await admin.from('connector_oauth_states').insert({
      user_id: user.id,
      provider: 'google',
      state,
      redirect_to: redirectTo,
    });
    if (error) {
      return new Response(JSON.stringify({ error: 'Failed to create OAuth state' }), { status: 500 });
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', GOOGLE_SCOPES.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    return new Response(JSON.stringify({ url: authUrl.toString() }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
});
