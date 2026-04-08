/**
 * LLM configuration: per-account Ollama host (e.g. Tailscale IP), default model, provider preference.
 */

import React, { useEffect, useState } from 'react';
import { Cpu, Key, Sliders, CheckCircle2, XCircle, Server, Save, Network } from 'lucide-react';
import {
  getAIProvider,
  hasGroqKey,
  hasOpenAIKey,
  hasAnthropicKey,
  getOllamaURL,
  normalizeOllamaBaseUrl,
  type AIProvider,
} from '../config/ai-models';
import { testConnection } from '../services/ai/llm-client';
import { listOllamaModels } from '../services/ai/ollama';
import { useAuth } from '../context/AuthContext';
import { useLlmSettingsSync } from '../context/LlmSettingsContext';
import { useUserProfile } from '../hooks/useDatabase';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const PROVIDERS: { id: AIProvider | ''; label: string }[] = [
  { id: '', label: 'App default (env VITE_AI_PROVIDER)' },
  { id: 'groq', label: 'Groq' },
  { id: 'ollama', label: 'Ollama (your host)' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
];

export const LLMConfigPage: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateProfile, reload: reloadProfile } = useUserProfile();
  const { refreshFromProfile } = useLlmSettingsSync();

  const [ollamaHost, setOllamaHost] = useState('');
  const [ollamaModel, setOllamaModel] = useState('');
  const [preferredProvider, setPreferredProvider] = useState<AIProvider | ''>('');
  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'ok' | 'fail'>('idle');
  const [discoveringModels, setDiscoveringModels] = useState(false);
  const [discoveredModels, setDiscoveredModels] = useState<string[]>([]);

  useEffect(() => {
    const s = profile?.llm_settings;
    if (!s || typeof s !== 'object') {
      setOllamaHost('');
      setOllamaModel('');
      setPreferredProvider('');
      return;
    }
    setOllamaHost(typeof s.ollama_host === 'string' ? s.ollama_host : '');
    setOllamaModel(typeof s.ollama_model_default === 'string' ? s.ollama_model_default : '');
    const p = typeof s.preferred_provider === 'string' ? s.preferred_provider.toLowerCase() : '';
    if (p === 'groq' || p === 'ollama' || p === 'openai' || p === 'anthropic') {
      setPreferredProvider(p);
    } else {
      setPreferredProvider('');
    }
  }, [profile?.llm_settings]);

  const resolvedProvider = getAIProvider();
  const resolvedOllamaUrl = getOllamaURL();

  const status = [
    { label: 'Groq', ok: hasGroqKey(), detail: 'VITE_GROQ_API_KEY in .env' },
    { label: 'OpenAI', ok: hasOpenAIKey(), detail: 'VITE_OPENAI_API_KEY in .env' },
    { label: 'Anthropic', ok: hasAnthropicKey(), detail: 'VITE_ANTHROPIC_API_KEY in .env' },
    { label: 'Ollama', ok: true, detail: resolvedOllamaUrl },
  ];

  const handleSave = async () => {
    if (!user) {
      toast.error('Sign in to save LLM settings.');
      return;
    }
    setSaving(true);
    try {
      const llm_settings: Record<string, unknown> = {
        ollama_host: ollamaHost.trim() ? normalizeOllamaBaseUrl(ollamaHost.trim()) : null,
        ollama_model_default: ollamaModel.trim() || null,
        preferred_provider: preferredProvider || null,
      };
      const ok = await updateProfile({ llm_settings });
      if (ok) {
        await refreshFromProfile();
        toast.success('LLM settings saved');
      } else {
        toast.error('Could not save settings. Did you run the database migration for llm_settings?');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUseLocalOllama = () => {
    setPreferredProvider('ollama');
    setOllamaHost('http://localhost:11434');
    if (!ollamaModel.trim()) {
      setOllamaModel('llama3.2:latest');
    }
  };

  const handleUseRemoteOllama = () => {
    setPreferredProvider('ollama');
    if (!ollamaHost.trim()) {
      setOllamaHost('http://100.x.x.x:11434');
    }
  };

  const handleDiscoverModels = async () => {
    setDiscoveringModels(true);
    try {
      const models = await listOllamaModels();
      setDiscoveredModels(models);
      if (models.length === 0) {
        toast.error('No models found. Make sure Ollama is reachable and has at least one model pulled.');
        return;
      }
      if (!ollamaModel.trim()) {
        setOllamaModel(models[0]);
      }
      toast.success(`Found ${models.length} model${models.length === 1 ? '' : 's'}`);
    } finally {
      setDiscoveringModels(false);
    }
  };

  return (
    <div className="bg-app text-app min-h-screen">
      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">LLM Config</h1>
          <p className="text-app-muted">
            Connect your model once from the app. Consumers should not need to edit config files or code to use Ollama.
          </p>
        </div>

        {!user ? (
          <div className="rounded-xl border border-amber-800/60 bg-amber-950/30 p-4 text-amber-200 text-sm">
            Sign in to store Ollama host and preferences on your profile.
          </div>
        ) : null}

        <div className="bg-app-panel-soft border-app mb-6 rounded-xl border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm">
                <Server size={16} className="text-emerald-400" />
                <span className="text-app-muted">Active provider (resolved):</span>
                <span className="text-emerald-300 font-semibold">{resolvedProvider}</span>
              </div>
              <p className="text-app-soft mt-2 text-xs">
                Ollama URL in use: <span className="text-app-muted">{resolvedOllamaUrl}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  setTestStatus('running');
                  const ok = await testConnection();
                  setTestStatus(ok ? 'ok' : 'fail');
                }}
                disabled={testStatus === 'running' || profileLoading}
                className="border-app text-app-muted hover-bg-app rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
              >
                {testStatus === 'running' ? 'Testing...' : 'Test LLM'}
              </button>
              {testStatus === 'ok' && <span className="text-xs text-emerald-300">Connected</span>}
              {testStatus === 'fail' && <span className="text-xs text-red-300">Failed</span>}
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="bg-app-panel-soft border-app rounded-xl border p-5">
            <p className="text-app text-sm font-semibold">1. Pick a source</p>
            <p className="text-app-soft mt-2 text-xs">Use Ollama on this device or point to a remote machine on your network or Tailscale.</p>
          </div>
          <div className="bg-app-panel-soft border-app rounded-xl border p-5">
            <p className="text-app text-sm font-semibold">2. Detect models</p>
            <p className="text-app-soft mt-2 text-xs">SideKick can ask Ollama which models are already installed so users do not have to remember model names.</p>
          </div>
          <div className="bg-app-panel-soft border-app rounded-xl border p-5">
            <p className="text-app text-sm font-semibold">3. Save to account</p>
            <p className="text-app-soft mt-2 text-xs">The host, provider, and default model are stored on the user profile, not in local config files.</p>
          </div>
        </div>

        <div className="bg-app-panel-soft border-app mb-6 space-y-4 rounded-xl border p-5">
          <div className="text-app flex items-center gap-2 font-semibold">
            <Network size={18} className="text-emerald-400" />
            Account LLM settings
          </div>
          <p className="text-app-soft text-xs">
            For most users, click <code className="text-app-muted">Use this device</code>. If Ollama runs on another machine, paste its URL here. The browser still has to reach that host directly.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleUseLocalOllama}
              disabled={!user || profileLoading}
              className="border-app text-app-muted hover-bg-app rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
            >
              Use this device
            </button>
            <button
              type="button"
              onClick={handleUseRemoteOllama}
              disabled={!user || profileLoading}
              className="border-app text-app-muted hover-bg-app rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
            >
              Use remote Ollama
            </button>
            <button
              type="button"
              onClick={() => {
                setPreferredProvider('');
                setOllamaHost('');
                setOllamaModel('');
                setDiscoveredModels([]);
              }}
              disabled={!user || profileLoading}
              className="border-app text-app-muted hover-bg-app rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
            >
              Clear
            </button>
          </div>

          <label className="text-app-muted block text-sm">Preferred provider</label>
          <select
            value={preferredProvider}
            onChange={(e) => setPreferredProvider((e.target.value || '') as AIProvider | '')}
            disabled={!user || profileLoading}
            className="app-input w-full max-w-md rounded-lg border px-3 py-2 text-sm"
          >
            {PROVIDERS.map((p) => (
              <option key={p.id || 'default'} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <label className="text-app-muted block text-sm">Ollama host URL</label>
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              type="text"
              value={ollamaHost}
              onChange={(e) => setOllamaHost(e.target.value)}
              placeholder="http://localhost:11434 or http://my-machine:11434"
              disabled={!user || profileLoading}
              className="app-input w-full rounded-lg border px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void handleDiscoverModels()}
              disabled={!user || profileLoading || discoveringModels}
              className="border-app text-app-muted hover-bg-app rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
            >
              {discoveringModels ? 'Detecting...' : 'Detect models'}
            </button>
          </div>
          <p className="text-app-soft text-xs">
            Examples: <code className="text-app-muted">http://localhost:11434</code> for the same device, or a Tailscale/LAN address for another machine.
          </p>

          <label className="text-app-muted block text-sm">Default Ollama model (optional)</label>
          <input
            type="text"
            value={ollamaModel}
            onChange={(e) => setOllamaModel(e.target.value)}
            placeholder="e.g. llama3.2:latest"
            disabled={!user || profileLoading}
            className="app-input w-full max-w-md rounded-lg border px-3 py-2 text-sm"
          />
          {discoveredModels.length > 0 ? (
            <div className="space-y-2">
              <label className="text-app-muted block text-sm">Detected models</label>
              <select
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                disabled={!user || profileLoading}
                className="app-input w-full max-w-md rounded-lg border px-3 py-2 text-sm"
              >
                {discoveredModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!user || saving || profileLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-emerald-50 hover:bg-emerald-500 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving…' : 'Save to account'}
            </button>
            <button
              type="button"
              onClick={() => void reloadProfile()}
              disabled={profileLoading}
              className="border-app text-app-muted hover-bg-app rounded-lg border px-4 py-2 text-sm"
            >
              Reload
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {status.map((item) => (
            <div key={item.label} className="bg-app-panel-soft border-app flex items-start gap-3 rounded-xl border p-4">
              {item.ok ? (
                <CheckCircle2 size={18} className="text-emerald-400 mt-0.5" />
              ) : (
                <XCircle size={18} className="text-red-400 mt-0.5" />
              )}
              <div>
                <p className="text-app text-sm font-semibold">{item.label}</p>
                <p className="text-app-soft text-xs">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-app-panel-soft border-app rounded-xl border p-6">
            <Cpu size={24} className="text-emerald-400" />
            <h3 className="text-app mt-4 text-lg font-semibold">Providers</h3>
            <p className="text-app-muted mt-2 text-sm">Choose the provider here. Ollama saves directly to the user profile.</p>
          </div>
          <div className="bg-app-panel-soft border-app rounded-xl border p-6">
            <Key size={24} className="text-emerald-400" />
            <h3 className="text-app mt-4 text-lg font-semibold">API Keys</h3>
            <p className="text-app-muted mt-2 text-sm">OpenAI can now be connected from Integrations. Runtime use still needs the server-side GPT execution pass.</p>
          </div>
          <div className="bg-app-panel-soft border-app rounded-xl border p-6">
            <Sliders size={24} className="text-emerald-400" />
            <h3 className="text-app mt-4 text-lg font-semibold">Defaults</h3>
            <p className="text-app-muted mt-2 text-sm">Ollama default model applies to all agent types unless env overrides.</p>
          </div>
        </div>

        <div className="bg-app-panel-soft border-app mt-8 rounded-xl border p-6">
          <p className="text-app-muted text-sm">
            Run <code className="text-app">database/add_profile_llm_settings.sql</code> in Supabase if the save fails. For OpenAI setup, go to{' '}
            <Link to="/integrations" className="text-emerald-300 hover:text-emerald-200">
              Integrations
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default LLMConfigPage;
