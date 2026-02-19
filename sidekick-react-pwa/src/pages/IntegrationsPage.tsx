/**
 * IntegrationsPage Component
 * Connect external accounts (GitHub, Google)
 */

import React, { useEffect, useState } from 'react';
import { Github, Mail, Calendar, Cloud, Shield, CheckCircle2 } from 'lucide-react';
import { getGoogleStatus, startGoogleConnect, disconnectGoogle } from '../services/connectors/google';
import toast from 'react-hot-toast';

interface IntegrationCardProps {
  title: string;
  description: string;
  status: 'connected' | 'not_connected';
  ctaLabel: string;
  onClick: () => void;
  icon: React.ReactNode;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  title,
  description,
  status,
  ctaLabel,
  onClick,
  icon,
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
          className="px-3 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm hover:border-slate-500"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
};

export const IntegrationsPage: React.FC = () => {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const loadStatus = async () => {
    const status = await getGoogleStatus();
    setGoogleConnected(!!status.connected);
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-slate-400">Connect Sidekick to your tools.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IntegrationCard
            title="GitHub"
            description="Repos, issues, PRs, and code search."
            status="not_connected"
            ctaLabel="Connect"
            onClick={() => alert('GitHub OAuth setup coming next.')}
            icon={<Github size={22} />}
          />
          <div className="space-y-2">
            <IntegrationCard
              title="Google"
              description="Gmail, Calendar, Drive, and Docs."
              status={googleConnected ? 'connected' : 'not_connected'}
              ctaLabel={googleConnected ? 'Disconnect' : googleLoading ? 'Connecting...' : 'Connect'}
              onClick={async () => {
                if (googleLoading) return;
                if (googleConnected) {
                  setGoogleLoading(true);
                  const res = await disconnectGoogle();
                  setGoogleLoading(false);
                  if (res.success) {
                    toast.success('Google disconnected');
                    setGoogleConnected(false);
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
              }}
              icon={<Mail size={22} />}
            />
            <p className="text-xs text-slate-500">
              No setup needed. Sidekick handles OAuth centrally.
            </p>
          </div>
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
            OAuth integration and scope control will be added next. This page is ready for the backend hookup.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;
