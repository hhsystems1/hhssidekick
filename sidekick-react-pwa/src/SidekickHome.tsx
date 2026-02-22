import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Pause } from 'lucide-react';
import { CommandCenter } from './components/CommandCenter';
import { useAgents } from './hooks/useDatabase';
import { DeployAgentDialog } from './components/DeployAgentDialog';
import { useState } from 'react';

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
        onNavigateToSchedule={() => navigate('/app/schedule')}
        onNavigateToChat={() => navigate('/app/chat')}
        onNavigateToSettings={() => navigate('/app/settings')}
      />

      {/* Agents Section */}
      <div className="p-4 lg:p-8 max-w-7xl mx-auto mt-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Command Center Columns 1-3 already rendered above, now add Agents as 4th section */}

          {/* Agents Column */}
          <div className="lg:col-span-3 space-y-4 pt-8 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">Agents</h3>
              <Link
                to="/app/agents"
                className="text-xs text-slate-400 hover:text-slate-100 transition-colors"
              >
                View all →
              </Link>
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
                    onToggle={() => handleToggleAgent(agent.id)}
                  />
                ))
              )}
            </div>

            <button
              onClick={handleDeployAgent}
              className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-slate-600 hover:text-slate-100 transition-colors font-medium"
            >
              + Deploy New Agent
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-800">
          <StatCard label="Active Campaigns" value="3" onClick={() => console.log('View campaigns')} />
          <StatCard label="Leads This Week" value="47" onClick={() => console.log('View leads')} />
          <StatCard label="SOPs Created" value="12" onClick={() => console.log('View SOPs')} />
          <StatCard label="Training Complete" value="68%" onClick={() => console.log('View training')} />
        </div>
      </div>

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
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 text-emerald-300 flex items-center justify-center text-base font-semibold">
            R
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            <span className="font-medium text-slate-100">{agent.name}</span>
          </div>
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

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string;
  onClick: () => void;
}

function StatCard({ label, value, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-slate-900/60 rounded-xl p-4 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
    >
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}

export default SidekickHome;
