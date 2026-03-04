import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Pause, Play, Plus, CheckCircle, Circle } from 'lucide-react';
import { useTasks, useAgents, useCalendarEvents } from './hooks/useDatabase';
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
  const navigate = useNavigate();
  const [todayLabel, setTodayLabel] = useState('');
  const [showNewAgentDialog, setShowNewAgentDialog] = useState(false);

  const { tasks, loading: tasksLoading, toggleTask } = useTasks();
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

  const completedTasksCount = tasks.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top_left,rgba(80,200,120,0.15),transparent_55%),radial-gradient(circle_at_bottom_right,rgba(56,181,255,0.15),transparent_55%)]">
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">Dashboard</h2>
            <p className="text-sm text-slate-500">{todayLabel}</p>
          </div>
          <button
            onClick={() => navigate('/tasks')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-slate-700"
          >
            <Plus size={16} />
            New Task
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Tasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-100">Today's Tasks</h3>
              <button
                onClick={() => navigate('/tasks')}
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
                />
              ))
            )}

            <div className="pt-2">
              <p className="text-sm text-slate-500">{completedTasksCount} of {tasks.length} tasks complete</p>
            </div>
          </div>

          {/* Column 2: Schedule */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
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
                />
              ))
            )}

            {nextEvent && (
              <div className="bg-slate-900/60 rounded-xl p-6 mt-4 border border-slate-800">
                <p className="text-sm text-slate-400 mb-2">Next up</p>
                <p className="font-medium text-slate-100">{nextEvent.title}</p>
                <p className="text-sm text-slate-500 mt-1">Coming soon</p>
              </div>
            )}
          </div>

          {/* Column 3: Agents */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-100">Agents</h3>
              <button
                onClick={() => navigate('/agents')}
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
              onClick={() => setShowNewAgentDialog(true)}
              className="w-full py-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-slate-600 hover:text-slate-100 transition-colors font-medium"
            >
              + Deploy New Agent
            </button>
          </div>
        </div>
      </div>

      {showNewAgentDialog && (
        <DeployAgentDialog
          onClose={() => setShowNewAgentDialog(false)}
          onSubmit={async (name, agentType) => {
            try {
              const success = await addAgent(name, agentType);
              if (!success) {
                alert('Failed to deploy agent - check console for details');
              }
              return success;
            } catch (error: any) {
              alert(`Failed to deploy agent: ${error.message || 'Unknown error'}`);
              return false;
            }
          }}
        />
      )}
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  onToggle: () => void;
}

function TaskCard({ task, onToggle }: TaskCardProps) {
  const priorityColors = {
    high: 'border-red-500/60 bg-red-950/30',
    medium: 'border-yellow-500/60 bg-yellow-950/30',
    low: 'border-slate-700 bg-slate-950/60',
  };

  return (
    <div
      className={`border-l-4 ${priorityColors[task.priority]} rounded-lg p-4 hover:shadow-lg hover:shadow-slate-900/50 transition-shadow border border-slate-800`}
    >
      <div className="flex items-start space-x-3">
        <button
          onClick={onToggle}
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
}

function CalendarEvent({ time, title, attendees }: CalendarEventProps) {
  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 hover:shadow-lg hover:shadow-slate-900/50 transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{time}</p>
          <p className="font-medium text-slate-100">{title}</p>
          {attendees.length > 0 && (
            <div className="flex items-center space-x-1 mt-2">
              {attendees.map((name, i) => (
                <span key={i} className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{name}</span>
              ))}
            </div>
          )}
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

export default SidekickHome;
