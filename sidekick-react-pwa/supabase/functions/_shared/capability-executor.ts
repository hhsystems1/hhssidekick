import { decryptText, encryptText } from './crypto.ts';
import { getToolCredential } from './capabilities.ts';
import { getAdminClient } from './supabase.ts';

const GOOGLE_REQUIRED_SCOPES: Record<string, string[]> = {
  'gmail.send': ['https://www.googleapis.com/auth/gmail.send'],
  'calendar.create': ['https://www.googleapis.com/auth/calendar.events'],
};

async function getGoogleAccessToken(userId: string) {
  const admin = getAdminClient();
  const encryptionKey = Deno.env.get('CONNECTOR_ENCRYPTION_KEY');
  if (!encryptionKey) throw new Error('Missing encryption key');

  const { data, error } = await admin
    .from('connector_tokens')
    .select('access_token_enc, refresh_token_enc, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  if (error || !data) throw new Error('Google not connected');

  const expiresAtMs = data.expires_at ? new Date(data.expires_at).getTime() : 0;
  const isExpired = !expiresAtMs || expiresAtMs - Date.now() < 60_000;

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
    throw new Error(`Token refresh failed: ${await tokenRes.text()}`);
  }

  const tokenData = await tokenRes.json();
  const nextAccessTokenEnc = await encryptText(tokenData.access_token, encryptionKey);
  const nextExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

  await admin
    .from('connector_tokens')
    .update({
      access_token_enc: nextAccessTokenEnc,
      expires_at: nextExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('provider', 'google');

  await admin
    .from('connector_integrations')
    .update({
      expires_at: nextExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('provider', 'google');

  return tokenData.access_token as string;
}

async function ensureGoogleScope(userId: string, actionType: string) {
  const requiredScopes = GOOGLE_REQUIRED_SCOPES[actionType] || [];
  if (requiredScopes.length === 0) return;

  const admin = getAdminClient();
  const { data } = await admin
    .from('connector_integrations')
    .select('scopes')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  const scopes = data?.scopes || [];
  const missingScopes = requiredScopes.filter((scope) => !scopes.includes(scope));
  if (missingScopes.length > 0) {
    throw new Error(`Missing Google scopes: ${missingScopes.join(', ')}`);
  }
}

async function executeGoogleAction(userId: string, actionType: string, params: Record<string, unknown>) {
  await ensureGoogleScope(userId, actionType);
  const accessToken = await getGoogleAccessToken(userId);

  if (actionType === 'gmail.send') {
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

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return await response.json();
  }

  if (actionType === 'calendar.create') {
    const raw = { ...params } as Record<string, unknown>;
    const addMeet = raw.addMeet === true || raw.conferenceMeet === true || raw.add_google_meet === true;
    delete raw.addMeet;
    delete raw.conferenceMeet;
    delete raw.add_google_meet;

    let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
    if (addMeet) {
      url += '?conferenceDataVersion=1';
      raw.conferenceData = {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(raw),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return await response.json();
  }

  throw new Error(`Unsupported Google action: ${actionType}`);
}

async function getApiKey(userId: string, provider: string) {
  const credential = await getToolCredential(userId, provider);
  if (!credential) {
    throw new Error(`${provider} is not configured`);
  }

  const encryptionKey = Deno.env.get('CONNECTOR_ENCRYPTION_KEY');
  if (!encryptionKey) throw new Error('Missing encryption key');

  return {
    key: await decryptText(credential.secret_enc, encryptionKey),
    config: (credential.config || {}) as Record<string, unknown>,
    label: credential.label,
  };
}

async function executeGitHubAction(userId: string, actionType: string, params: Record<string, unknown>) {
  const { key } = await getApiKey(userId, 'github');
  const headers = {
    Authorization: `Bearer ${key}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };

  if (actionType === 'github.repo.read') {
    const owner = String(params.owner || '');
    const repo = String(params.repo || '');
    const path = String(params.path || '');
    const ref = params.ref ? `?ref=${encodeURIComponent(String(params.ref))}` : '';
    if (!owner || !repo) {
      throw new Error('owner and repo are required');
    }

    const endpoint = path
      ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}${ref}`
      : `https://api.github.com/repos/${owner}/${repo}`;
    const response = await fetch(endpoint, { headers });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return await response.json();
  }

  if (actionType === 'github.repo.write') {
    const owner = String(params.owner || '');
    const repo = String(params.repo || '');
    const path = String(params.path || '');
    const message = String(params.message || 'Update via RivRyn SideKick');
    const content = String(params.content || '');
    const branch = params.branch ? String(params.branch) : undefined;
    const sha = params.sha ? String(params.sha) : undefined;

    if (!owner || !repo || !path || !content) {
      throw new Error('owner, repo, path, and content are required');
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message,
        content: btoa(unescape(encodeURIComponent(content))),
        branch,
        sha,
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return await response.json();
  }

  throw new Error(`Unsupported GitHub action: ${actionType}`);
}

async function executeRivrynAction(userId: string, actionType: string, params: Record<string, unknown>) {
  const { key, config } = await getApiKey(userId, 'rivryn');
  const baseUrl = String(config.baseUrl || Deno.env.get('RIVRYN_API_BASE_URL') || '');
  if (!baseUrl) {
    throw new Error('Rivryn base URL is not configured');
  }

  const endpoint = String(params.endpoint || '');
  if (!endpoint) {
    throw new Error('Rivryn endpoint is required');
  }

  const method = String(params.method || 'GET').toUpperCase();
  const body = params.body ?? null;

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'X-Sidekick-Action': actionType,
    },
    body: method === 'GET' ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json().catch(() => ({ success: true }));
}

export async function executeCapabilityAction(
  userId: string,
  actionType: string,
  params: Record<string, unknown> = {}
) {
  if (actionType.startsWith('github.')) {
    const result = await executeGitHubAction(userId, actionType, params);
    return { provider: 'github', actionType, result };
  }

  if (actionType.startsWith('rivryn.')) {
    const result = await executeRivrynAction(userId, actionType, params);
    return { provider: 'rivryn', actionType, result };
  }

  if (actionType === 'gmail.send' || actionType === 'calendar.create') {
    const result = await executeGoogleAction(userId, actionType, params);
    return { provider: 'google', actionType, result };
  }

  if (actionType.startsWith('code.')) {
    throw new Error('Local code capabilities require the local RivRyn SideKick worker');
  }

  throw new Error(`Unsupported capability action: ${actionType}`);
}
