/**
 * CalendarEventDialog Component
 * View and edit calendar event details with validation and toast notifications
 */

import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateEvent, deleteEvent } from '../services/database/calendar';

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time?: string | null;
  attendees?: string[] | null;
  location?: string | null;
}

interface CalendarEventDialogProps {
  event: CalendarEvent;
  onClose: () => void;
  onUpdate: () => void;
}

export const CalendarEventDialog: React.FC<CalendarEventDialogProps> = ({ event, onClose, onUpdate }) => {
  const [title, setTitle] = useState(event.title);
  const [startTime, setStartTime] = useState(
    event.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : ''
  );
  const [endTime, setEndTime] = useState(
    event.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : ''
  );
  const [location, setLocation] = useState(event.location || '');
  const [attendees, setAttendees] = useState(event.attendees?.join(', ') || '');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Event title is required');
      return;
    }

    if (!startTime) {
      toast.error('Start time is required');
      return;
    }

    if (endTime && new Date(endTime) < new Date(startTime)) {
      toast.error('End time must be after start time');
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading('Updating event...');

    try {
      const attendeesArray = attendees
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      const success = await updateEvent(event.id, {
        title: title.trim(),
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : null,
        location: location.trim() || null,
        attendees: attendeesArray.length > 0 ? attendeesArray : null,
      });

      if (success) {
        toast.success('Event updated successfully!', { id: loadingToast });
        onUpdate();
        onClose();
      } else {
        toast.error('Failed to update event', { id: loadingToast });
      }
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    setDeleting(true);
    const loadingToast = toast.loading('Deleting event...');

    try {
      const success = await deleteEvent(event.id);

      if (success) {
        toast.success('Event deleted successfully!', { id: loadingToast });
        onUpdate();
        onClose();
      } else {
        toast.error('Failed to delete event', { id: loadingToast });
      }
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast.error(`Error: ${error.message}`, { id: loadingToast });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-800 max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-100">Event Details</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-100"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
              Event Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Team Meeting"
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-slate-300 mb-2">
                Start Time
              </label>
              <input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-slate-300 mb-2">
                End Time (Optional)
              </label>
              <input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-slate-300 mb-2">
              Location (Optional)
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Conference Room A"
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="attendees" className="block text-sm font-medium text-slate-300 mb-2">
              Attendees (comma-separated)
            </label>
            <input
              id="attendees"
              type="text"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="e.g., John, Sarah, Mike"
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !startTime || submitting || deleting}
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
