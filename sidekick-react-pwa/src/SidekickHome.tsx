import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Play, Pause, Plus, CheckCircle, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTasks, useAgents, useCalendarEvents } from './hooks/useDatabase';
import { NewTaskDialog } from './components/NewTaskDialog';
import { TaskDetailDialog } from './components/TaskDetailDialog';
import { CalendarEventDialog } from './components/CalendarEventDialog';
import { DeployAgentDialog } from './components/DeployAgentDialog';

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
  const [todayLabel, setTodayLabel] = useState('');
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showTaskDetailDialog, setShowTaskDetailDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showNewAgentDialog, setShowNewAgentDialog] = useState(false);

  // Load data from database
  const { tasks, loading: tasksLoading, toggleTask, addTask, reload: reloadTasks } = useTasks();
  const { agents, loading: agentsLoading, toggleAgent, addAgent } = useAgents();
  const { events, nextEvent, loading: eventsLoading, reload: reloadEvents } = useCalendarEvents();

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

  // Task handlers
  const handleAddTask = () => {
    setShowNewTaskDialog(true);
  };

  const handleTaskClick = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setShowTaskDetailDialog(true);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      await toggleTask(taskId);
      toast.success(task.completed ? 'Task marked as incomplete' : 'Task completed!');
    } catch (error: any) {
      toast.error('Failed to update task');
      console.error('Error toggling task:', error);
    }
  };

  const handleDeployAgent = () => {
    setShowNewAgentDialog(true);
  };

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

  // Calendar handlers
  const handleEventClick = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setShowEventDialog(true);
    }
  };

  const completedTasksCount = tasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top_left,rgba(80,200,120,0.15),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(56,181,255,0.15),transparent_55%)]">
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
                    onToggle={() => handleToggleTask(task.id)}
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
                    onClick={() => handleEventClick(event.id)}
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
                <Link
                  to="/agents"
                  className="text-sm text-slate-400 hover:text-slate-100 transition-colors"
                >
                  View all
                </Link>
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
                    onToggle={() => handleToggleAgent(agent.id)}
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
            <StatCard label="Active Campaigns" value="3" onClick={() => console.log('View campaigns')} />
            <StatCard label="Leads This Week" value="47" onClick={() => console.log('View leads')} />
            <StatCard label="SOPs Created" value="12" onClick={() => console.log('View SOPs')} />
            <StatCard label="Training Complete" value="68%" onClick={() => console.log('View training')} />
          </div>
        </div>

      {/* Dialogs */}
      {showNewTaskDialog && (
        <NewTaskDialog
          onClose={() => setShowNewTaskDialog(false)}
          onSubmit={async (title, priority, _dueDate) => {
            const loadingToast = toast.loading('Creating task...');
            try {
              const success = await addTask(title, priority);
              if (success) {
                toast.success('Task created successfully!', { id: loadingToast });
              } else {
                toast.error('Failed to create task', { id: loadingToast });
              }
              return success;
            } catch (error: any) {
              toast.error(`Error: ${error.message}`, { id: loadingToast });
              return false;
            }
          }}
        />
      )}

      {showTaskDetailDialog && selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          onClose={() => {
            setShowTaskDetailDialog(false);
            setSelectedTask(null);
          }}
          onUpdate={() => {
            reloadTasks();
          }}
        />
      )}

      {showEventDialog && selectedEvent && (
        <CalendarEventDialog
          event={selectedEvent}
          onClose={() => {
            setShowEventDialog(false);
            setSelectedEvent(null);
          }}
          onUpdate={() => {
            reloadEvents();
          }}
        />
      )}

      {showNewAgentDialog && (
        <DeployAgentDialog
          onClose={() => setShowNewAgentDialog(false)}
          onSubmit={async (name, agentType) => {
            const loadingToast = toast.loading('Deploying agent...');
            try {
              const success = await addAgent(name, agentType);
              if (success) {
                toast.success('Agent deployed successfully!', { id: loadingToast });
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
    </div>
  );
};

// Components
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
