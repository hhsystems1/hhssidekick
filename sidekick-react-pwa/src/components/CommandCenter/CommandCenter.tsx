/**
 * CommandCenter Component
 * Main dashboard component for the Sidekick app
 */

import React, { useState, useEffect } from 'react';
import { ChevronRight, Bell, Settings } from 'lucide-react';
import { TodaysFocus } from './TodaysFocus';
import { QuickActions } from './QuickActions';
import { UpdatesDropdown } from './UpdatesDropdown';
import type { FocusItem, QuickAction, UpdateItem } from './CommandCenter.types';
import { useTasks, useCalendarEvents, useUserProfile } from '../../hooks/useDatabase';
import { NewTaskDialog } from '../NewTaskDialog';
import { TaskDetailDialog } from '../TaskDetailDialog';
import { useAuth } from '../../context/AuthContext';

interface CommandCenterProps {
  onNavigateToSchedule?: () => void;
  onNavigateToChat?: () => void;
  onNavigateToSettings?: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  onNavigateToSchedule,
  onNavigateToChat,
  onNavigateToSettings,
}) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { tasks, loading: tasksLoading, toggleTask, addTask, reload: reloadTasks } = useTasks();
  const { nextEvent, events } = useCalendarEvents();

  const [todayLabel, setTodayLabel] = useState('');
  const [focusItem, setFocusItem] = useState<FocusItem | null>(null);
  const [updates, setUpdates] = useState<UpdateItem[]>([
    {
      id: '1',
      title: 'Sarah commented on your report',
      category: 'mention',
      timestamp: new Date(Date.now() - 7200000),
      isRead: false,
    },
    {
      id: '2',
      title: 'Q4 goals deadline',
      subtitle: 'Due tomorrow at 5pm',
      category: 'deadline',
      timestamp: new Date(Date.now() - 3600000),
      isRead: false,
    },
    {
      id: '3',
      title: 'New resources available',
      category: 'resource',
      timestamp: new Date(Date.now() - 86400000),
      isRead: true,
    },
  ]);

  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showTaskDetailDialog, setShowTaskDetailDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [updatesDropdownOpen, setUpdatesDropdownOpen] = useState(false);

  // Set today's date
  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    setTodayLabel(formatted);
  }, []);

  // Calculate focus item from tasks
  useEffect(() => {
    if (tasks.length > 0) {
      const incompleteTasks = tasks.filter(t => !t.completed);
      if (incompleteTasks.length > 0) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const topTask = incompleteTasks.sort((a, b) =>
          priorityOrder[a.priority] - priorityOrder[b.priority]
        )[0];

        setFocusItem({
          id: topTask.id,
          title: topTask.title,
          subtitle: `You have ${incompleteTasks.length} task${incompleteTasks.length > 1 ? 's' : ''} remaining`,
          priority: topTask.priority,
          actionLabel: topTask.priority === 'high' ? 'Do First' : 'Start Task',
          category: 'Tasks',
        });
      } else {
        setFocusItem(null);
      }
    } else {
      setFocusItem(null);
    }
  }, [tasks]);

  const completedTasksCount = tasks.filter(t => t.completed).length;

  const handlePrimaryAction = (item: FocusItem) => {
    const task = tasks.find(t => t.id === item.id);
    if (task) {
      setSelectedTask(task);
      setShowTaskDetailDialog(true);
    }
  };

  const handleAddFocus = () => {
    setShowNewTaskDialog(true);
  };

  const handleActionPress = (action: QuickAction) => {
    switch (action.type) {
      case 'task':
        setShowNewTaskDialog(true);
        break;
      case 'meeting':
        onNavigateToSchedule?.();
        break;
      case 'message':
        onNavigateToChat?.();
        break;
    }
  };

  const handleUpdateClick = (item: UpdateItem) => {
    setUpdates(prev =>
      prev.map(u => u.id === item.id ? { ...u, isRead: true } : u)
    );
  };

  const handleMarkAllUpdatesRead = () => {
    setUpdates(prev => prev.map(u => ({ ...u, isRead: true })));
  };

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      await toggleTask(taskId);
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleTaskClick = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setShowTaskDetailDialog(true);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Command Center Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Command Center</h2>
          <p className="text-sm text-slate-500">{todayLabel}</p>
          {user && (
            <p className="text-xs text-emerald-400 mt-1">
              Welcome back, {profile?.full_name || user.email?.split('@')[0] || 'User'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setUpdatesDropdownOpen(!updatesDropdownOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors relative"
            >
              <Bell size={20} className="text-slate-400" />
              {updates.filter(u => !u.isRead).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
              )}
            </button>
            <UpdatesDropdown
              updates={updates}
              isOpen={updatesDropdownOpen}
              onClose={() => setUpdatesDropdownOpen(false)}
              onItemClick={handleUpdateClick}
              onMarkAllRead={handleMarkAllUpdatesRead}
            />
          </div>
          {/* Settings */}
          <button
            onClick={onNavigateToSettings}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Settings size={20} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">Quick Actions</p>
        <QuickActions onActionPress={handleActionPress} />
      </div>

      {/* Today's Focus */}
      <div className="mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">Today's Focus</p>
        <TodaysFocus
          focusItem={focusItem}
          onPrimaryAction={handlePrimaryAction}
          onAddFocus={handleAddFocus}
        />
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Column 1: Tasks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">Tasks</h3>
            <span className="text-xs text-slate-500">{completedTasksCount}/{tasks.length}</span>
          </div>

          {tasksLoading ? (
            <p className="text-slate-400 text-sm">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="text-slate-400 text-sm">No tasks for today</p>
          ) : (
            tasks.slice(0, 5).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => handleToggleTask(task.id)}
                onClick={() => handleTaskClick(task.id)}
              />
            ))
          )}
        </div>

        {/* Column 2: Schedule */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">Schedule</h3>
            <span className="text-xs text-slate-500">{todayLabel}</span>
          </div>

          {events.length === 0 ? (
            <p className="text-slate-400 text-sm">No events today</p>
          ) : (
            events.slice(0, 3).map(event => (
              <CalendarEvent
                key={event.id}
                time={event.time}
                title={event.title}
                attendees={event.attendees}
                onClick={() => {}}
              />
            ))
          )}

          {nextEvent && (
            <div className="bg-slate-900/60 rounded-xl p-4 mt-4 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Next up</p>
              <p className="font-medium text-slate-100">{nextEvent.title}</p>
              <p className="text-xs text-slate-500 mt-1">{nextEvent.time}</p>
            </div>
          )}

          <button
            onClick={onNavigateToSchedule}
            className="w-full py-3 border border-slate-700 rounded-xl text-slate-400 hover:border-slate-600 hover:text-slate-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <span>View Schedule</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Column 3: Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">Recent</h3>
          </div>

          <div className="space-y-2">
            {updates.slice(0, 3).map(update => (
              <div
                key={update.id}
                className={`p-3 rounded-lg border cursor-pointer hover:bg-slate-800/50 transition-colors ${
                  update.isRead ? 'border-slate-800 bg-slate-950/40' : 'border-slate-700 bg-slate-800/30'
                }`}
                onClick={() => handleUpdateClick(update)}
              >
                <div className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${update.isRead ? 'bg-slate-600' : 'bg-emerald-500'}`} />
                  <div>
                    <p className={`text-sm ${update.isRead ? 'text-slate-400' : 'text-slate-200'}`}>
                      {update.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(update.timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {showNewTaskDialog && (
        <NewTaskDialog
          onClose={() => setShowNewTaskDialog(false)}
          onSubmit={async (title, priority, _dueDate) => {
            try {
              console.log('CommandCenter: Attempting to add task:', title, priority);
              const success = await addTask(title, priority);
              console.log('CommandCenter: Add task result:', success);
              if (!success) {
                console.error('CommandCenter: Task creation failed - check console for details');
              }
              return success;
            } catch (error: any) {
              console.error('CommandCenter: Error creating task:', error);
              alert(`Failed to create task: ${error.message || 'Unknown error'}`);
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
    </div>
  );
};

// Task Card Component (reused from SidekickHome)
interface TaskCardProps {
  task: { id: string; title: string; completed: boolean; priority: 'high' | 'medium' | 'low' };
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
      className={`border-l-4 ${priorityColors[task.priority]} rounded-lg p-3 hover:shadow-lg hover:shadow-slate-900/50 transition-shadow cursor-pointer bg-slate-950/40 border border-slate-800`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="flex-shrink-0 hover:scale-110 transition-transform"
        >
          {task.completed ? (
            <span className="text-emerald-400">●</span>
          ) : (
            <span className="text-slate-500">○</span>
          )}
        </button>
        <span className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
          {task.title}
        </span>
      </div>
    </div>
  );
}

// Calendar Event Component (reused from SidekickHome)
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
      className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 hover:shadow-lg hover:shadow-slate-900/50 transition-shadow cursor-pointer"
    >
      <p className="text-xs text-slate-500 mb-1">{time}</p>
      <p className="text-sm font-medium text-slate-100">{title}</p>
      {attendees.length > 0 && (
        <div className="flex items-center gap-1 mt-2">
          {attendees.slice(0, 3).map((name, i) => (
            <span key={i} className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">
              {name}
            </span>
          ))}
          {attendees.length > 3 && (
            <span className="text-xs text-slate-500">+{attendees.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default CommandCenter;
