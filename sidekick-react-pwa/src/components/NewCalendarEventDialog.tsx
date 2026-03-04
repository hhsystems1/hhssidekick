import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

type NewEventPayload = {
  title: string;
  startTime: string;
  endTime?: string | null;
  location?: string | null;
  attendees?: string[];
};

interface NewCalendarEventDialogProps {
  onClose: () => void;
  onCreate: (payload: NewEventPayload) => Promise<boolean>;
}

export const NewCalendarEventDialog: React.FC<NewCalendarEventDialogProps> = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [attendees, setAttendees] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error('Event title is required');
      return;
    }
    if (!startTime) {
      toast.error('Select a start time');
      return;
    }
    if (endTime && new Date(endTime) <= new Date(startTime)) {
      toast.error('End time must be after the start time');
      return;
    }

    const loadingToast = toast.loading('Creating event...');
    setSaving(true);

    const attendeesArray = attendees
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    try {
      const success = await onCreate({
        title: title.trim(),
        startTime: new Date(startTime).toISOString(),
        endTime: endTime ? new Date(endTime).toISOString() : null,
        location: location.trim() || null,
        attendees: attendeesArray.length ? attendeesArray : undefined,
      });

      if (success) {
        toast.success('Event created!', { id: loadingToast });
      } else {
        toast.error('Unable to create the event', { id: loadingToast });
      }

      if (success) {
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to create event:', error);
      toast.error(`Error: ${error?.message || 'Unable to create event'}`, { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-slate-500">New Event</p>
            <h2 className="text-xl font-semibold text-slate-100">Drop a mission brief</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-900 text-slate-400"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-widest">Title</label>
            <input
              type="text"
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="Mission Control sync"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-xs text-slate-400 uppercase tracking-widest">
              Start Time
              <input
                type="datetime-local"
                value={startTime}
                onChange={event => setStartTime(event.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="text-xs text-slate-400 uppercase tracking-widest">
              End Time (optional)
              <input
                type="datetime-local"
                value={endTime}
                onChange={event => setEndTime(event.target.value)}
                className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
              />
            </label>
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-widest">Location</label>
            <input
              type="text"
              value={location}
              onChange={event => setLocation(event.target.value)}
              placeholder="Signal room B"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-widest">Attendees</label>
            <input
              type="text"
              value={attendees}
              onChange={event => setAttendees(event.target.value)}
              placeholder="e.g., Signal Phantom, Shoreline Turtle"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">Separate names with commas for quick invites.</p>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-full border border-emerald-500 text-emerald-100 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
