/**
 * CommandCenter Component
 * Main dashboard component for the RivRyn SideKick app
 */

import React, { useState, useEffect } from 'react';
import { ChevronRight, Bell, Settings } from 'lucide-react';
import { TodaysFocus } from './TodaysFocus';
import { QuickActions } from './QuickActions';
import { UpdatesDropdown } from './UpdatesDropdown';
import type { FocusItem, QuickAction, UpdateItem } from './CommandCenter.types';
import { useTasks, useUserProfile } from '../../hooks/useDatabase';
import { NewTaskDialog } from '../NewTaskDialog';
import { TaskDetailDialog } from '../TaskDetailDialog';
import { useAuth } from '../../context/AuthContext';

interface CommandCenterProps {
  onNavigateToTasks?: () => void;
  onNavigateToChat?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToFiles?: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  onNavigateToTasks,
  onNavigateToChat,
  onNavigateToSettings,
  onNavigateToFiles,
}) => {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { tasks, loading: tasksLoading, toggleTask, addTask, reload: reloadTasks } = useTasks();

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
  const incompleteTasks = tasks.filter(t => !t.completed);
  const upcomingTasks = [...incompleteTasks].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  }).slice(0, 3);

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
      case 'files':
        onNavigateToFiles?.();
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-app text-xl font-semibold">Command Center</h2>
          <p className="text-app-soft text-sm">{todayLabel}</p>
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
              className="hover-bg-app relative rounded-lg p-2 transition-colors"
            >
              <Bell size={20} className="text-app-muted" />
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
            className="hover-bg-app rounded-lg p-2 transition-colors"
          >
            <Settings size={20} className="text-app-muted" />
          </button>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-app-soft mb-3 text-xs font-medium uppercase tracking-wider">Quick Actions</p>
        <QuickActions onActionPress={handleActionPress} />
      </div>

      <div className="mb-6">
        <p className="text-app-soft mb-3 text-xs font-medium uppercase tracking-wider">Today's Focus</p>
        <TodaysFocus
          focusItem={focusItem}
          onPrimaryAction={handlePrimaryAction}
          onAddFocus={handleAddFocus}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-app text-sm font-semibold uppercase tracking-wider">Tasks</h3>
            <span className="text-app-soft text-xs">{completedTasksCount}/{tasks.length}</span>
          </div>

          {tasksLoading ? (
            <p className="text-app-muted text-sm">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="text-app-muted text-sm">No tasks for today</p>
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

        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-app text-sm font-semibold uppercase tracking-wider">Upcoming</h3>
            <span className="text-app-soft text-xs">{incompleteTasks.length} open</span>
          </div>

          {upcomingTasks.length === 0 ? (
            <p className="text-app-muted text-sm">No open tasks</p>
          ) : (
            upcomingTasks.map(task => (
              <div
                key={task.id}
                className="bg-app-panel-soft border-app rounded-lg border p-3"
              >
                <p className="text-app text-sm font-medium">{task.title}</p>
                <p className="text-app-soft mt-1 text-xs">Priority: {task.priority}</p>
              </div>
            ))
          )}

          <button
            onClick={onNavigateToTasks}
            className="border-app text-app-muted hover-bg-app hover:text-app flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors"
          >
            <span>View Tasks</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-app text-sm font-semibold uppercase tracking-wider">Recent</h3>
          </div>

          <div className="space-y-2">
            {updates.slice(0, 3).map(update => (
              <div
                key={update.id}
                className={`border-app cursor-pointer rounded-lg border p-3 transition-colors hover:bg-slate-800/50 ${
                  update.isRead ? 'bg-app-panel-soft' : 'bg-app-muted'
                }`}
                onClick={() => handleUpdateClick(update)}
              >
                <div className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${update.isRead ? 'bg-slate-600' : 'bg-emerald-500'}`} />
                  <div>
                    <p className={`text-sm ${update.isRead ? 'text-app-muted' : 'text-app'}`}>
                      {update.title}
                    </p>
                    <p className="text-app-soft mt-0.5 text-xs">
                      {new Date(update.timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
    low: 'border-app bg-app-panel-soft'
  };

  return (
    <div
      className={`border-l-4 ${priorityColors[task.priority]} border-app cursor-pointer rounded-lg border bg-app-panel-soft p-3 transition-shadow hover:shadow-lg hover:shadow-slate-900/50`}
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
            <span className="text-app-soft">○</span>
          )}
        </button>
        <span className={`text-sm ${task.completed ? 'text-app-soft line-through' : 'text-app'}`}>
          {task.title}
        </span>
      </div>
    </div>
  );
}

export default CommandCenter;
