import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Once loading is complete, check if user is authenticated
    if (!loading && !user) {
      setShowAuthModal(true);
    }
  }, [user, loading]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show auth modal with message
  if (!user) {
    return (
      <>
        <div className="flex items-center justify-center h-screen bg-slate-950">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-slate-100 mb-2">Sign In Required</h1>
            <p className="text-slate-400 mb-6">
              Please sign in to access your dashboard, create tasks, deploy agents, and chat with AI.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition-colors"
            >
              Sign In / Sign Up
            </button>
          </div>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  // User is authenticated, show the protected content
  return <>{children}</>;
};
