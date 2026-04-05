/**
 * AgentsPage Component
 * Full agents management page with list, filters, and deployment
 */

import React, { useState } from 'react';
import { Pause, Plus, Trash2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAgents } from '../hooks/useDatabase';
import { DeployAgentDialog } from '../components/DeployAgentDialog';
import { enqueueAgentRun } from '../services/agents/runner';
import { requestAction } from '../services/actions';

const JOB_ACTIONS = [
  {
    value: 'github.repo.read',
    label: 'GitHub Read Repo',
    sample: '{\n  "owner": "octocat",\n  "repo": "Hello-World"\n}',
  },
  {
    value: 'github.repo.write',
    label: 'GitHub Write File',
    sample:
      '{\n  "owner": "octocat",\n  "repo": "Hello-World",\n  "path": "notes.txt",\n  "message": "Update notes",\n  "content": "hello from RivRyn SideKick"\n}',
  },
  {
    value: 'gmail.send',
    label: 'Send Gmail',
    sample:
      '{\n  "to": "someone@example.com",\n  "subject": "RivRyn SideKick test",\n  "body": "Message body"\n}',
  },
  {
    value: 'calendar.create',
    label: 'Create Calendar Event',
    sample:
      '{\n  "summary": "RivRyn SideKick Meeting",\n  "start": { "dateTime": "2026-03-13T10:00:00-07:00" },\n  "end": { "dateTime": "2026-03-13T10:30:00-07:00" },\n  "addMeet": true\n}',
  },
  {
    value: 'rivryn.project.read',
    label: 'Rivryn API Call',
    sample:
      '{\n  "endpoint": "projects",\n  "method": "GET"\n}',
  },
  {
    value: 'code.exec',
    label: 'Local Code Command',
    sample:
      '{\n  "command": "npm",\n  "args": ["run", "build"],\n  "cwd": "/absolute/workspace/path"\n}',
  },
];

export const AgentsPage: React.FC = () => {
  const { agents, loading, toggleAgent, addAgent, deleteAgent, reload } = useAgents();
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'idle'>('all');
  const [jobComposerAgentId, setJobComposerAgentId] = useState<string | null>(null);
  const [jobAction, setJobAction] = useState<string>(JOB_ACTIONS[0].value);
  const [jobParams, setJobParams] = useState<string>(JOB_ACTIONS[0].sample);

  const filteredAgents = agents.filter(agent => {
    if (filterStatus === 'all') return true;
    return agent.status === filterStatus;
  });

  const handleToggleAgent = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    try {
      await toggleAgent(agentId);
      toast.success(agent.status === 'active' ? 'Agent paused' : 'Agent activated!');
    } catch (error: any) {
      toast.error('Failed to update agent');
      console.error('Error toggling agent:', error);
    }
  };

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Are you sure you want to delete "${agentName}"?`)) return;

    try {
      const success = await deleteAgent(agentId);
      if (success) {
        toast.success('Agent deleted successfully');
      } else {
        toast.error('Failed to delete agent');
      }
    } catch (error: any) {
      toast.error('Failed to delete agent');
      console.error('Error deleting agent:', error);
    }
  };

  const activeAgentsCount = agents.filter(a => a.status === 'active').length;
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Agents</h1>
          <p className="text-slate-400">Manage your AI agents and their activities</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900/60 rounded-lg p-6 border border-slate-800">
            <p className="text-sm text-slate-400 mb-1">Total Agents</p>
            <p className="text-3xl font-semibold">{agents.length}</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-6 border border-slate-800">
            <p className="text-sm text-slate-400 mb-1">Active Agents</p>
            <p className="text-3xl font-semibold text-emerald-400">{activeAgentsCount}</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-6 border border-slate-800">
            <p className="text-sm text-slate-400 mb-1">Idle Agents</p>
            <p className="text-3xl font-semibold text-slate-400">{agents.length - activeAgentsCount}</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              All ({agents.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Active ({activeAgentsCount})
            </button>
            <button
              onClick={() => setFilterStatus('idle')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'idle'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Idle ({agents.length - activeAgentsCount})
            </button>
          </div>

          <button
            onClick={() => setShowDeployDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
          >
            <Plus size={20} />
            Deploy New Agent
          </button>
        </div>

        {/* Agents List */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">
            Loading agents...
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              {filterStatus === 'all' ? 'No agents deployed yet' : `No ${filterStatus} agents`}
            </div>
            {filterStatus === 'all' && (
              <button
                onClick={() => setShowDeployDialog(true)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
              >
                Deploy Your First Agent
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map(agent => (
              <div
                key={agent.id}
                className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${agent.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    <h3 className="font-semibold text-lg">{agent.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleAgent(agent.id)}
                      className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-100"
                      aria-label={agent.status === 'active' ? 'Pause agent' : 'Start agent'}
                    >
                      {agent.status === 'active' ? (
                        <Pause size={18} />
                      ) : (
                        <img
                          src="/Rlogo.png"
                          alt="Rivryn"
                          className="w-8 h-8"
                        />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteAgent(agent.id, agent.name)}
                      className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                      aria-label="Delete agent"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Status</span>
                    <span className={agent.status === 'active' ? 'text-emerald-400' : 'text-slate-400'}>
                      {agent.status === 'active' ? 'Active' : 'Idle'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Performance</span>
                    <span className="text-slate-300">{agent.metric}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setJobComposerAgentId(agent.id);
                      const defaultAction = JOB_ACTIONS[0];
                      setJobAction(defaultAction.value);
                      setJobParams(defaultAction.sample);
                    }}
                    className="py-2 border border-emerald-600/60 rounded-lg text-emerald-300 hover:border-emerald-500 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    disabled={runningAgentId === agent.id}
                  >
                    <Zap size={14} />
                    Run Now
                  </button>
                  <button
                    onClick={() => toast('View details coming soon!')}
                    className="py-2 border border-slate-700 rounded-lg text-slate-400 hover:border-slate-600 hover:text-slate-100 transition-colors text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deploy Agent Dialog */}
      {showDeployDialog && (
        <DeployAgentDialog
          onClose={() => setShowDeployDialog(false)}
          onSubmit={async (name, agentType) => {
            const loadingToast = toast.loading('Deploying agent...');
            try {
              const success = await addAgent(name, agentType);
              if (success) {
                toast.success('Agent deployed successfully!', { id: loadingToast });
                reload();
              } else {
                toast.error('Failed to deploy agent', { id: loadingToast });
              }
              return success;
            } catch (error: any) {
              toast.error(`Error: ${error.message}`, { id: loadingToast });
              return false;
            }
          }}
        />
      )}

      {jobComposerAgentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-100">Queue Agent Job</h3>
            <p className="mt-2 text-sm text-slate-400">
              Choose a capability action and provide JSON params. `gmail.send` and `calendar.create` now go through approval first. `code.exec` jobs require the local worker.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm text-slate-300">Action</label>
                <select
                  value={jobAction}
                  onChange={(e) => {
                    const selected = JOB_ACTIONS.find((item) => item.value === e.target.value) || JOB_ACTIONS[0];
                    setJobAction(selected.value);
                    setJobParams(selected.sample);
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                >
                  {JOB_ACTIONS.map((action) => (
                    <option key={action.value} value={action.value}>
                      {action.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-300">Params JSON</label>
                <textarea
                  value={jobParams}
                  onChange={(e) => setJobParams(e.target.value)}
                  className="mt-2 w-full min-h-[220px] rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setJobComposerAgentId(null)}
                className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!jobComposerAgentId || runningAgentId) return;

                  let parsedParams: Record<string, unknown>;
                  try {
                    parsedParams = JSON.parse(jobParams);
                  } catch {
                    toast.error('Params must be valid JSON');
                    return;
                  }

                  setRunningAgentId(jobComposerAgentId);
                  const res = jobAction === 'gmail.send' || jobAction === 'calendar.create'
                    ? await requestAction(jobAction, {
                        ...parsedParams,
                        _sidekick_agent_id: jobComposerAgentId,
                      })
                    : await enqueueAgentRun(jobComposerAgentId, {
                        capability_action: jobAction,
                        params: parsedParams,
                      });
                  setRunningAgentId(null);

                  if (res.success) {
                    toast.success(
                      jobAction === 'gmail.send' || jobAction === 'calendar.create'
                        ? 'Action submitted for approval. Approve it in Settings to queue the agent run.'
                        : jobAction.startsWith('code.')
                        ? 'Local code job queued. Start the local worker to process it.'
                        : 'Agent job queued'
                    );
                    setJobComposerAgentId(null);
                  } else {
                    toast.error(res.error || 'Failed to queue job');
                  }
                }}
                disabled={runningAgentId === jobComposerAgentId}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-emerald-50 hover:bg-emerald-500 disabled:opacity-50"
              >
                {runningAgentId === jobComposerAgentId ? 'Queueing...' : 'Queue Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
