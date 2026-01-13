/**
 * Layout Component
 * Main layout with sidebar navigation for all pages
 */

import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { BRANDING, getLogo } from './config/branding';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', icon: '🏠', label: 'Dashboard', exact: true },
    { path: '/chat', icon: '💬', label: 'Chat' },
    { path: '/agents', icon: '🤖', label: 'Agents' },
    { path: '/training', icon: '📚', label: 'Training' },
    { path: '/marketplace', icon: '🛒', label: 'Marketplace' },
    { path: '/profile', icon: '👤', label: 'Profile' },
    { path: '/test', icon: '🧪', label: 'Tests' },
  ];

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

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-slate-950/60 border border-slate-800'
                      : 'hover:bg-slate-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="text-xl">{item.icon}</span>
                    <span className={`font-medium ${isActive ? 'text-slate-100' : 'text-slate-400'}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Bottom action */}
          <div className="p-4 border-t border-slate-800">
            <NavLink
              to="/chat"
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
      <div className="lg:pl-64 h-full overflow-auto">
        {/* Top bar - only show on mobile */}
        <div className="lg:hidden h-16 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950/60 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-100"
          >
            <Menu size={24} />
          </button>
          <h2 className="text-xl font-semibold text-slate-100">
            {navItems.find(item =>
              item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
            )?.label || 'Dashboard'}
          </h2>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Page Content */}
        <Outlet />
      </div>
    </div>
  );
};
