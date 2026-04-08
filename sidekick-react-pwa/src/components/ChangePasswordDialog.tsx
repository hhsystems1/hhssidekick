import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface ChangePasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 1) return { strength: 1, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 2) return { strength: 2, label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 3) return { strength: 3, label: 'Good', color: 'bg-blue-500' };
    return { strength: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        setError(error.message);
      } else {
        toast.success('Password updated successfully');
        onClose();
        resetForm();
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="app-backdrop absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="bg-app-panel border-app relative mx-4 w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl">
        <div className="border-app flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center">
              <Shield size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-app text-lg font-semibold">Change Password</h3>
              <p className="text-app-soft text-xs">Update your password</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover-bg-app rounded-full p-2 transition-colors"
          >
            <X size={20} className="text-app-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="text-app-muted mb-1.5 block text-sm font-medium">
              New Password
            </label>
            <div className="relative">
              <Lock size={18} className="text-app-soft absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="app-input w-full rounded-lg border py-3 pl-10 pr-12 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="text-app-soft hover:text-app absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= passwordStrength.strength ? passwordStrength.color : 'bg-app-muted'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-app-soft text-xs">
                  Password strength: <span className={passwordStrength.color.replace('bg-', 'text-')}>{passwordStrength.label}</span>
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-app-muted mb-1.5 block text-sm font-medium">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock size={18} className="text-app-soft absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="app-input w-full rounded-lg border py-3 pl-10 pr-12 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="text-app-soft hover:text-app absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && (
              <div className="flex items-center gap-1 mt-1">
                {newPassword === confirmPassword ? (
                  <>
                    <CheckCircle size={14} className="text-emerald-400" />
                    <span className="text-xs text-emerald-400">Passwords match</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} className="text-red-400" />
                    <span className="text-xs text-red-400">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Password requirements */}
          <div className="bg-app-panel-soft rounded-lg p-3 space-y-1">
            <p className="text-app-soft mb-2 text-xs font-medium">Password requirements:</p>
            <div className={`flex items-center gap-2 text-xs ${newPassword.length >= 8 ? 'text-emerald-400' : 'text-app-soft'}`}>
              <span>{newPassword.length >= 8 ? '●' : '○'}</span>
              <span>At least 8 characters</span>
            </div>
            <div className={`flex items-center gap-2 text-xs ${/[A-Z]/.test(newPassword) ? 'text-emerald-400' : 'text-app-soft'}`}>
              <span>{/[A-Z]/.test(newPassword) ? '●' : '○'}</span>
              <span>One uppercase letter</span>
            </div>
            <div className={`flex items-center gap-2 text-xs ${/[0-9]/.test(newPassword) ? 'text-emerald-400' : 'text-app-soft'}`}>
              <span>{/[0-9]/.test(newPassword) ? '●' : '○'}</span>
              <span>One number</span>
            </div>
          </div>
        </form>

        <div className="border-app flex items-center justify-end gap-3 border-t p-4">
          <button
            type="button"
            onClick={onClose}
            className="text-app-muted hover:text-app px-4 py-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !newPassword || !confirmPassword}
            className="px-4 py-2 bg-emerald-700 text-emerald-50 rounded-lg font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordDialog;
