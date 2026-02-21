/**
 * Layout Component
 * Main layout with sidebar navigation for all pages
 */

import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BRANDING, getLogo } from './config/branding';
import { AuthModal } from './components/AuthModal';
import { Navbar } from './components/Navbar';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

export const Layout: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
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
    <div className="h-screen w-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {/* Main Content */}
      <div className="h-full flex flex-col pb-16">
        {/* Header */}
        <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950/60 z-30 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getLogo()}</span>
            <h1 className="text-lg font-bold text-slate-100">{BRANDING.appName}</h1>
          </div>
          <h2 className="text-sm font-medium text-slate-400">
            {getPageTitle()}
          </h2>
          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={async () => {
                  const confirmSignOut = window.confirm('Sign out of Rivryn Sidekick?');
                  if (!confirmSignOut) return;
                  await signOut();
                  navigate('/');
                }}
                className="px-3 py-1.5 border border-slate-700 rounded-lg text-xs text-slate-300 hover:border-slate-500 hover:text-slate-100 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-700 text-emerald-50 rounded-lg font-medium hover:bg-emerald-600 transition-colors text-xs"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400 shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <span>© 2024 {BRANDING.appName}</span>
              <span className="hidden sm:inline">•</span>
              <span>Powered by AI</span>
            </div>
            <div className="flex items-center gap-3">
              <a href="#" className="hover:text-slate-200 transition-colors">Privacy</a>
              <span>•</span>
              <a href="#" className="hover:text-slate-200 transition-colors">Terms</a>
              <span>•</span>
              <a href="#" className="hover:text-slate-200 transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Navbar */}
      <div>
        <Navbar onNavigate={handleNavigate} onAction={handleAction} />
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
};
