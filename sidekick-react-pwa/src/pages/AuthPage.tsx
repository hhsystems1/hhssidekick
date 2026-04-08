import React, { useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthFormCard } from '../components/AuthModal';
import { useAuth } from '../context/AuthContext';
import { BRANDING } from '../config/branding';
import { normalizeReturnToPath } from '../utils/auth-routing';

export const AuthPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const requestedMode = searchParams.get('mode');
  const initialMode = requestedMode === 'signup' ? 'signup' : 'signin';
  const returnTo = normalizeReturnToPath(searchParams.get('returnTo'));
  const context = searchParams.get('context')?.trim();

  useEffect(() => {
    if (!loading && user) {
      navigate(returnTo, { replace: true });
    }
  }, [loading, navigate, returnTo, user]);

  if (!loading && user) {
    return <Navigate to={returnTo} replace />;
  }

  return (
    <div className="bg-app text-app min-h-screen overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(900px 650px at 12% 10%, rgba(0,255,160,0.22), transparent 60%),' +
            'radial-gradient(850px 650px at 88% 22%, rgba(56,181,255,0.16), transparent 60%),' +
            'radial-gradient(1100px 850px at 50% 95%, rgba(0,217,126,0.14), transparent 62%),' +
            'linear-gradient(180deg, #04070f 0%, #070b18 40%, #060a14 100%)',
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-4 py-10 lg:flex-row lg:items-center lg:gap-16">
        <div className="max-w-xl">
          <Link
            to="/"
            className="text-app-muted hover:text-app inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Back to {BRANDING.appName}
          </Link>

          <div className="mt-8">
            <img src="/Rivrynsk.png" alt="Rivryn" className="h-20 w-auto" />
            <h1 className="text-app mt-6 text-4xl font-bold tracking-tight">
              Sign in once, then finish setup where you left off.
            </h1>
            <p className="text-app-muted mt-4 max-w-lg text-base">
              {context || 'Use your SideKick account to unlock GPT, integrations, agents, and saved configuration.'}
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="bg-app-panel-soft border-app rounded-2xl border p-5 backdrop-blur-xl">
              <ShieldCheck size={20} className="text-emerald-400" />
              <p className="text-app mt-3 text-sm font-semibold">Single auth path</p>
              <p className="text-app-muted mt-2 text-sm">
                Protected routes redirect here and return users to the exact page they started from.
              </p>
            </div>
            <div className="bg-app-panel-soft border-app rounded-2xl border p-5 backdrop-blur-xl">
              <Sparkles size={20} className="text-cyan-300" />
              <p className="text-app mt-3 text-sm font-semibold">Integration-ready</p>
              <p className="text-app-muted mt-2 text-sm">
                OpenAI, Google, GitHub, and future connectors can all funnel into the same sign-in experience.
              </p>
            </div>
          </div>
        </div>

        <AuthFormCard
          initialMode={initialMode}
          title={initialMode === 'signup' ? 'Create your account' : 'Sign in to continue'}
          subtitle={
            context ||
            (returnTo === '/integrations'
              ? 'Authenticate once to connect OpenAI, Google, GitHub, and other providers.'
              : 'Authenticate once to continue into RivRyn SideKick.')
          }
          onSuccess={() => navigate(returnTo, { replace: true })}
          footer={
            returnTo !== '/' ? (
              <p className="text-app-soft text-center text-xs">
                After sign-in you will return to <span className="text-app-muted">{returnTo}</span>.
              </p>
            ) : null
          }
        />
      </div>
    </div>
  );
};

export default AuthPage;
