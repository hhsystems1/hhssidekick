/**
 * Layout Component
 * Main layout with sidebar navigation for all pages
 */

import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, ArrowLeft, Settings, User } from 'lucide-react';
import { BRANDING, getLogo } from './config/branding';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './context/AuthContext';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navItems = [
    { path: '/', icon: '🏠', label: 'Dashboard', exact: true },
    { path: '/chat', icon: '💬', label: 'Chat' },
    { path: '/agents', icon: '🤖', label: 'Agents' },
    { path: '/training', icon: '📚', label: 'Training' },
    { path: '/marketplace', icon: '🛒', label: 'Marketplace' },
    { path: '/profile', icon: '👤', label: 'Profile' },
    { path: '/test', icon: '🧪', label: 'Tests' },
  ];

  const getPageTitle = () => {
    // Special pages that need custom titles
    if (location.pathname === '/schedule') return 'Schedule';
    if (location.pathname === '/settings') return 'Settings';
    
    return navItems.find(item =>
      item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
    )?.label || 'Dashboard';
  };

  const isHomePage = location.pathname === '/';
  const canGoBack = !isHomePage;

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200 ease-in-out z-50 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
            <span className="text-2xl">{getLogo()}</span>
            <h1 className="text-2xl font-bold text-slate-100">{BRANDING.appName}</h1>
          </div>

          {/* User info or sign in */}
          <div className="px-4 py-4 border-b border-slate-800">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center">
                  <User size={20} className="text-emerald-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {user.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="w-full py-2 px-4 bg-emerald-700 text-emerald-50 rounded-lg font-medium hover:bg-emerald-600 transition-colors text-sm"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-slate-950/60 border border-slate-800 text-slate-100'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Bottom action */}
          <div className="p-4 border-t border-slate-800 space-y-2">
            <button
              onClick={() => navigate('/settings')}
              className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Settings size={18} className="text-slate-400" />
              <span className="font-medium text-slate-400">Settings</span>
            </button>
            <NavLink
              to="/chat"
              onClick={() => setSidebarOpen(false)}
              className="block w-full py-3 px-4 bg-emerald-700 text-emerald-50 rounded-lg font-medium hover:bg-emerald-600 transition-colors text-center"
            >
              New Brain Dump
            </NavLink>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-64 h-full flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden h-16 border-b border-slate-800 flex items-center px-4 bg-slate-950/60 z-30 shrink-0">
          {canGoBack ? (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-slate-100 hover:text-slate-300 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
          ) : (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 text-slate-100"
            >
              <Menu size={24} />
            </button>
          )}
          <h2 className="flex-1 text-center text-lg font-semibold text-slate-100">
            {getPageTitle()}
          </h2>
          <div className="w-10" />
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
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

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
};
