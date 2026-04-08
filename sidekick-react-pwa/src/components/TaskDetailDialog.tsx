/**
 * TaskDetailDialog Component
 * View and edit task details with validation and toast notifications
 */

import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateTask, deleteTask } from '../services/database/tasks';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  due_date?: string | null;
}

interface TaskDetailDialogProps {
  task: Task;
  onClose: () => void;
  onUpdate: () => void;
}

export const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({ task, onClose, onUpdate }) => {
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(task.priority);
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : '');
  const [completed, setCompleted] = useState(task.completed);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading('Updating task...');

    try {
      const success = await updateTask(task.id, {
        title: title.trim(),
        priority,
        due_date: dueDate || null,
        completed,
      });

      if (success) {
        toast.success('Task updated successfully!', { id: loadingToast });
        onUpdate();
        onClose();
      } else {
        toast.error('Failed to update task', { id: loadingToast });
      }
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setDeleting(true);
    const loadingToast = toast.loading('Deleting task...');

    try {
      const success = await deleteTask(task.id);

      if (success) {
        toast.success('Task deleted successfully!', { id: loadingToast });
        onUpdate();
        onClose();
      } else {
        toast.error('Failed to delete task', { id: loadingToast });
      }
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="app-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-app-panel border-app w-full max-w-md rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-app text-xl font-semibold">Task Details</h3>
          <button
            onClick={onClose}
            className="text-app-muted hover-bg-app hover:text-app rounded p-1 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="text-app-muted mb-2 block text-sm font-medium">
              Task Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Follow up with client"
              className="app-input w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="priority" className="text-app-muted mb-2 block text-sm font-medium">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
              className="app-input w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          <div>
            <label htmlFor="dueDate" className="text-app-muted mb-2 block text-sm font-medium">
              Due Date (Optional)
            </label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="app-input w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center">
            <input
              id="completed"
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="w-4 h-4 text-emerald-600 bg-slate-950 border-slate-700 rounded focus:ring-emerald-500 focus:ring-2"
            />
            <label htmlFor="completed" className="text-app-muted ml-2 text-sm">
              Mark as completed
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || submitting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 size={16} />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="bg-app-muted text-app-muted rounded-lg px-4 py-2 transition-colors hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || submitting || deleting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
