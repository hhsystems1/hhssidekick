import React, { useState, useEffect } from 'react';
import { Menu, ChevronRight, Play, Pause, Plus, CheckCircle, Circle, X } from 'lucide-react';
import { useTasks, useAgents, useCalendarEvents } from './hooks/useDatabase';
import { NewTaskDialog } from './components/NewTaskDialog';
import { DeployAgentDialog } from './components/DeployAgentDialog';
import { BRANDING, getLogo } from './config/branding';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'idle';
  metric: string;
}

interface SidekickHomeProps {
  onNavigate?: (view: 'home' | 'chat' | 'test') => void;
}

export const SidekickHome: React.FC<SidekickHomeProps> = ({ onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [todayLabel, setTodayLabel] = useState('');
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showNewAgentDialog, setShowNewAgentDialog] = useState(false);
  const [showBrainDumpDialog, setShowBrainDumpDialog] = useState(false);

  // Load data from database
  const { tasks, loading: tasksLoading, toggleTask, addTask } = useTasks();
  const { agents, loading: agentsLoading, toggleAgent, addAgent } = useAgents();
  const { events, nextEvent, loading: eventsLoading } = useCalendarEvents();

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    setTodayLabel(formatted);
  }, []);

  // Navigation handlers
  const handleNavigate = (page: string) => {
    console.log(`Navigating to: ${page}`);

    // Show "Coming Soon" message for features not yet implemented
    const comingSoonFeatures = ['agents', 'training', 'marketplace', 'profile', 'campaigns', 'leads', 'sops'];
    if (comingSoonFeatures.includes(page.toLowerCase())) {
      alert(`${page.charAt(0).toUpperCase() + page.slice(1)} feature coming soon!`);
      return;
    }
  };

  // Task handlers
  const handleAddTask = () => {
    setShowNewTaskDialog(true);
  };

  const handleTaskClick = (taskId: string) => {
    console.log(`Opening task: ${taskId}`);
    // TODO: Implement task detail view in future update
    alert('Task detail view coming soon!');
  };

  const handleDeployAgent = () => {
    setShowNewAgentDialog(true);
  };

  // Calendar handlers
  const handleEventClick = (eventTitle: string) => {
    console.log(`Opening event: ${eventTitle}`);
    // TODO: Implement event detail view in future update
    alert(`Event details for "${eventTitle}" coming soon!`);
  };

  // Brain dump handler
  const handleBrainDump = () => {
    setShowBrainDumpDialog(true);
  };

  const completedTasksCount = tasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top_left,rgba(80,200,120,0.15),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(56,181,255,0.15),transparent_55%)]">
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
            <NavItem icon="🏠" label="Dashboard" active />
            <NavItem icon="💬" label="Chat" onClick={() => onNavigate?.('chat')} />
            <NavItem icon="🤖" label="Agents" onClick={() => handleNavigate('agents')} />
            <NavItem icon="📚" label="Training" onClick={() => handleNavigate('training')} />
            <NavItem icon="🛒" label="Marketplace" onClick={() => handleNavigate('marketplace')} />
            <NavItem icon="👤" label="Profile" onClick={() => handleNavigate('profile')} />
            <NavItem icon="🧪" label="Tests" onClick={() => onNavigate?.('test')} />
          </nav>

          {/* Bottom action */}
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleBrainDump}
              className="w-full py-3 px-4 bg-emerald-700 text-emerald-50 rounded-lg font-medium hover:bg-emerald-600 transition-colors"
            >
              New Brain Dump
            </button>
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
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-4 lg:px-8 bg-slate-950/60 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-slate-100"
          >
            <Menu size={24} />
          </button>
          <h2 className="text-xl font-semibold text-slate-100">Dashboard</h2>
          <button
            onClick={() => handleNavigate('profile')}
            className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
            aria-label="Profile"
          />
        </div>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* 3 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Column 1: Tasks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-100">Today's Tasks</h3>
                <button
                  onClick={handleAddTask}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-100"
                  aria-label="Add task"
                >
                  <Plus size={20} />
                </button>
              </div>

              {tasksLoading ? (
                <div className="text-slate-400 text-sm">Loading tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="text-slate-400 text-sm">No tasks for today</div>
              ) : (
                tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTask(task.id)}
                    onClick={() => handleTaskClick(task.id)}
                  />
                ))
              )}

              <div className="pt-4">
                <p className="text-sm text-slate-500">{completedTasksCount} of {tasks.length} tasks complete</p>
              </div>
            </div>

            {/* Column 2: Calendar/Schedule */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-100">Schedule</h3>
                <span className="text-sm text-slate-500">{todayLabel}</span>
              </div>

              {eventsLoading ? (
                <div className="text-slate-400 text-sm">Loading events...</div>
              ) : events.length === 0 ? (
                <div className="text-slate-400 text-sm">No events today</div>
              ) : (
                events.map(event => (
                  <CalendarEvent
                    key={event.id}
                    time={event.time}
                    title={event.title}
                    attendees={event.attendees}
                    onClick={() => handleEventClick(event.title)}
                  />
                ))
              )}

              {nextEvent && (
                <div className="bg-slate-900/60 rounded-xl p-6 mt-6 border border-slate-800">
                  <p className="text-sm text-slate-400 mb-2">Next up</p>
                  <p className="font-medium text-slate-100">{nextEvent.title}</p>
                  <p className="text-sm text-slate-500 mt-1">Coming soon</p>
                </div>
              )}
            </div>

            {/* Column 3: Agent Activity */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-100">Agents</h3>
                <button
                  onClick={() => handleNavigate('agents')}
                  className="text-sm text-slate-400 hover:text-slate-100 transition-colors"
                >
                  View all
                </button>
              </div>

              {agentsLoading ? (
                <div className="text-slate-400 text-sm">Loading agents...</div>
              ) : agents.length === 0 ? (
                <div className="text-slate-400 text-sm">No agents deployed</div>
              ) : (
                agents.map(agent => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onToggle={() => toggleAgent(agent.id)}
                  />
                ))
              )}

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
            <StatCard label="Active Campaigns" value="3" onClick={() => handleNavigate('campaigns')} />
            <StatCard label="Leads This Week" value="47" onClick={() => handleNavigate('leads')} />
            <StatCard label="SOPs Created" value="12" onClick={() => handleNavigate('sops')} />
            <StatCard label="Training Complete" value="68%" onClick={() => handleNavigate('training')} />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {showNewTaskDialog && (
        <NewTaskDialog
          onClose={() => setShowNewTaskDialog(false)}
          onSubmit={async (title, priority) => {
            const success = await addTask(title, priority);
            if (success) {
              console.log('Task added successfully');
            }
            return success;
          }}
        />
      )}

      {showNewAgentDialog && (
        <DeployAgentDialog
          onClose={() => setShowNewAgentDialog(false)}
          onSubmit={async (name, agentType) => {
            const success = await addAgent(name, agentType);
            if (success) {
              console.log('Agent deployed successfully');
            }
            return success;
          }}
        />
      )}

      {showBrainDumpDialog && (
        <Dialog title="New Brain Dump" onClose={() => setShowBrainDumpDialog(false)}>
          <div className="space-y-4">
            <p className="text-slate-300">
              Brain Dump lets you have an open conversation with your AI agents.
            </p>
            <button
              onClick={() => {
                setShowBrainDumpDialog(false);
                onNavigate?.('chat');
              }}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
            >
              Open Chat
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
};

// Components
function NavItem({ icon, label, active = false, onClick }: { icon: string; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-slate-950/60 border border-slate-800' : 'hover:bg-slate-800'}`}>
      <span className="text-xl">{icon}</span>
      <span className={`font-medium ${active ? 'text-slate-100' : 'text-slate-400'}`}>{label}</span>
    </button>
  );
}

interface TaskCardProps {
  task: Task;
  onToggle: () => void;
  onClick: () => void;
}

function TaskCard({ task, onToggle, onClick }: TaskCardProps) {
  const priorityColors = {
    high: 'border-red-500/60 bg-red-950/30',
    medium: 'border-yellow-500/60 bg-yellow-950/30',
    low: 'border-slate-700 bg-slate-950/60'
  };

  return (
    <div
      className={`border-l-4 ${priorityColors[task.priority]} rounded-lg p-4 hover:shadow-lg hover:shadow-slate-900/50 transition-shadow cursor-pointer border border-slate-800`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform"
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.completed ? (
            <CheckCircle size={20} className="text-emerald-400" />
          ) : (
            <Circle size={20} className="text-slate-500" />
          )}
        </button>
        <span className={`${task.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
          {task.title}
        </span>
      </div>
    </div>
  );
}

interface CalendarEventProps {
  time: string;
  title: string;
  attendees: string[];
  onClick: () => void;
}

function CalendarEvent({ time, title, attendees, onClick }: CalendarEventProps) {
  return (
    <div
      onClick={onClick}
      className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 hover:shadow-lg hover:shadow-slate-900/50 transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{time}</p>
          <p className="font-medium text-slate-100">{title}</p>
          <div className="flex items-center space-x-1 mt-2">
            {attendees.map((name, i) => (
              <span key={i} className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{name}</span>
            ))}
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-500 mt-1" />
      </div>
    </div>
  );
}

interface AgentCardProps {
  agent: Agent;
  onToggle: () => void;
}

function AgentCard({ agent, onToggle }: AgentCardProps) {
  const isActive = agent.status === 'active';

  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 hover:shadow-lg hover:shadow-slate-900/50 transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          <span className="font-medium text-slate-100">{agent.name}</span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-100"
          aria-label={isActive ? 'Pause agent' : 'Start agent'}
        >
          {isActive ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>
      <p className="text-sm text-slate-400">{agent.metric}</p>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  onClick: () => void;
}

function StatCard({ label, value, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-slate-900/60 rounded-lg p-4 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
    >
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}

interface DialogProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Dialog({ title, onClose, children }: DialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-800 max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
}
