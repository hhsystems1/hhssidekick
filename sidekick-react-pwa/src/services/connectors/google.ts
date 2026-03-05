import { supabase } from '../../lib/supabaseClient';

async function getValidAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  // Validate current token against auth service before using it for edge calls.
  const { data: userData, error: userErr } = await supabase.auth.getUser(session.access_token);
  if (userData.user && !userErr) {
    return session.access_token;
  }

  // Fallback: try refresh once and validate again.
  const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
  if (refreshErr || !refreshed.session?.access_token) return null;

  const { data: refreshedUser, error: refreshedUserErr } = await supabase.auth.getUser(refreshed.session.access_token);
  if (!refreshedUser.user || refreshedUserErr) return null;

  return refreshed.session.access_token;
}

export async function getGoogleStatus() {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return { connected: false } as const;
  }

  const { data, error } = await supabase.functions.invoke('google-status', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (error) {
    return { connected: false, error: error.message } as const;
  }
  return data as { connected: boolean; scopes?: string[]; expires_at?: string };
}

export async function startGoogleConnect(redirectTo: string) {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return { url: null, error: 'No active session. Please sign in again.' } as const;
  }

  const { data, error } = await supabase.functions.invoke('google-connect', {
    method: 'POST',
    body: { redirect_to: redirectTo },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (error) {
    return { url: null, error: error.message } as const;
  }

  return { url: data.url as string, error: null } as const;
}

export async function disconnectGoogle() {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    return { success: false, error: 'No active session. Please sign in again.' } as const;
  }

  const { data, error } = await supabase.functions.invoke('google-disconnect', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (error) {
    return { success: false, error: error.message } as const;
  }
  return { success: !!data?.success, error: null } as const;
}
