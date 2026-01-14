import React, { useState } from 'react';
import { X, Monitor, Smartphone, Globe, Clock, LogOut, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

interface SessionManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionManagementDialog: React.FC<SessionManagementDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  // Mock sessions for demo - in production, fetch from Supabase
  const [sessions] = useState<Session[]>([
    {
      id: '1',
      device: 'Chrome on MacOS',
      location: 'New York, US',
      lastActive: 'Now',
      current: true,
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'New York, US',
      lastActive: '2 hours ago',
      current: false,
    },
    {
      id: '3',
      device: 'Firefox on Windows',
      location: 'Los Angeles, US',
      lastActive: '3 days ago',
      current: false,
    },
  ]);

  const handleSignOutOtherSessions = async () => {
    setLoading(true);
    try {
      await signOut();
      toast.success('Signed out from all other sessions');
      onClose();
    } catch {
      toast.error('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    toast.success('Session revoked');
    console.log('Revoking session:', sessionId);
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('iphone') || device.toLowerCase().includes('android')) {
      return <Smartphone size={20} className="text-slate-400" />;
    }
    if (device.toLowerCase().includes('mac') || device.toLowerCase().includes('windows')) {
      return <Monitor size={20} className="text-slate-400" />;
    }
    return <Globe size={20} className="text-slate-400" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center">
              <Monitor size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Session Management</h3>
              <p className="text-xs text-slate-500">Manage your active sessions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-3 flex items-start gap-3">
            <AlertCircle size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-200 font-medium">Current session</p>
              <p className="text-xs text-blue-400 mt-0.5">
                You're currently logged in on these devices. Sessions automatically expire after 30 days of inactivity.
              </p>
            </div>
          </div>

          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 rounded-xl border ${
                session.current
                  ? 'bg-emerald-950/20 border-emerald-800/50'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getDeviceIcon(session.device)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-200">{session.device}</p>
                      {session.current && (
                        <span className="text-xs bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Globe size={12} />
                        {session.location}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={12} />
                        {session.lastActive}
                      </span>
                    </div>
                  </div>
                </div>
                {!session.current && (
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 hover:bg-red-950/30 rounded"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex-shrink-0">
          <button
            onClick={handleSignOutOtherSessions}
            disabled={loading}
            className="w-full py-3 border border-red-900/60 text-red-400 rounded-xl hover:bg-red-950/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogOut size={18} />
            {loading ? 'Signing out...' : 'Sign out of all other sessions'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionManagementDialog;
