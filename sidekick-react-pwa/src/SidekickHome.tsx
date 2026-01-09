import React, { useState, useEffect } from 'react';
import { Menu, ChevronRight, Play, Pause, Plus, CheckCircle, Circle, X } from 'lucide-react';

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

export const SidekickHome: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [todayLabel, setTodayLabel] = useState('');
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showNewAgentDialog, setShowNewAgentDialog] = useState(false);
  const [showBrainDumpDialog, setShowBrainDumpDialog] = useState(false);

  // Sample data with state
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Launch Victoria Commercial Outreach', completed: false, priority: 'high' },
    { id: '2', title: 'Review AZ Quiz Funnel Performance', completed: true, priority: 'medium' },
    { id: '3', title: 'Update Solar PPA Lead Script', completed: false, priority: 'low' },
  ]);

  const [agents, setAgents] = useState<Agent[]>([
    { id: '1', name: 'Lead Gen Bot', status: 'active', metric: '12 leads today' },
    { id: '2', name: 'Follow-up Automator', status: 'idle', metric: 'Last run: 2h ago' },
    { id: '3', name: 'Email Qualifier', status: 'active', metric: '8 emails processed' },
  ]);

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
    // TODO: Implement actual navigation when routing is set up
  };

  // Task handlers
  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleAddTask = () => {
    setShowNewTaskDialog(true);
  };

  const handleTaskClick = (taskId: string) => {
    console.log(`Opening task: ${taskId}`);
    // TODO: Open task detail dialog or navigate to task page
  };

  // Agent handlers
  const toggleAgentStatus = (agentId: string) => {
    setAgents(agents.map(agent =>
      agent.id === agentId
        ? { ...agent, status: agent.status === 'active' ? 'idle' : 'active' }
        : agent
    ));
  };

  const handleDeployAgent = () => {
    setShowNewAgentDialog(true);
  };

  // Calendar handlers
  const handleEventClick = (eventTitle: string) => {
    console.log(`Opening event: ${eventTitle}`);
    // TODO: Open event detail dialog
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
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <h1 className="text-2xl font-bold text-slate-100">Sidekick</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <NavItem icon="🏠" label="Dashboard" active onClick={() => handleNavigate('dashboard')} />
            <NavItem icon="🤖" label="Agents" onClick={() => handleNavigate('agents')} />
            <NavItem icon="📚" label="Training" onClick={() => handleNavigate('training')} />
            <NavItem icon="🛒" label="Marketplace" onClick={() => handleNavigate('marketplace')} />
            <NavItem icon="👤" label="Profile" onClick={() => handleNavigate('profile')} />
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

              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTaskCompletion(task.id)}
                  onClick={() => handleTaskClick(task.id)}
                />
              ))}

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

              <CalendarEvent
                time="9:00 AM"
                title="Team Standup"
                attendees={["Jo", "Brendon"]}
                onClick={() => handleEventClick('Team Standup')}
              />
              <CalendarEvent
                time="2:00 PM"
                title="Jeromy - AZ Market Review"
                attendees={["Jeromy"]}
                onClick={() => handleEventClick('Jeromy - AZ Market Review')}
              />

              <div className="bg-slate-900/60 rounded-xl p-6 mt-6 border border-slate-800">
                <p className="text-sm text-slate-400 mb-2">Next up</p>
                <p className="font-medium text-slate-100">Team Standup</p>
                <p className="text-sm text-slate-500 mt-1">in 45 minutes</p>
              </div>
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

              {agents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onToggle={() => toggleAgentStatus(agent.id)}
                />
              ))}

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
      </div>

      {/* Dialogs */}
      {showNewTaskDialog && (
        <Dialog title="Add New Task" onClose={() => setShowNewTaskDialog(false)}>
          <p className="text-slate-400">Task creation form coming soon...</p>
        </Dialog>
      )}

      {showNewAgentDialog && (
        <Dialog title="Deploy New Agent" onClose={() => setShowNewAgentDialog(false)}>
          <p className="text-slate-400">Agent deployment wizard coming soon...</p>
        </Dialog>
      )}

      {showBrainDumpDialog && (
        <Dialog title="New Brain Dump" onClose={() => setShowBrainDumpDialog(false)}>
          <p className="text-slate-400">Brain dump interface coming soon...</p>
        </Dialog>
      )}
    </div>
  );
};

// Components
interface NavItemProps {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, active = false, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-slate-950/60 border border-slate-800' : 'hover:bg-slate-800'}`}
    >
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
