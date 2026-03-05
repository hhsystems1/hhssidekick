import { getAdminClient, getUserFromRequest } from '../_shared/supabase.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar.events',
];

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

    let redirectTo = '';
    const body = await req.json().catch(() => ({}));
    redirectTo = body.redirect_to || '';
    if (!redirectTo) {
      const url = new URL(req.url);
      redirectTo = url.origin + '/integrations';
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URL');

    if (!clientId || !redirectUri) {
      return jsonResponse({ error: 'Google OAuth not configured' }, 500);
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
      return jsonResponse({ error: 'Failed to create OAuth state' }, 500);
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', GOOGLE_SCOPES.join(' '));
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', state);

    return jsonResponse({ url: authUrl.toString() });
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
