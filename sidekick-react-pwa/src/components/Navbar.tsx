import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Eye,
  FolderOpen,
  X,
  MessageSquare,
  Terminal,
  Settings,
  ChevronLeft,
  Home,
  Code,
  Cpu,
  Globe,
  Database,
  Upload,
  Lock,
  Zap,
  GitBranch,
  Bug,
  Package,
  Cloud,
  Shield,
  Layout,
  Users,
  Key,
  Box,
  Link as LinkIcon,
  Lightbulb,
} from 'lucide-react';

interface NavbarProps {
  onNavigate?: (page: string) => void;
  onAction?: (action: string) => void;
}

type MenuView = 'main' | 'development' | 'ai' | 'project' | 'tools';

interface MenuItemDef {
  id: string;
  icon: React.ReactNode;
  label: string;
  color?: 'accent' | 'danger' | 'success' | 'warning';
  view?: MenuView;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onAction }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentView, setCurrentView] = useState<MenuView>('main');
  const navbarRef = useRef<HTMLDivElement>(null);

  // Menu definitions
  const mainMenuItems: MenuItemDef[] = [
    { id: 'development', icon: <Code className="w-5 h-5" />, label: 'Development', view: 'development' },
    { id: 'ai', icon: <Cpu className="w-5 h-5" />, label: 'AI & Intelligence', view: 'ai', color: 'accent' },
    { id: 'project', icon: <Layout className="w-5 h-5" />, label: 'Project', view: 'project' },
    { id: 'tools', icon: <Zap className="w-5 h-5" />, label: 'Tools & More', view: 'tools' },
  ];

  const developmentItems: MenuItemDef[] = [
    { id: 'files', icon: <FolderOpen className="w-5 h-5" />, label: 'Files' },
    { id: 'code', icon: <Code className="w-5 h-5" />, label: 'Editor' },
    { id: 'terminal', icon: <Terminal className="w-5 h-5" />, label: 'Terminal' },
    { id: 'git', icon: <GitBranch className="w-5 h-5" />, label: 'Git' },
    { id: 'debug', icon: <Bug className="w-5 h-5" />, label: 'Debug' },
    { id: 'packages', icon: <Package className="w-5 h-5" />, label: 'Packages' },
  ];

  const aiItems: MenuItemDef[] = [
    { id: 'agent-chat', icon: <MessageSquare className="w-5 h-5" />, label: 'Agent Chat', color: 'accent' },
    { id: 'skills-ai', icon: <Lightbulb className="w-5 h-5" />, label: 'Skills AI' },
    { id: 'mcp-servers', icon: <Box className="w-5 h-5" />, label: 'MCP Servers' },
  ];

  const projectItems: MenuItemDef[] = [
    { id: 'deploy', icon: <Upload className="w-5 h-5" />, label: 'Deploy' },
    { id: 'database', icon: <Database className="w-5 h-5" />, label: 'Database' },
    { id: 'auth', icon: <Lock className="w-5 h-5" />, label: 'Auth' },
    { id: 'secrets', icon: <Key className="w-5 h-5" />, label: 'Secrets' },
    { id: 'users', icon: <Users className="w-5 h-5" />, label: 'Team' },
    { id: 'analytics', icon: <Layout className="w-5 h-5" />, label: 'Analytics' },
  ];

  const toolsItems: MenuItemDef[] = [
    { id: 'api', icon: <Globe className="w-5 h-5" />, label: 'API' },
    { id: 'cloud', icon: <Cloud className="w-5 h-5" />, label: 'Cloud' },
    { id: 'security', icon: <Shield className="w-5 h-5" />, label: 'Security' },
    { id: 'integrations', icon: <LinkIcon className="w-5 h-5" />, label: 'Integrations' },
    { id: 'settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
    { id: 'exit-project', icon: <X className="w-5 h-5" />, label: 'Exit', color: 'danger' },
  ];

  // Close navbar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setCurrentView('main');
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const handleNavigate = (page: string) => {
    if (onNavigate) onNavigate(page);
    setIsExpanded(false);
    setCurrentView('main');
  };

  const handleAction = (action: string) => {
    if (onAction) onAction(action);
    setIsExpanded(false);
    setCurrentView('main');
  };

  const getCurrentItems = (): MenuItemDef[] => {
    switch (currentView) {
      case 'development': return developmentItems;
      case 'ai': return aiItems;
      case 'project': return projectItems;
      case 'tools': return toolsItems;
      default: return mainMenuItems;
    }
  };

  const getViewTitle = (): string => {
    switch (currentView) {
      case 'development': return 'Development';
      case 'ai': return 'AI & Intelligence';
      case 'project': return 'Project Management';
      case 'tools': return 'Tools & Integrations';
      default: return 'Menu';
    }
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
      {/* Quick Actions Bar - Compact Mode */}
      <div
        className={`flex items-center justify-between h-16 px-4 transition-all duration-300 ${
          isExpanded ? 'opacity-0 pointer-events-none h-0' : 'opacity-100'
        }`}
      >
        {/* Left: Home - Slate gradient */}
        <button
          onClick={() => handleNavigate('dashboard')}
          className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center transition-all active:scale-95 hover:scale-105"
        >
          <Home className="w-5 h-5 text-white" />
        </button>

        {/* Center: Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Run - Emerald gradient */}
          <button
            onClick={() => handleAction('run')}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center transition-all active:scale-95 hover:scale-105"
          >
            <Play className="w-5 h-5 text-white fill-white" />
          </button>

          {/* Preview - Slate gradient */}
          <button
            onClick={() => handleAction('preview')}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center transition-all active:scale-95 hover:scale-105"
          >
            <Eye className="w-5 h-5 text-white" />
          </button>

          {/* Files - Slate gradient */}
          <button
            onClick={() => handleNavigate('files')}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center transition-all active:scale-95 hover:scale-105"
          >
            <FolderOpen className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Right: Menu Toggle */}
        <button
          onClick={() => setIsExpanded(true)}
          className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center transition-all active:scale-95 hover:scale-105"
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span className="block w-full h-0.5 bg-white rounded-full" />
            <span className="block w-full h-0.5 bg-white rounded-full" />
            <span className="block w-full h-0.5 bg-white rounded-full" />
          </div>
        </button>
      </div>

      {/* Expanded Menu Panel */}
      <div
        className={`h-full flex flex-col transition-all duration-300 ${
          isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          {currentView !== 'main' ? (
            <button
              onClick={() => setCurrentView('main')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
          ) : (
            <span className="text-lg font-semibold text-white">{getViewTitle()}</span>
          )}
          <button
            onClick={() => {
              setIsExpanded(false);
              setCurrentView('main');
            }}
            className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {getCurrentItems().map((item) => (
              <MenuButton
                key={item.id}
                icon={item.icon}
                label={item.label}
                color={item.color}
                onClick={() => {
                  if (item.view) {
                    setCurrentView(item.view);
                  } else if (['files', 'terminal', 'settings'].includes(item.id)) {
                    handleNavigate(item.id);
                  } else {
                    handleAction(item.id);
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="h-14 px-4 border-t border-slate-800 flex items-center justify-center">
          <span className="text-xs text-slate-500">
            {currentView === 'main' ? 'Select a category' : 'Select an option'}
          </span>
        </div>
      </div>
    </nav>
  );
};

// Menu Button Component
interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  color?: 'accent' | 'danger' | 'success' | 'warning';
  onClick: () => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({ icon, label, color, onClick }) => {
  const colorClasses = {
    accent: "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-transparent",
    danger: "bg-red-500/20 text-red-400 border-red-500/30",
    success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    default: "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white",
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all active:scale-95 min-h-[100px] justify-center ${
        color ? colorClasses[color] : colorClasses.default
      }`}
    >
      <div className="w-8 h-8">{icon}</div>
      <span className="text-sm font-medium text-center leading-tight">{label}</span>
    </button>
  );
};
