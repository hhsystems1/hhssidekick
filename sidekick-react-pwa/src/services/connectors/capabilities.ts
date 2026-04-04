import { supabase } from '../../lib/supabaseClient';

export type CapabilityAuthKind = 'oauth' | 'api_key' | 'local';

export interface CapabilityStatus {
  id: string;
  provider: string;
  title: string;
  description: string;
  authKind: CapabilityAuthKind;
  actions: string[];
  connected: boolean;
  configured: boolean;
  connectionLabel?: string | null;
  expiresAt?: string | null;
  missingScopes?: string[];
}

export async function listToolCapabilities() {
  const { data, error } = await supabase.functions.invoke('tool-capabilities', {
    method: 'GET',
  });

  if (error) {
    return { capabilities: [] as CapabilityStatus[], error: error.message };
  }

  return {
    capabilities: (data?.capabilities || []) as CapabilityStatus[],
    error: null,
  };
}

export async function saveToolCredential(
  provider: string,
  secret: string,
  label?: string,
  config?: Record<string, unknown>
) {
  const { data, error } = await supabase.functions.invoke('tool-credential-upsert', {
    method: 'POST',
    body: { provider, secret, label, config },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: !!data?.success, error: null };
}
