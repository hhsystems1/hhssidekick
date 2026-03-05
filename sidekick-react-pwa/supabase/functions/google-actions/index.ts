import { getAdminClient, getUserFromRequest } from '../_shared/supabase.ts';
import { decryptText, encryptText } from '../_shared/crypto.ts';

const REQUIRED_SCOPES: Record<string, string[]> = {
  'gmail.send': ['https://www.googleapis.com/auth/gmail.send'],
  'calendar.create': ['https://www.googleapis.com/auth/calendar.events'],
};

async function getAccessToken(userId: string) {
  const admin = getAdminClient();
  const encryptionKey = Deno.env.get('CONNECTOR_ENCRYPTION_KEY');
  if (!encryptionKey) throw new Error('Missing encryption key');

  const { data, error } = await admin
    .from('connector_tokens')
    .select('access_token_enc, refresh_token_enc, expires_at, scope')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  if (error || !data) throw new Error('Google not connected');

  const nowMs = Date.now();
  const expiresAtMs = data.expires_at ? new Date(data.expires_at).getTime() : 0;
  const isExpired = !expiresAtMs || expiresAtMs - nowMs < 60_000;

  if (!isExpired) {
    return await decryptText(data.access_token_enc, encryptionKey);
  }

  if (!data.refresh_token_enc) {
    throw new Error('Google token expired. Please reconnect.');
  }

  const refreshToken = await decryptText(data.refresh_token_enc, encryptionKey);
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error('OAuth not configured');
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Token refresh failed: ${errText}`);
  }

  const tokenData = await tokenRes.json();
  const nextAccessTokenEnc = await encryptText(tokenData.access_token, encryptionKey);
  const nextExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

  await admin.from('connector_tokens').update({
    access_token_enc: nextAccessTokenEnc,
    expires_at: nextExpiresAt,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId).eq('provider', 'google');

  await admin.from('connector_integrations').update({
    expires_at: nextExpiresAt,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId).eq('provider', 'google');

  return tokenData.access_token as string;
}

async function ensureScope(userId: string, actionType: string) {
  const required = REQUIRED_SCOPES[actionType] || [];
  if (required.length === 0) return;

  const admin = getAdminClient();
  const { data } = await admin
    .from('connector_integrations')
    .select('scopes')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  const scopes = data?.scopes || [];
  const missing = required.filter((scope) => !scopes.includes(scope));
  if (missing.length > 0) {
    throw new Error(`Missing Google scopes: ${missing.join(', ')}`);
  }
}

async function sendGmail(accessToken: string, params: any) {
  const { to, subject, body } = params;
  const message = [
    `To: ${to}`,
    'Content-Type: text/plain; charset="UTF-8"',
    `Subject: ${subject}`,
    '',
    body,
  ].join('\n');

  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  return await res.json();
}

async function createCalendarEvent(accessToken: string, params: any) {
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  return await res.json();
}

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

    await ensureScope(user.id, actionType);
    const accessToken = await getAccessToken(user.id);

    let result: any;
    if (actionType === 'gmail.send') {
      result = await sendGmail(accessToken, params);
    } else if (actionType === 'calendar.create') {
      result = await createCalendarEvent(accessToken, params);
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported action' }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
});
