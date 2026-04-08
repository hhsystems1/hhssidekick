import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
  preventClose?: boolean;
}

interface AuthFormCardProps {
  initialMode?: 'signin' | 'signup';
  title?: string;
  subtitle?: string;
  onSuccess?: () => void;
  footer?: React.ReactNode;
}

export const AuthFormCard: React.FC<AuthFormCardProps> = ({
  initialMode = 'signin',
  title,
  subtitle,
  onSuccess,
  footer,
}) => {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const resolvedTitle = title ?? (mode === 'signin' ? 'Welcome back' : 'Create account');
  const resolvedSubtitle =
    subtitle ??
    (mode === 'signin'
      ? 'Sign in to access RivRyn SideKick'
      : 'Get started with your AI assistant');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setError(null);
    setResetSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          toast.success('Welcome back!');
          onSuccess?.();
          resetForm();
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setError(error.message);
        } else {
          toast.success('Account created! Check your email to verify.');
          onSuccess?.();
          resetForm();
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
      toast.success('Password reset email sent!');
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setResetSent(false);
  };

  return (
    <div className="bg-app-panel border-app relative w-full max-w-md mx-4 overflow-hidden rounded-2xl border shadow-2xl">
      <div className="p-8 pb-4">
        <h2 className="text-app text-2xl font-bold">{resolvedTitle}</h2>
        <p className="text-app-muted mt-1">{resolvedSubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {resetSent && (
          <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg text-emerald-400 text-sm">
            Password reset email sent! Check your inbox.
          </div>
        )}

        {mode === 'signup' && (
          <div>
            <label className="text-app-muted mb-1.5 block text-sm font-medium">
              Full Name
            </label>
            <div className="relative">
              <User size={18} className="text-app-soft absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="app-input w-full rounded-lg border py-3 pl-10 pr-4 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                required={mode === 'signup'}
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-app-muted mb-1.5 block text-sm font-medium">
            Email
          </label>
          <div className="relative">
            <Mail size={18} className="text-app-soft absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="app-input w-full rounded-lg border py-3 pl-10 pr-4 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-app-muted mb-1.5 block text-sm font-medium">
            Password
          </label>
          <div className="relative">
            <Lock size={18} className="text-app-soft absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="app-input w-full rounded-lg border py-3 pl-10 pr-12 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-app-soft hover:text-app absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {mode === 'signin' && (
          <button
            type="button"
            onClick={handleResetPassword}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            disabled={loading}
          >
            Forgot password?
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-emerald-700 text-emerald-50 rounded-lg font-medium hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-emerald-50 border-t-transparent rounded-full animate-spin" />
              {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
            </span>
          ) : mode === 'signin' ? (
            'Sign In'
          ) : (
            'Create Account'
          )}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="border-app w-full border-t" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-app-panel text-app-soft px-4">or</span>
          </div>
        </div>

        <p className="text-app-muted text-center text-sm">
          {mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={switchMode}
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={switchMode}
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Sign in
              </button>
            </>
          )}
        </p>

        {footer ? <div className="pt-2">{footer}</div> : null}
      </form>
    </div>
  );
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  preventClose = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="app-backdrop absolute inset-0 backdrop-blur-sm"
        onClick={preventClose ? undefined : onClose}
      />

      <div className="relative">
        {!preventClose && (
          <button
            onClick={onClose}
            className="hover-bg-app absolute top-4 right-8 z-10 rounded-full p-2 transition-colors"
          >
            <X size={20} className="text-app-muted" />
          </button>
        )}
        <AuthFormCard initialMode={initialMode} onSuccess={onClose} />
      </div>
    </div>
  );
};

export default AuthModal;
