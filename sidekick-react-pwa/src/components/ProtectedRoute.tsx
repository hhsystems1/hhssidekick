import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { buildAuthRedirect } from '../utils/auth-routing';

interface ProtectedRouteProps {
  children: React.ReactNode;
}
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="bg-app flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-app-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={buildAuthRedirect(`${location.pathname}${location.search}`, {
          context: 'Sign in to access your dashboard, agents, tasks, chat, and connected AI providers.',
        })}
        replace
      />
    );
  }

  return <>{children}</>;
};
