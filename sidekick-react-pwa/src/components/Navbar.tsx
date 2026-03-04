import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  MessageSquare,
  Bot,
  ShoppingCart,
  BookOpen,
  Calendar,
  User,
  Settings,
  FlaskRound,
  X,
} from 'lucide-react';

interface NavbarProps {
  onNavigate?: (route: string) => void;
  onAction?: (action: string) => void;
}

interface MenuItemDef {
  id: string;
  icon: React.ReactNode;
  label: string;
  route?: string;
  color?: 'accent' | 'danger' | 'success' | 'warning';
}

const navItems: MenuItemDef[] = [
  { id: 'dashboard', icon: <Home className="w-6 h-6" />, label: 'Dashboard', route: '/' },
  { id: 'chat', icon: <MessageSquare className="w-6 h-6" />, label: 'Chat', route: '/chat', color: 'accent' },
  { id: 'agents', icon: <Bot className="w-6 h-6" />, label: 'Agents', route: '/agents' },
  { id: 'training', icon: <BookOpen className="w-6 h-6" />, label: 'Training', route: '/training' },
  { id: 'marketplace', icon: <ShoppingCart className="w-6 h-6" />, label: 'Marketplace', route: '/marketplace' },
  { id: 'schedule', icon: <Calendar className="w-6 h-6" />, label: 'Schedule', route: '/schedule' },
  { id: 'profile', icon: <User className="w-6 h-6" />, label: 'Profile', route: '/profile' },
  { id: 'settings', icon: <Settings className="w-6 h-6" />, label: 'Settings', route: '/settings' },
  { id: 'tests', icon: <FlaskRound className="w-6 h-6" />, label: 'Experiments', route: '/test' },
];

const quickActions = [
  { id: 'chat', icon: <MessageSquare className="w-5 h-5 text-white" />, label: 'Chat', route: '/chat', gradient: 'from-emerald-600 to-emerald-700' },
  { id: 'agents', icon: <Bot className="w-5 h-5 text-white" />, label: 'Agents', route: '/agents', gradient: 'from-slate-700 to-slate-600' },
  { id: 'marketplace', icon: <ShoppingCart className="w-5 h-5 text-white" />, label: 'Marketplace', route: '/marketplace', gradient: 'from-slate-700 to-slate-600' },
];

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onAction }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const handleNavigate = (route: string) => {
    if (onNavigate) onNavigate(route);
    setIsExpanded(false);
  };

  const handleAction = (action: string) => {
    if (onAction) onAction(action);
    setIsExpanded(false);
  };

  return (
    <nav
      ref={navbarRef}
      className={`fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 transition-all duration-300 ease-out ${
        isExpanded
          ? 'h-[75vh] rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.6)]'
          : 'h-16'
      }`}
    >
      <div
        className={`flex items-center justify-between h-16 px-4 transition-all duration-300 ${
          isExpanded ? 'opacity-0 pointer-events-none h-0' : 'opacity-100'
        }`}
      >
        <button
          onClick={() => handleNavigate('/')}
          className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center transition-all active:scale-95 hover:scale-105"
          aria-label="Dashboard"
        >
          <Home className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center gap-2">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleNavigate(action.route)}
              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center transition-all active:scale-95 hover:scale-105`}
              aria-label={action.label}
            >
              {action.icon}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsExpanded(true)}
          className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center transition-all active:scale-95 hover:scale-105"
          aria-label="Open navigation"
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span className="block w-full h-0.5 bg-white rounded-full" />
            <span className="block w-full h-0.5 bg-white rounded-full" />
            <span className="block w-full h-0.5 bg-white rounded-full" />
          </div>
        </button>
      </div>

      <div
        className={`flex flex-col h-full transition-all duration-300 ${
          isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <span className="text-lg font-semibold text-white">Navigate</span>
          <button
            onClick={() => setIsExpanded(false)}
            className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all active:scale-95"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {navItems.map((item) => (
              <MenuButton
                key={item.id}
                icon={item.icon}
                label={item.label}
                color={item.color}
                onClick={() => (item.route ? handleNavigate(item.route) : handleAction(item.id))}
              />
            ))}
          </div>
        </div>

        <div className="h-14 px-4 border-t border-slate-800 flex items-center justify-center">
          <span className="text-xs text-slate-500">Tap anywhere to close</span>
        </div>
      </div>
    </nav>
  );
};

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  color?: 'accent' | 'danger' | 'success' | 'warning';
  onClick: () => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({ icon, label, color, onClick }) => {
  const colorClasses = {
    accent: 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-transparent',
    danger: 'bg-red-500/20 text-red-400 border-red-500/30',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    default: 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white',
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all active:scale-95 min-h-[100px] justify-center ${
        color ? colorClasses[color] : colorClasses.default
      }`}
      aria-label={label}
    >
      <div className="w-8 h-8 flex items-center justify-center">{icon}</div>
      <span className="text-sm font-medium text-center leading-tight">{label}</span>
    </button>
  );
};
