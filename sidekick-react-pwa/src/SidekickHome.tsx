import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Shield,
  MessageSquare,
  Users,
  Calendar,
  FolderOpen,
  Lightbulb,
  Package,
  Sliders,
  Settings,
  GripVertical,
  Link as LinkIcon,
  Layout,
} from 'lucide-react';
import { CommandCenter } from './components/CommandCenter';
import { useAgents } from './hooks/useDatabase';
import { DeployAgentDialog } from './components/DeployAgentDialog';

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'idle';
  metric: string;
}

export const SidekickHome: React.FC = () => {
  const navigate = useNavigate();
  const { agents, loading: agentsLoading, toggleAgent, addAgent } = useAgents();
  const [showNewAgentDialog, setShowNewAgentDialog] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const handleToggleAgent = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    try {
      await toggleAgent(agentId);
    } catch (error) {
      console.error('Error toggling agent:', error);
    }
  };

  const handleDeployAgent = () => {
    setShowNewAgentDialog(true);
  };

  return (
    <div className="bg-slate-950 bg-[radial-gradient(circle_at_top_left,rgba(80,200,120,0.15),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(56,181,255,0.15),transparent_55%)]">
      {/* Command Center Dashboard */}
      <CommandCenter
        onNavigateToTasks={() => navigate('/tasks')}
        onNavigateToChat={() => navigate('/chat')}
        onNavigateToSettings={() => navigate('/settings')}
        onNavigateToFiles={() => navigate('/files')}
      />

      {/* Customizable Dashboard */}
      <DashboardSection
        agents={agents}
        agentsLoading={agentsLoading}
        onToggleAgent={handleToggleAgent}
        onDeployAgent={handleDeployAgent}
        navigate={navigate}
        isCustomizing={isCustomizing}
        setIsCustomizing={setIsCustomizing}
      />

      {/* Agent Dialog */}
      {showNewAgentDialog && (
        <DeployAgentDialog
          onClose={() => setShowNewAgentDialog(false)}
          onSubmit={async (name, agentType) => {
            try {
              console.log('SidekickHome: Attempting to deploy agent:', name, agentType);
              const success = await addAgent(name, agentType);
              console.log('SidekickHome: Deploy agent result:', success);
              if (!success) {
                console.error('SidekickHome: Agent deployment failed - check console for details');
                alert('Failed to deploy agent - check console for details');
              }
              return success;
            } catch (error: any) {
              console.error('SidekickHome: Error deploying agent:', error);
              alert(`Failed to deploy agent: ${error.message || 'Unknown error'}`);
              return false;
            }
          }}
        />
      )}
    </div>
  );
};

// Agent Card Component
interface AgentCardProps {
  agent: Agent;
  onToggle: () => void;
}

function AgentCard({ agent, onToggle }: AgentCardProps) {
  const isActive = agent.status === 'active';

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 hover:shadow-lg hover:shadow-slate-900/50 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          <span className="font-medium text-slate-100">{agent.name}</span>
        </div>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-100"
          aria-label={isActive ? 'Pause agent' : 'Start agent'}
        >
          {isActive ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>
      <p className="text-sm text-slate-400">{agent.metric}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-950/50 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
          {isActive ? 'Active' : 'Idle'}
        </span>
      </div>
    </div>
  );
}

type DashboardWidgetId =
  | 'agents'
  | 'chats'
  | 'tasks'
  | 'appBuilder'
  | 'files'
  | 'training'
  | 'skills'
  | 'llm'
  | 'integrations'
  | 'settings'
  | 'security';

interface DashboardWidgetDef {
  id: DashboardWidgetId;
  label: string;
  description: string;
  icon: React.ReactNode;
  route: string;
}

const DASHBOARD_WIDGETS: DashboardWidgetDef[] = [
  { id: 'agents', label: 'Agents', description: 'Deploy and manage agents', icon: <Users size={20} />, route: '/agents' },
  { id: 'chats', label: 'Chats', description: 'Conversations and history', icon: <MessageSquare size={20} />, route: '/chat' },
  { id: 'tasks', label: 'Tasks', description: 'Plan and prioritize', icon: <Calendar size={20} />, route: '/tasks' },
  { id: 'appBuilder', label: 'App Builder', description: 'Create new apps with onboarding', icon: <Layout size={20} />, route: '/app-builder' },
  { id: 'files', label: 'Files', description: 'Upload and organize assets', icon: <FolderOpen size={20} />, route: '/files' },
  { id: 'training', label: 'AI Training', description: 'Knowledge base and docs', icon: <Lightbulb size={20} />, route: '/training' },
  { id: 'skills', label: 'Skills', description: 'Reusable workflows', icon: <Package size={20} />, route: '/skills' },
  { id: 'integrations', label: 'Integrations', description: 'Connect GitHub + Google', icon: <LinkIcon size={20} />, route: '/integrations' },
  { id: 'llm', label: 'LLM Config', description: 'Providers and defaults', icon: <Sliders size={20} />, route: '/llm-config' },
  { id: 'settings', label: 'Settings', description: 'Account and app settings', icon: <Settings size={20} />, route: '/settings' },
  { id: 'security', label: 'Security', description: 'Keys, access, and audits', icon: <Shield size={20} />, route: '/settings' },
];

const DASHBOARD_STORAGE_KEY = 'sidekick.dashboard.widgets.v1';

function loadDashboardConfig(): { order: DashboardWidgetId[]; hidden: DashboardWidgetId[] } {
  try {
    const raw = localStorage.getItem(DASHBOARD_STORAGE_KEY);
    if (!raw) {
      const order = DASHBOARD_WIDGETS.map(w => w.id);
      return { order, hidden: [] };
    }
    const parsed = JSON.parse(raw) as { order?: DashboardWidgetId[]; hidden?: DashboardWidgetId[] };
    const order = (parsed.order || []).filter(id => DASHBOARD_WIDGETS.some(w => w.id === id));
    const missing = DASHBOARD_WIDGETS.map(w => w.id).filter(id => !order.includes(id));
    const hidden = (parsed.hidden || []).filter(id => DASHBOARD_WIDGETS.some(w => w.id === id));
    const fullOrder = [...order, ...missing];
    return { order: fullOrder, hidden };
  } catch {
    const order = DASHBOARD_WIDGETS.map(w => w.id);
    return { order, hidden: [] };
  }
}

function saveDashboardConfig(order: DashboardWidgetId[], hidden: DashboardWidgetId[]) {
  localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify({ order, hidden }));
}

function DashboardSection({
  agents,
  agentsLoading,
  onToggleAgent,
  onDeployAgent,
  navigate,
  isCustomizing,
  setIsCustomizing,
}: {
  agents: Agent[];
  agentsLoading: boolean;
  onToggleAgent: (id: string) => void;
  onDeployAgent: () => void;
  navigate: (path: string) => void;
  isCustomizing: boolean;
  setIsCustomizing: (value: boolean) => void;
}) {
  const [widgetOrder, setWidgetOrder] = useState<DashboardWidgetId[]>(() => loadDashboardConfig().order);
  const [hidden, setHidden] = useState<Set<DashboardWidgetId>>(
    () => new Set(loadDashboardConfig().hidden)
  );

  const widgets = useMemo(() => {
    const map = new Map(DASHBOARD_WIDGETS.map(w => [w.id, w]));
    return widgetOrder.map(id => map.get(id)).filter(Boolean) as DashboardWidgetDef[];
  }, [widgetOrder]);

  const updateOrder = (next: DashboardWidgetId[]) => {
    setWidgetOrder(next);
    saveDashboardConfig(next, Array.from(hidden));
  };

  const moveWidget = (id: DashboardWidgetId, direction: 'up' | 'down') => {
    const idx = widgetOrder.indexOf(id);
    if (idx < 0) return;
    const nextIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= widgetOrder.length) return;
    const next = [...widgetOrder];
    const [item] = next.splice(idx, 1);
    next.splice(nextIdx, 0, item);
    updateOrder(next);
  };

  const toggleHidden = (id: DashboardWidgetId) => {
    setHidden(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveDashboardConfig(widgetOrder, Array.from(next));
      return next;
    });
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto mt-8 pb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Dashboard</h3>
          <p className="text-sm text-slate-400">Customize what you see first.</p>
        </div>
        <button
          onClick={() => setIsCustomizing(!isCustomizing)}
          className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-slate-100 hover:border-slate-500 transition-colors text-sm"
        >
          {isCustomizing ? 'Done' : 'Customize'}
        </button>
      </div>

      {isCustomizing && (
        <div className="mb-6 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400 mb-3">Reorder and hide widgets.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {widgets.map((widget, idx) => (
              <div
                key={widget.id}
                className="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <GripVertical size={16} className="text-slate-500" />
                  <span className="text-sm text-slate-200">{widget.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveWidget(widget.id, 'up')}
                    disabled={idx === 0}
                    className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40"
                  >
                    Up
                  </button>
                  <button
                    onClick={() => moveWidget(widget.id, 'down')}
                    disabled={idx === widgets.length - 1}
                    className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40"
                  >
                    Down
                  </button>
                  <button
                    onClick={() => toggleHidden(widget.id)}
                    className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-300"
                  >
                    {hidden.has(widget.id) ? 'Show' : 'Hide'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {widgets.filter(w => !hidden.has(w.id)).map(widget => (
          <button
            key={widget.id}
            onClick={() => navigate(widget.route)}
            className="text-left bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-3 text-emerald-400">
              {widget.icon}
              <span className="text-slate-100 font-semibold">{widget.label}</span>
            </div>
            <p className="text-sm text-slate-400 mt-2">{widget.description}</p>
          </button>
        ))}
      </div>

      {/* Agents Snapshot */}
      <div className="mt-8 pt-8 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">Agents</h3>
          <button
            onClick={() => navigate('/agents')}
            className="text-xs text-slate-400 hover:text-slate-100 transition-colors"
          >
            View all →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {agentsLoading ? (
            <p className="text-slate-400 text-sm col-span-4">Loading agents...</p>
          ) : agents.length === 0 ? (
            <p className="text-slate-400 text-sm col-span-4">No agents deployed</p>
          ) : (
            agents.slice(0, 4).map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onToggle={() => onToggleAgent(agent.id)}
              />
            ))
          )}
        </div>

        <button
          onClick={onDeployAgent}
          className="w-full mt-4 py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-slate-600 hover:text-slate-100 transition-colors font-medium"
        >
          + Deploy New Agent
        </button>
      </div>
    </div>
  );
}

export default SidekickHome;
