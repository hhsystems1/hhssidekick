/**
 * NewTaskDialog Component
 * Form to create a new task with title, priority, and due date
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface NewTaskDialogProps {
  onClose: () => void;
  onSubmit: (title: string, priority: 'high' | 'medium' | 'low', dueDate?: string) => Promise<boolean>;
}

export const NewTaskDialog: React.FC<NewTaskDialogProps> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    const success = await onSubmit(title, priority, dueDate || undefined);
    setSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div className="app-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-app-panel border-app w-full max-w-md rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-app text-xl font-semibold">Add New Task</h3>
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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-app-muted text-app-muted flex-1 rounded-lg px-4 py-2 transition-colors hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || submitting}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
