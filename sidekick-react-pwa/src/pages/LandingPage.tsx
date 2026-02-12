import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { AuthModal } from '../components/AuthModal';
import { BRANDING, getLogo } from '../config/branding';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/app');
    }
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_55%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getLogo()}</span>
              <div>
                <p className="text-sm uppercase tracking-widest text-emerald-300">{BRANDING.companyName}</p>
                <h1 className="text-2xl font-semibold text-white">{BRANDING.appName}</h1>
              </div>
            </div>
            <button
              onClick={() => setAuthOpen(true)}
              className="rounded-full border border-emerald-500/40 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-400 hover:text-emerald-100"
            >
              Sign In
            </button>
          </header>

          <main className="mt-16 grid gap-12 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
            <section>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
                <Sparkles size={16} />
                <span>AI-driven ops for your team</span>
              </div>
              <h2 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Your Sidekick for closing gaps, shipping faster, and staying sharp.
              </h2>
              <p className="mt-6 text-lg text-slate-300">
                Coordinate agents, brain-dump ideas, and keep your operating system tight. Everything lives
                in one calm command center.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => setAuthOpen(true)}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-500"
                >
                  Get Started
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => navigate('/app')}
                  className="rounded-lg border border-slate-700 px-6 py-3 font-medium text-slate-200 transition hover:border-slate-600"
                >
                  Enter App
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-black/40">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                  <p className="text-sm uppercase tracking-wider text-slate-500">Today</p>
                  <p className="mt-2 text-2xl font-semibold text-white">Launch the Q1 agent sprint</p>
                  <p className="mt-3 text-sm text-slate-400">
                    Keep your goals, tasks, and experiments visible and moving forward without the noise.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                  <p className="text-sm uppercase tracking-wider text-slate-500">Next</p>
                  <p className="mt-2 text-2xl font-semibold text-white">Deploy a new specialist agent</p>
                  <p className="mt-3 text-sm text-slate-400">
                    Assign workflows, track performance, and iterate with a built-in feedback loop.
                  </p>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default LandingPage;
