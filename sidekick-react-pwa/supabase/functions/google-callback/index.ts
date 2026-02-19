import { getAdminClient } from '../_shared/supabase.ts';
import { encryptText } from '../_shared/crypto.ts';

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      return new Response('Missing code/state', { status: 400 });
    }

    const admin = getAdminClient();
    const { data: stateRow } = await admin
      .from('connector_oauth_states')
      .select('*')
      .eq('state', state)
      .single();

    if (!stateRow) {
      return new Response('Invalid state', { status: 400 });
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URL');
    const encryptionKey = Deno.env.get('CONNECTOR_ENCRYPTION_KEY');

    if (!clientId || !clientSecret || !redirectUri || !encryptionKey) {
      return new Response('OAuth not configured', { status: 500 });
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      return new Response(`Token exchange failed: ${body}`, { status: 400 });
    }

    const tokenData = await tokenRes.json();

    const accessTokenEnc = await encryptText(tokenData.access_token, encryptionKey);
    const refreshTokenEnc = tokenData.refresh_token
      ? await encryptText(tokenData.refresh_token, encryptionKey)
      : null;

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    await admin.from('connector_tokens').upsert({
      user_id: stateRow.user_id,
      provider: 'google',
      access_token_enc: accessTokenEnc,
      refresh_token_enc: refreshTokenEnc,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });

    await admin.from('connector_integrations').upsert({
      user_id: stateRow.user_id,
      provider: 'google',
      status: 'connected',
      scopes: tokenData.scope?.split(' ') || [],
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });

    await admin.from('connector_audit_logs').insert({
      user_id: stateRow.user_id,
      provider: 'google',
      action: 'connected',
      metadata: {
        scopes: tokenData.scope?.split(' ') || [],
      },
    });

    await admin.from('connector_oauth_states').delete().eq('state', state);

    const redirectTo = stateRow.redirect_to || url.origin + '/integrations';
    return Response.redirect(redirectTo, 302);
  } catch (error) {
    return new Response(`Callback error: ${(error as Error).message}`, { status: 500 });
  }
});
