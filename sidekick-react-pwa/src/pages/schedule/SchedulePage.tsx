import React, { useState } from 'react';
import { useCalendarEvents } from '../../hooks/useDatabase';
import { CalendarEventDialog } from '../../components/CalendarEventDialog';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export const SchedulePage: React.FC = () => {
  const { events, loading: eventsLoading, reload } = useCalendarEvents();
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleEventClick = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setShowEventDialog(true);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const formatDate = currentDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  // Group events by day
  const eventsByDay: Record<string, typeof events> = {};
  events.forEach(event => {
    // This is simplified - in a real app, you'd parse the time string to get the date
    const day = event.time.split(' ')[0]; // Extract day from time
    if (!eventsByDay[day]) {
      eventsByDay[day] = [];
    }
    eventsByDay[day].push(event);
  });

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-400" />
          </button>
          <h1 className="text-xl font-semibold text-slate-100">{formatDate}</h1>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-slate-400" />
          </button>
        </div>
        <button className="px-4 py-2 bg-emerald-700 text-emerald-50 rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2">
          <Plus size={18} />
          <span>Add Event</span>
        </button>
      </div>

      {/* Calendar Grid - Simplified */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6">
        {eventsLoading ? (
          <p className="text-slate-400 text-center">Loading events...</p>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">No events scheduled</p>
            <button className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-colors">
              Add your first event
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map(event => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event.id)}
                className="flex items-start gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer"
              >
                <div className="flex-shrink-0 w-16 text-center">
                  <p className="text-xs text-slate-500 uppercase">{event.time.split(' ')[0]}</p>
                  <p className="text-lg font-semibold text-slate-100">{event.time.split(' ')[1]?.replace(/[a-z]/g, '')}</p>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-100">{event.title}</h3>
                  {event.attendees.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      {event.attendees.map((name: string, i: number) => (
                        <span key={i} className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ChevronRight size={16} className="text-slate-500 mt-1" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Dialog */}
      {showEventDialog && selectedEvent && (
        <CalendarEventDialog
          event={selectedEvent}
          onClose={() => {
            setShowEventDialog(false);
            setSelectedEvent(null);
          }}
          onUpdate={() => {
            reload();
          }}
        />
      )}
    </div>
  );
};

export default SchedulePage;
