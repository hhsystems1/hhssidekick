import { getAdminClient, getUserFromRequest } from '../_shared/supabase.ts';
import { decryptText } from '../_shared/crypto.ts';

async function getAccessToken(userId: string) {
  const admin = getAdminClient();
  const encryptionKey = Deno.env.get('CONNECTOR_ENCRYPTION_KEY');
  if (!encryptionKey) throw new Error('Missing encryption key');

  const { data, error } = await admin
    .from('connector_tokens')
    .select('access_token_enc')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  if (error || !data) throw new Error('Google not connected');
  return await decryptText(data.access_token_enc, encryptionKey);
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
