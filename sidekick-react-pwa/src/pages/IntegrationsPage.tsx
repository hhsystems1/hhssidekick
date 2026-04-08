/**
 * IntegrationsPage Component
 * Connect external accounts (GitHub, Google)
 */

import React, { useEffect, useState } from 'react';
import { Github, Mail, Calendar, Cloud, Shield, CheckCircle2, TerminalSquare, KeyRound, Phone, BrainCircuit } from 'lucide-react';
import { getGoogleStatus, startGoogleConnect, disconnectGoogle } from '../services/connectors/google';
import { listToolCapabilities, saveToolCredential, type CapabilityStatus } from '../services/connectors/capabilities';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { buildAuthRedirect } from '../utils/auth-routing';

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
    <div className="bg-app-panel-soft border-app rounded-xl border p-5">
      <div className="flex items-center gap-3">
        <div className="text-emerald-400">{icon}</div>
        <div>
          <p className="text-app text-lg font-semibold">{title}</p>
          <p className="text-app-muted text-sm">{description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="text-app-soft text-xs">
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
          className="border-app text-app-muted hover-bg-app rounded-lg border px-3 py-2 text-sm"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
};

export const IntegrationsPage: React.FC = () => {
  const navigate = useNavigate();
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
      case 'openai':
        return <BrainCircuit size={22} />;
      case 'local':
        return <TerminalSquare size={22} />;
      default:
        return <Cloud size={22} />;
    }
  };

  return (
    <div className="bg-app text-app min-h-screen">
      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-app-muted">Connect RivRyn SideKick to your tools, GPT providers, and runtime services.</p>
          {import.meta.env.DEV ? (
            <div className="bg-app-panel-soft border-app text-app-soft mt-3 rounded-lg border p-3 text-xs">
              Auth debug: user `{user?.id ? 'present' : 'missing'}` | session token `{sessionPresent ? 'present' : 'missing'}` | token ref `{tokenRef || 'n/a'}`
            </div>
          ) : null}
        </div>

        <div className="bg-app-panel-soft border-app mb-6 rounded-xl border p-5">
          <h2 className="text-app text-lg font-semibold">Google Workspace (one sign-in)</h2>
          <p className="text-app-muted mt-2 text-sm">
            Connecting Google grants the scopes needed for agent actions. Reconnect if you see “Upgrade Access” (missing scopes).
          </p>
          <ul className="text-app-muted mt-3 list-inside list-disc space-y-1 text-sm">
            <li>
              <strong className="text-app">Gmail</strong> — send email (<code className="text-app-soft text-xs">gmail.send</code>)
            </li>
            <li>
              <strong className="text-app">Calendar</strong> — create events; optional Google Meet via{' '}
              <code className="text-app-soft text-xs">addMeet: true</code> on <code className="text-app-soft text-xs">calendar.create</code>
            </li>
            <li>
              <strong className="text-app">Drive</strong> — read-only access for future doc tooling
            </li>
          </ul>
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
                    navigate(
                      buildAuthRedirect('/integrations', {
                        context: `Sign in to connect ${provider.title}.`,
                      })
                    );
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
                  Reconnect Google to enable RivRyn SideKick actions.
                </p>
              ) : provider.authKind === 'api_key' ? (
                <p className="text-app-soft text-xs">
                  {provider.provider === 'openai'
                    ? 'Connect your OpenAI API key once for GPT chat, embeddings, and Codex-backed runtime flows. It is stored encrypted.'
                    : 'Paste one key once. RivRyn SideKick stores it encrypted and reuses it for agent runs.'}
                </p>
              ) : provider.authKind === 'local' ? (
                <p className="text-app-soft text-xs">
                  Available only on trusted workspaces with execution enabled.
                </p>
              ) : (
                <p className="text-app-soft text-xs">
                  No extra setup page needed. RivRyn SideKick handles this through the shared capability layer.
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-app-panel-soft border-app rounded-xl border p-5">
            <Calendar size={20} className="text-emerald-400" />
            <p className="mt-3 text-sm font-semibold">Calendar & Meet</p>
            <p className="text-xs text-slate-500 mt-1">Create events; Meet links when the action requests them.</p>
          </div>
          <div className="bg-app-panel-soft border-app rounded-xl border p-5">
            <Mail size={20} className="text-emerald-400" />
            <p className="mt-3 text-sm font-semibold">Email</p>
            <p className="text-xs text-slate-500 mt-1">Outbound send through Gmail after connect.</p>
          </div>
          <div className="bg-app-panel-soft border-app rounded-xl border p-5">
            <Cloud size={20} className="text-emerald-400" />
            <p className="mt-3 text-sm font-semibold">Drive Access</p>
            <p className="text-xs text-slate-500 mt-1">Read-only scope for upcoming doc workflows.</p>
          </div>
          <div className="bg-app-panel-soft border-app rounded-xl border p-5">
            <BrainCircuit size={20} className="text-emerald-400" />
            <p className="mt-3 text-sm font-semibold">OpenAI GPT / Codex</p>
            <p className="text-xs text-slate-500 mt-1">Encrypted API-key setup for GPT chat, embeddings, and Codex-backed runtime features.</p>
          </div>
          <div className="bg-app-panel-soft border-app-strong rounded-xl border border-dashed p-5">
            <Phone size={20} className="text-slate-500" />
            <p className="text-app-muted mt-3 text-sm font-semibold">Voice / PSTN</p>
            <p className="text-app-soft mt-1 text-xs">Planned: Twilio or similar for calls; not wired yet.</p>
          </div>
        </div>

        <div className="bg-app-panel-soft border-app mt-4 rounded-xl border p-5">
          <div className="flex items-start gap-2">
            <Shield size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-app text-sm font-semibold">Security</p>
              <p className="text-app-soft mt-1 text-xs">Tokens are encrypted; actions can require approval in Settings.</p>
            </div>
          </div>
        </div>

        <div className="bg-app-panel-soft border-app mt-8 rounded-xl border p-5">
          <p className="text-app-muted text-sm">
            The agent now uses a shared capability model: OAuth for Google, encrypted API keys for OpenAI, GitHub, and Rivryn, and local execution for trusted workspaces.
          </p>
        </div>
      </div>

      {credentialModalProvider && (
        <div className="app-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-app-panel border-app w-full max-w-md rounded-2xl border p-6 shadow-2xl">
            <h3 className="text-app text-lg font-semibold">Add API Key</h3>
            <p className="text-app-muted mt-2 text-sm">
              {credentialModalProvider === 'openai'
                ? 'Store your OpenAI API key once. RivRyn SideKick will use it for GPT chat, embeddings, and Codex-backed runtime calls.'
                : `Store an encrypted key for ${credentialModalProvider}. The agent will use it during approved runs.`}
            </p>
            <div className="mt-4 space-y-3">
              <input
                value={credentialLabel}
                onChange={(e) => setCredentialLabel(e.target.value)}
                placeholder="Label (optional)"
                className="app-input w-full rounded-lg border px-3 py-2 text-sm"
              />
              <textarea
                value={credentialSecret}
                onChange={(e) => setCredentialSecret(e.target.value)}
                placeholder="Paste API key or token"
                className="app-input min-h-[120px] w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => {
                  setCredentialModalProvider(null);
                  setCredentialLabel('');
                  setCredentialSecret('');
                }}
                className="border-app text-app-muted hover-bg-app flex-1 rounded-lg border px-4 py-2 text-sm"
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
