import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Once loading is complete, check if user is authenticated
    if (!loading && !user) {
      window.dispatchEvent(new Event('open-auth-modal'));
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
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Sign In Required</h1>
          <p className="text-slate-400 mb-6">
            Please sign in to access your dashboard, create tasks, deploy agents, and chat with AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.dispatchEvent(new Event('open-auth-modal'))}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition-colors"
            >
              Sign In / Sign Up
            </button>
            <Link
              to="/"
              className="px-6 py-3 border border-slate-700 text-slate-200 rounded-lg font-medium hover:border-slate-600 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, show the protected content
  return <>{children}</>;
};
