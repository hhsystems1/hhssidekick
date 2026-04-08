/**
 * Layout Component
 * Main layout with sidebar navigation for all pages
 */

import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BRANDING } from './config/branding';
import { Navbar } from './components/Navbar';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { buildAuthRedirect } from './utils/auth-routing';

export const Layout: React.FC = () => {
  const [confirmSignOutOpen, setConfirmSignOutOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      const path = location.pathname + location.search;
      localStorage.setItem('sidekick.lastRoute', path);
    }
  }, [location.pathname, location.search, loading]);

  useEffect(() => {
    if (!loading && user) {
      const lastRoute = localStorage.getItem('sidekick.lastRoute');
      if (lastRoute && lastRoute !== '/' && location.pathname === '/') {
        navigate(lastRoute, { replace: true });
      }
    }
  }, [loading, user, location.pathname, navigate]);

  // Navigation handlers for Navbar
  const handleNavigate = (page: string) => {
    const routeMap: Record<string, string> = {
      dashboard: '/',
      chat: '/chat',
      agents: '/agents',
      tasks: '/tasks',
      files: '/files',
      training: '/training',
      skills: '/skills',
      llm: '/llm-config',
      integrations: '/integrations',
      appBuilder: '/app-builder',
      settings: '/settings',
    };
    const route = routeMap[page];
    if (route) navigate(route);
  };

  const handleAction = (action: string) => {
    if (action === 'run') {
      navigate('/agents');
    } else if (action === 'preview') {
      navigate('/chat');
    } else if (action === 'exit-project') {
      navigate('/');
    }
  };

  const navItems = [
    { path: '/', icon: '🏠', label: 'Dashboard', exact: true },
    { path: '/tasks', icon: '✅', label: 'Tasks' },
    { path: '/chat', icon: '💬', label: 'Chats' },
    { path: '/agents', icon: '🤖', label: 'Agents' },
    { path: '/app-builder', icon: '🧩', label: 'App Builder' },
    { path: '/files', icon: '📁', label: 'Files' },
    { path: '/training', icon: '📚', label: 'AI Training' },
    { path: '/skills', icon: '✨', label: 'Skills' },
    { path: '/integrations', icon: '🔗', label: 'Integrations' },
    { path: '/llm-config', icon: '🧠', label: 'LLM Config' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  const getPageTitle = () => {
    if (location.pathname === '/settings') return 'Settings';

    return navItems.find(item =>
      item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
    )?.label || 'Dashboard';
  };

  return (
    <div className="bg-app text-app h-screen w-screen">
      <div className={`h-full flex flex-col ${user ? 'pb-16' : ''}`}>
        <div className="bg-app-panel-soft border-app h-14 shrink-0 border-b flex items-center justify-between px-4 z-30 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <img
              src="/Rivrynsk.png"
              alt="Rivryn"
              className="h-12 w-auto"
            />
          </div>
          <h2 className="text-app-muted text-sm font-medium">
            {getPageTitle()}
          </h2>
          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={() => setConfirmSignOutOpen(true)}
                className="border-app text-app-muted hover-bg-app hover:text-app rounded-lg border px-3 py-1.5 text-xs transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() =>
                  navigate(
                    buildAuthRedirect(`${location.pathname}${location.search}`, {
                      context: 'Sign in to continue into RivRyn SideKick.',
                    })
                  )
                }
                className="px-3 py-1.5 bg-emerald-700 text-emerald-50 rounded-lg font-medium hover:bg-emerald-600 transition-colors text-xs"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        </div>

        <footer className="bg-app-panel-soft border-app text-app-muted shrink-0 border-t px-4 py-3 text-xs backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <span>© 2024 {BRANDING.appName}</span>
              <span className="hidden sm:inline">•</span>
              <span>Powered by AI</span>
            </div>
            <div className="flex items-center gap-3">
              <a href="#" className="hover:text-app transition-colors">Privacy</a>
              <span>•</span>
              <a href="#" className="hover:text-app transition-colors">Terms</a>
              <span>•</span>
              <a href="#" className="hover:text-app transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </div>

      {user ? (
        <div>
          <Navbar onNavigate={handleNavigate} onAction={handleAction} />
        </div>
      ) : null}

      {confirmSignOutOpen && (
        <div className="app-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-app-panel border-app w-full max-w-sm rounded-2xl border p-6 shadow-2xl">
            <h3 className="text-app text-lg font-semibold">Sign out?</h3>
            <p className="text-app-muted mt-2 text-sm">Are you sure you want to sign out of RivRyn SideKick?</p>
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setConfirmSignOutOpen(false)}
                className="border-app text-app-muted hover-bg-app flex-1 rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setConfirmSignOutOpen(false);
                  await signOut();
                  navigate('/');
                }}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-emerald-50 hover:bg-emerald-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
