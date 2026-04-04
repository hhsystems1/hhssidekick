/**
 * IntegrationsPage Component
 * Connect external accounts (GitHub, Google)
 */

import React, { useEffect, useState } from 'react';
import { Github, Mail, Calendar, Cloud, Shield, CheckCircle2, TerminalSquare, KeyRound } from 'lucide-react';
import { getGoogleStatus, startGoogleConnect, disconnectGoogle } from '../services/connectors/google';
import { listToolCapabilities, saveToolCredential, type CapabilityStatus } from '../services/connectors/capabilities';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface IntegrationCardProps {
  title: string;
  description: string;
  status: 'connected' | 'not_connected';
  ctaLabel: string;
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  title,
  description,
  status,
  ctaLabel,
  onClick,
  icon,
  disabled = false,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center gap-3">
        <div className="text-emerald-400">{icon}</div>
        <div>
          <p className="text-lg font-semibold text-slate-100">{title}</p>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="text-xs text-slate-500">
          {status === 'connected' ? (
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <CheckCircle2 size={12} /> Connected
            </span>
          ) : (
            <span>Not connected</span>
          )}
        </div>
        <button
          onClick={onClick}
          disabled={disabled}
          className="px-3 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm hover:border-slate-500"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
};

export const IntegrationsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [capabilities, setCapabilities] = useState<CapabilityStatus[]>([]);
  const [capabilitiesLoading, setCapabilitiesLoading] = useState(false);
  const [sessionPresent, setSessionPresent] = useState(false);
  const [tokenRef, setTokenRef] = useState<string | null>(null);
  const [credentialModalProvider, setCredentialModalProvider] = useState<string | null>(null);
  const [credentialLabel, setCredentialLabel] = useState('');
  const [credentialSecret, setCredentialSecret] = useState('');
  const [savingCredential, setSavingCredential] = useState(false);

  const loadStatus = async () => {
    const status = await getGoogleStatus();
    setGoogleConnected(!!status.connected);
  };

  const loadCapabilities = async () => {
    setCapabilitiesLoading(true);
    const result = await listToolCapabilities();
    if (result.error) {
      toast.error(result.error);
      setCapabilities([]);
    } else {
      setCapabilities(result.capabilities);
    }
    setCapabilitiesLoading(false);
  };

  useEffect(() => {
    if (!user) {
      setGoogleConnected(false);
      setCapabilities([]);
      return;
    }
    loadStatus();
    loadCapabilities();
  }, [user]);

  useEffect(() => {
    const inspectSession = async () => {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      setSessionPresent(!!accessToken);
      if (!accessToken) {
        setTokenRef(null);
        return;
      }
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        setTokenRef(payload?.ref || null);
      } catch {
        setTokenRef(null);
      }
    };
    inspectSession();
  }, [user, authLoading]);

  const groupedCapabilities = capabilities.reduce<Record<string, CapabilityStatus[]>>((groups, capability) => {
    if (!groups[capability.provider]) {
      groups[capability.provider] = [];
    }
    groups[capability.provider].push(capability);
    return groups;
  }, {});

  const providerSummaries = Object.values(groupedCapabilities).map((group) => {
    const first = group[0];
    return {
      provider: first.provider,
      title: first.title,
      description: group.map((item) => item.description).join(' '),
      authKind: first.authKind,
      connected: group.some((item) => item.connected),
      configured: group.some((item) => item.configured),
      missingScopes: group.flatMap((item) => item.missingScopes || []),
      connectionLabel: group.find((item) => item.connectionLabel)?.connectionLabel || null,
    };
  });

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'github':
        return <Github size={22} />;
      case 'google':
        return <Mail size={22} />;
      case 'rivryn':
        return <KeyRound size={22} />;
      case 'local':
        return <TerminalSquare size={22} />;
      default:
        return <Cloud size={22} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-slate-400">Connect Sidekick to your tools.</p>
          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-400">
            Auth debug: user `{user?.id ? 'present' : 'missing'}` | session token `{sessionPresent ? 'present' : 'missing'}` | token ref `{tokenRef || 'n/a'}`
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providerSummaries.map((provider) => (
            <div key={provider.provider} className="space-y-2">
              <IntegrationCard
                title={provider.title}
                description={provider.description}
                status={provider.connected ? 'connected' : 'not_connected'}
                ctaLabel={
                  !user
                    ? 'Sign In Required'
                    : provider.provider === 'google'
                      ? googleLoading
                        ? 'Connecting...'
                        : googleConnected && provider.missingScopes.length === 0
                          ? 'Disconnect'
                          : googleConnected
                            ? 'Upgrade Access'
                            : 'Connect'
                      : provider.authKind === 'api_key'
                        ? provider.connected
                          ? 'Update Key'
                          : 'Add API Key'
                        : 'Available'
                }
                onClick={async () => {
                  if (!user) {
                    toast.error('Sign in first to connect tools.');
                    return;
                  }

                  if (provider.provider === 'google') {
                    if (googleLoading) return;
                    if (googleConnected && provider.missingScopes.length === 0) {
                      setGoogleLoading(true);
                      const res = await disconnectGoogle();
                      setGoogleLoading(false);
                      if (res.success) {
                        toast.success('Google disconnected');
                        setGoogleConnected(false);
                        loadCapabilities();
                      } else {
                        toast.error(res.error || 'Failed to disconnect');
                      }
                      return;
                    }

                    setGoogleLoading(true);
                    const res = await startGoogleConnect(`${window.location.origin}/integrations`);
                    setGoogleLoading(false);
                    if (res.url) {
                      window.location.href = res.url;
                    } else {
                      toast.error(res.error || 'Failed to start Google connect');
                    }
                    return;
                  }

                  if (provider.authKind === 'api_key') {
                    setCredentialModalProvider(provider.provider);
                    setCredentialLabel(provider.connectionLabel || '');
                    setCredentialSecret('');
                  }
                }}
                icon={getProviderIcon(provider.provider)}
                disabled={authLoading || capabilitiesLoading || provider.authKind === 'local'}
              />
              {!user ? (
                <p className="text-xs text-amber-300">
                  Sign in first, then connect tools.
                </p>
              ) : provider.provider === 'google' && googleConnected && provider.missingScopes.length > 0 ? (
                <p className="text-xs text-amber-300">
                  Reconnect Google to enable Sidekick actions.
                </p>
              ) : provider.authKind === 'api_key' ? (
                <p className="text-xs text-slate-500">
                  Paste one key once. Sidekick stores it encrypted and reuses it for agent runs.
                </p>
              ) : provider.authKind === 'local' ? (
                <p className="text-xs text-slate-500">
                  Available only on trusted workspaces with execution enabled.
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  No extra setup page needed. Sidekick handles this through the shared capability layer.
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <Calendar size={20} className="text-emerald-400" />
            <p className="mt-3 text-sm font-semibold">Calendar Sync</p>
            <p className="text-xs text-slate-500 mt-1">Auto‑schedule tasks and meetings.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <Cloud size={20} className="text-emerald-400" />
            <p className="mt-3 text-sm font-semibold">Drive Access</p>
            <p className="text-xs text-slate-500 mt-1">Use docs as training sources.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <Shield size={20} className="text-emerald-400" />
            <p className="mt-3 text-sm font-semibold">Security</p>
            <p className="text-xs text-slate-500 mt-1">Granular scopes and audit trails.</p>
          </div>
        </div>

        <div className="mt-8 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <p className="text-sm text-slate-400">
            The agent now uses a shared capability model: OAuth for Google, encrypted API keys for GitHub and Rivryn, and local execution for trusted workspaces.
          </p>
        </div>
      </div>

      {credentialModalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-100">Add API Key</h3>
            <p className="mt-2 text-sm text-slate-400">
              Store an encrypted key for {credentialModalProvider}. The agent will use it during approved runs.
            </p>
            <div className="mt-4 space-y-3">
              <input
                value={credentialLabel}
                onChange={(e) => setCredentialLabel(e.target.value)}
                placeholder="Label (optional)"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
              <textarea
                value={credentialSecret}
                onChange={(e) => setCredentialSecret(e.target.value)}
                placeholder="Paste API key or token"
                className="w-full min-h-[120px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </div>
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => {
                  setCredentialModalProvider(null);
                  setCredentialLabel('');
                  setCredentialSecret('');
                }}
                className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!credentialModalProvider || !credentialSecret.trim()) {
                    toast.error('API key required');
                    return;
                  }

                  setSavingCredential(true);
                  const result = await saveToolCredential(
                    credentialModalProvider,
                    credentialSecret.trim(),
                    credentialLabel.trim() || undefined
                  );
                  setSavingCredential(false);

                  if (!result.success) {
                    toast.error(result.error || 'Failed to save API key');
                    return;
                  }

                  toast.success('API key saved');
                  setCredentialModalProvider(null);
                  setCredentialLabel('');
                  setCredentialSecret('');
                  loadCapabilities();
                }}
                disabled={savingCredential}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-emerald-50 hover:bg-emerald-500 disabled:opacity-50"
              >
                {savingCredential ? 'Saving...' : 'Save Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsPage;
