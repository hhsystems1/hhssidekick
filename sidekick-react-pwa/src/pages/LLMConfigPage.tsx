/**
 * LLMConfigPage Component
 * LLM configuration placeholder
 */

import React, { useState } from 'react';
import { Cpu, Key, Sliders, CheckCircle2, XCircle, Server } from 'lucide-react';
import { getAIProvider, hasGroqKey, hasOpenAIKey, hasAnthropicKey, getOllamaURL } from '../config/ai-models';
import { testConnection } from '../services/ai/llm-client';

export const LLMConfigPage: React.FC = () => {
  const provider = getAIProvider();
  const ollamaUrl = getOllamaURL();
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'ok' | 'fail'>('idle');

  const status = [
    { label: 'Groq', ok: hasGroqKey(), detail: 'VITE_GROQ_API_KEY' },
    { label: 'OpenAI', ok: hasOpenAIKey(), detail: 'VITE_OPENAI_API_KEY' },
    { label: 'Anthropic', ok: hasAnthropicKey(), detail: 'VITE_ANTHROPIC_API_KEY' },
    { label: 'Ollama', ok: true, detail: ollamaUrl },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">LLM Config</h1>
          <p className="text-slate-400">Set model providers, keys, and defaults.</p>
        </div>

        <div className="mb-6 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm">
                <Server size={16} className="text-emerald-400" />
                <span className="text-slate-300">Current provider:</span>
                <span className="text-emerald-300 font-semibold">{provider}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Set `VITE_AI_PROVIDER` to `groq`, `openai`, `anthropic`, or `ollama`.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  setTestStatus('running');
                  const ok = await testConnection();
                  setTestStatus(ok ? 'ok' : 'fail');
                }}
                disabled={testStatus === 'running'}
                className="px-3 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm hover:border-slate-500 disabled:opacity-50"
              >
                {testStatus === 'running' ? 'Testing...' : 'Test LLM'}
              </button>
              {testStatus === 'ok' && (
                <span className="text-xs text-emerald-300">Connected</span>
              )}
              {testStatus === 'fail' && (
                <span className="text-xs text-red-300">Failed</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {status.map((item) => (
            <div key={item.label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
              {item.ok ? (
                <CheckCircle2 size={18} className="text-emerald-400 mt-0.5" />
              ) : (
                <XCircle size={18} className="text-red-400 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-slate-500">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <Cpu size={24} className="text-emerald-400" />
            <h3 className="mt-4 text-lg font-semibold">Providers</h3>
            <p className="text-sm text-slate-400 mt-2">Connect OpenAI, Anthropic, or local models.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <Key size={24} className="text-emerald-400" />
            <h3 className="mt-4 text-lg font-semibold">API Keys</h3>
            <p className="text-sm text-slate-400 mt-2">Manage secrets securely for each provider.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <Sliders size={24} className="text-emerald-400" />
            <h3 className="mt-4 text-lg font-semibold">Defaults</h3>
            <p className="text-sm text-slate-400 mt-2">Set temperature, max tokens, and routing.</p>
          </div>
        </div>

        <div className="mt-8 bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <p className="text-slate-400">LLM configuration will be wired next.</p>
        </div>
      </div>
    </div>
  );
};

export default LLMConfigPage;
