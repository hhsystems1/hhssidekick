import { supabase } from '../../lib/supabaseClient';

export async function getGoogleStatus() {
  const { data, error } = await supabase.functions.invoke('google-status');
  if (error) {
    return { connected: false, error: error.message } as const;
  }
  return data as { connected: boolean; scopes?: string[]; expires_at?: string };
}

export async function startGoogleConnect(redirectTo: string) {
  const { data, error } = await supabase.functions.invoke('google-connect', {
    method: 'POST',
    body: { redirect_to: redirectTo },
  });

  if (error) {
    return { url: null, error: error.message } as const;
  }

  return { url: data.url as string, error: null } as const;
}

export async function disconnectGoogle() {
  const { data, error } = await supabase.functions.invoke('google-disconnect');
  if (error) {
    return { success: false, error: error.message } as const;
  }
  return { success: !!data?.success, error: null } as const;
}
