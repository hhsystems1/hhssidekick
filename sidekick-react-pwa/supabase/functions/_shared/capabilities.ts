import { getAdminClient } from './supabase.ts';

export type CapabilityAuthKind = 'oauth' | 'api_key' | 'local';

export interface CapabilityDefinition {
  id: string;
  provider: string;
  title: string;
  description: string;
  authKind: CapabilityAuthKind;
  requiredScopes?: string[];
  actions: string[];
}

export interface CapabilityStatus extends CapabilityDefinition {
  connected: boolean;
  configured: boolean;
  connectionLabel?: string | null;
  expiresAt?: string | null;
  missingScopes?: string[];
}

export const CAPABILITY_REGISTRY: CapabilityDefinition[] = [
  {
    id: 'google.gmail.send',
    provider: 'google',
    title: 'Google Gmail',
    description: 'Send email drafts and outbound messages.',
    authKind: 'oauth',
    requiredScopes: ['https://www.googleapis.com/auth/gmail.send'],
    actions: ['gmail.send'],
  },
  {
    id: 'google.calendar.create',
    provider: 'google',
    title: 'Google Calendar',
    description: 'Create and update calendar events.',
    authKind: 'oauth',
    requiredScopes: ['https://www.googleapis.com/auth/calendar.events'],
    actions: ['calendar.create'],
  },
  {
    id: 'github.repo',
    provider: 'github',
    title: 'GitHub',
    description: 'Read repos, issues, pull requests, and code.',
    authKind: 'api_key',
    actions: ['github.repo.read', 'github.repo.write'],
  },
  {
    id: 'rivryn.project',
    provider: 'rivryn',
    title: 'Rivryn',
    description: 'Access Rivryn projects, environments, and app setup.',
    authKind: 'api_key',
    actions: ['rivryn.project.read', 'rivryn.project.write'],
  },
  {
    id: 'local.code.runner',
    provider: 'local',
    title: 'Workspace Code Runner',
    description: 'Inspect code, edit files, and run trusted workspace tasks.',
    authKind: 'local',
    actions: ['code.read', 'code.write', 'code.exec'],
  },
];

export async function listCapabilityStatuses(userId: string): Promise<CapabilityStatus[]> {
  const admin = getAdminClient();

  const [{ data: integrations }, { data: credentials }] = await Promise.all([
    admin
      .from('connector_integrations')
      .select('provider, scopes, expires_at, status')
      .eq('user_id', userId),
    admin
      .from('tool_credentials')
      .select('provider, label, updated_at')
      .eq('user_id', userId),
  ]);

  return CAPABILITY_REGISTRY.map((capability) => {
    if (capability.authKind === 'oauth') {
      const integration = integrations?.find(
        (item) => item.provider === capability.provider && item.status === 'connected'
      );
      const scopes = integration?.scopes || [];
      const requiredScopes = capability.requiredScopes || [];
      const missingScopes = requiredScopes.filter((scope) => !scopes.includes(scope));

      return {
        ...capability,
        connected: !!integration && missingScopes.length === 0,
        configured: !!integration,
        expiresAt: integration?.expires_at || null,
        missingScopes,
      };
    }

    if (capability.authKind === 'api_key') {
      const credential = credentials?.find((item) => item.provider === capability.provider);
      return {
        ...capability,
        connected: !!credential,
        configured: !!credential,
        connectionLabel: credential?.label || null,
      };
    }

    return {
      ...capability,
      connected: true,
      configured: true,
      connectionLabel: 'Trusted workspace',
    };
  });
}

export async function getToolCredential(userId: string, provider: string) {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('tool_credentials')
    .select('provider, label, secret_enc, config, updated_at')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();

  if (error) {
    return null;
  }

  return data;
}
