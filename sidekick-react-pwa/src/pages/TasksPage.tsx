/**
 * TasksPage Component
 * Full tasks list and management
 */

import React, { useMemo, useState } from 'react';
import { Plus, CheckCircle2, Circle, Filter } from 'lucide-react';
import { useTasks } from '../hooks/useDatabase';
import { NewTaskDialog } from '../components/NewTaskDialog';
import { TaskDetailDialog } from '../components/TaskDetailDialog';

export const TasksPage: React.FC = () => {
  const { tasks, loading, error, toggleTask, addTask, reload } = useTasks();
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskDetailDialog, setShowTaskDetailDialog] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'completed'>('all');

  const filteredTasks = useMemo(() => {
    if (filter === 'open') return tasks.filter(t => !t.completed);
    if (filter === 'completed') return tasks.filter(t => t.completed);
    return tasks;
  }, [tasks, filter]);

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setShowTaskDetailDialog(true);
  };

  return (
    <div className="bg-app text-app min-h-screen">
      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-app-muted">Manage your task list and priorities.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-app-panel-soft border-app flex items-center gap-2 rounded-lg border px-3 py-2">
              <Filter size={16} className="text-app-muted" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'open' | 'completed')}
                className="text-app bg-transparent text-sm focus:outline-none"
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <button
              onClick={() => setShowNewTaskDialog(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              New Task
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-app-panel-soft border-app rounded-xl border p-6">
            <p className="text-app-muted">Loading tasks...</p>
          </div>
        ) : error ? (
          <div className="bg-app-panel-soft rounded-xl border border-red-500/40 p-6">
            <p className="text-red-400">Failed to load tasks: {error}</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-app-panel-soft border-app rounded-xl border p-8 text-center">
            <p className="text-app-muted">No tasks yet.</p>
            <button
              onClick={() => setShowNewTaskDialog(true)}
              className="bg-app-muted text-app mt-4 rounded-lg px-4 py-2 transition-colors hover:bg-slate-700"
            >
              Create your first task
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map(task => (
              <button
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className="bg-app-panel-soft border-app text-left rounded-xl border p-4 transition-colors hover:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400">
                    {task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </span>
                  <div className="flex-1">
                    <p className={`font-medium ${task.completed ? 'text-app-soft line-through' : 'text-app'}`}>
                      {task.title}
                    </p>
                    <p className="text-app-soft mt-1 text-xs">Priority: {task.priority}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTask(task.id);
                    }}
                    className="bg-app-muted text-app-muted rounded-full px-3 py-1 text-xs transition-colors hover:bg-slate-700"
                  >
                    {task.completed ? 'Reopen' : 'Complete'}
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showNewTaskDialog && (
        <NewTaskDialog
          onClose={() => setShowNewTaskDialog(false)}
          onSubmit={async (title, priority, _dueDate) => {
            const success = await addTask(title, priority);
            if (success) {
              await reload();
              setShowNewTaskDialog(false);
            }
            return success;
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
          onUpdate={() => reload()}
        />
      )}
    </div>
  );
};

export default TasksPage;
