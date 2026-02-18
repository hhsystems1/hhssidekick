/**
 * AppBuilderPage Component
 * Guided onboarding for creating a new app in Rivryn
 */

import React, { useMemo, useState } from 'react';
import { Github, Mail, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

interface AppBuilderState {
  appName: string;
  description: string;
  targetUsers: string;
  integrations: {
    github: boolean;
    google: boolean;
  };
  repoName: string;
  visibility: 'private' | 'public';
  rivrynProjectUrl: string;
}

const defaultState: AppBuilderState = {
  appName: '',
  description: '',
  targetUsers: '',
  integrations: {
    github: true,
    google: true,
  },
  repoName: '',
  visibility: 'private',
  rivrynProjectUrl: '',
};

export const AppBuilderPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<AppBuilderState>(defaultState);

  const isStep1Valid = state.appName.trim().length > 0;
  const isStep2Valid = state.integrations.github || state.integrations.google;
  const isStep3Valid = state.repoName.trim().length > 0;

  const summary = useMemo(() => {
    const integrations = [
      state.integrations.github ? 'GitHub' : null,
      state.integrations.google ? 'Google' : null,
    ].filter(Boolean).join(', ');
    return {
      integrations,
    };
  }, [state.integrations]);

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-3xl mx-auto p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">App Builder</h1>
          <p className="text-slate-400">Guided onboarding to create an app in Rivryn.</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
          <span>Basics</span>
          <div className="h-px w-6 bg-slate-800" />
          <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
          <span>Integrations</span>
          <div className="h-px w-6 bg-slate-800" />
          <div className={`h-2 w-2 rounded-full ${step >= 3 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
          <span>Repo</span>
          <div className="h-px w-6 bg-slate-800" />
          <div className={`h-2 w-2 rounded-full ${step >= 4 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
          <span>Review</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300">App Name</label>
                <input
                  value={state.appName}
                  onChange={(e) => setState({ ...state, appName: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  placeholder="Client Portal, Support Assistant, etc."
                />
              </div>
              <div>
                <label className="text-sm text-slate-300">Description</label>
                <textarea
                  value={state.description}
                  onChange={(e) => setState({ ...state, description: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm min-h-[90px]"
                  placeholder="What should this app do?"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300">Target Users</label>
                <input
                  value={state.targetUsers}
                  onChange={(e) => setState({ ...state, targetUsers: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  placeholder="Sales team, clients, internal ops..."
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">Choose which integrations this app needs.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setState({ ...state, integrations: { ...state.integrations, github: !state.integrations.github } })}
                  className={`rounded-xl border p-4 text-left ${state.integrations.github ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-slate-800 bg-slate-950/40'}`}
                >
                  <div className="flex items-center gap-2">
                    <Github size={18} className="text-emerald-300" />
                    <span className="text-sm font-semibold">GitHub</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Repo, issues, PRs.</p>
                </button>
                <button
                  onClick={() => setState({ ...state, integrations: { ...state.integrations, google: !state.integrations.google } })}
                  className={`rounded-xl border p-4 text-left ${state.integrations.google ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-slate-800 bg-slate-950/40'}`}
                >
                  <div className="flex items-center gap-2">
                    <Mail size={18} className="text-emerald-300" />
                    <span className="text-sm font-semibold">Google</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Gmail, Calendar, Drive.</p>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300">Repo Name</label>
                <input
                  value={state.repoName}
                  onChange={(e) => setState({ ...state, repoName: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  placeholder="client-portal-app"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300">Visibility</label>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => setState({ ...state, visibility: 'private' })}
                    className={`px-3 py-2 rounded-lg border text-sm ${state.visibility === 'private' ? 'border-emerald-500/60 text-emerald-200' : 'border-slate-700 text-slate-400'}`}
                  >
                    Private
                  </button>
                  <button
                    onClick={() => setState({ ...state, visibility: 'public' })}
                    className={`px-3 py-2 rounded-lg border text-sm ${state.visibility === 'public' ? 'border-emerald-500/60 text-emerald-200' : 'border-slate-700 text-slate-400'}`}
                  >
                    Public
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-300">Rivryn Project URL (optional)</label>
                <input
                  value={state.rivrynProjectUrl}
                  onChange={(e) => setState({ ...state, rivrynProjectUrl: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  placeholder="https://..."
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 size={18} />
                <span className="text-sm font-semibold">Review</span>
              </div>
              <div className="text-sm text-slate-300">
                <p><span className="text-slate-500">App:</span> {state.appName || 'Untitled'}</p>
                <p><span className="text-slate-500">Target:</span> {state.targetUsers || 'Not specified'}</p>
                <p><span className="text-slate-500">Integrations:</span> {summary.integrations || 'None'}</p>
                <p><span className="text-slate-500">Repo:</span> {state.repoName || 'Not set'} ({state.visibility})</p>
              </div>
              <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-3 text-xs text-slate-400">
                Next step: Sidekick will create the repo and open Rivryn for project setup.
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={back}
            disabled={step === 1}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm disabled:opacity-40"
          >
            <ArrowLeft size={16} /> Back
          </button>
          {step < 4 ? (
            <button
              onClick={next}
              disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid) || (step === 3 && !isStep3Valid)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-emerald-50 text-sm hover:bg-emerald-500 disabled:opacity-50"
            >
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => {
                if (state.rivrynProjectUrl) {
                  window.open(state.rivrynProjectUrl, '_blank', 'noopener,noreferrer');
                } else {
                  alert('Add a Rivryn project URL to continue.');
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-emerald-50 text-sm hover:bg-emerald-500"
            >
              Open in Rivryn <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppBuilderPage;
