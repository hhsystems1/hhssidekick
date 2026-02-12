import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { BRANDING, getLogo } from '../config/branding';

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setMessage('This reset link is invalid or expired. Please request a new password reset.');
        setStatus('error');
      }
      setReady(true);
    };

    loadSession();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    if (password.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    const { error } = await updatePassword(password);
    if (error) {
      setStatus('error');
      setMessage(error.message || 'Failed to update password.');
      return;
    }

    setStatus('success');
    setMessage('Password updated successfully. You can now sign in.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getLogo()}</span>
          <div>
            <p className="text-xs uppercase tracking-widest text-emerald-300">{BRANDING.companyName}</p>
            <h1 className="text-2xl font-semibold text-white">Reset Password</h1>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-400">
          Set a new password for your {BRANDING.appName} account.
        </p>

        {status === 'error' && (
          <div className="mt-6 flex items-start gap-2 rounded-lg border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">
            <AlertCircle size={18} />
            <span>{message}</span>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-6 flex items-start gap-2 rounded-lg border border-emerald-900/50 bg-emerald-950/40 p-3 text-sm text-emerald-200">
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        )}

        {ready && status !== 'success' && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-lg bg-emerald-600 py-3 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {status === 'loading' ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        <button
          onClick={() => navigate('/')}
          className="mt-6 w-full rounded-lg border border-slate-700 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600"
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
