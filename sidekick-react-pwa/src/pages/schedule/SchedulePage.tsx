import React, { useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, Plus, Send } from 'lucide-react';
import { useCalendarEvents } from '../../hooks/useDatabase';
import type { CalendarDisplayEvent } from '../../hooks/useDatabase';
import { CalendarEventDialog } from '../../components/CalendarEventDialog';
import { NewCalendarEventDialog } from '../../components/NewCalendarEventDialog';
import { useAuth } from '../../context/AuthContext';
import { useConversations, useMessages } from '../../hooks/useChat';
import { createEvent } from '../../services/database/calendar';

type NewEventPayload = {
  title: string;
  startTime: string;
  endTime?: string | null;
  location?: string | null;
  attendees?: string[];
};

const formatEventDateLabel = (date: Date) =>
  date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

const formatEventTimeLabel = (date: Date) =>
  date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export const SchedulePage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const { events, loading: eventsLoading, reload } = useCalendarEvents();
  const { conversations, createConversation } = useConversations();
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarDisplayEvent | null>(null);
  const [activeEventForChat, setActiveEventForChat] = useState<CalendarDisplayEvent | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const { messages, loading: messagesLoading, addMessage } = useMessages(activeConversationId);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const dateLabel = currentDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const openEventChat = useCallback(
    async (event: CalendarDisplayEvent) => {
      setActiveEventForChat(event);
      const existing = conversations.find(conv => conv.metadata?.eventId === event.id);
      if (existing) {
        setActiveConversationId(existing.id);
        return;
      }
      if (!userId || !createConversation) {
        setActiveConversationId(null);
        return;
      }
      const conv = await createConversation(`Event: ${event.title}`, {
        eventId: event.id,
        eventTitle: event.title,
      });
      if (conv) {
        setActiveConversationId(conv.id);
      }
    },
    [conversations, createConversation, userId]
  );

  const handleEventClick = (event: CalendarDisplayEvent) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
    void openEventChat(event);
  };

  const handleCreateEvent = useCallback(
    async (payload: NewEventPayload) => {
      if (!userId) {
        return false;
      }
      const event = await createEvent(userId, payload.title, payload.startTime, {
        endTime: payload.endTime ?? undefined,
        location: payload.location ?? undefined,
        attendees: payload.attendees,
      });
      if (event) {
        reload();
        return true;
      }
      return false;
    },
    [userId, reload]
  );

  const handleSendChat = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!activeConversationId || !chatInput.trim()) {
        return;
      }
      setIsChatSending(true);
      const text = chatInput.trim();
      setChatInput('');
      try {
        await addMessage(text, 'user');
      } catch (error) {
        console.error('Failed to send chat message:', error);
      } finally {
        setIsChatSending(false);
      }
    },
    [activeConversationId, addMessage, chatInput]
  );

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-400" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Mission Calendar</h1>
            <p className="text-xs text-slate-500">{dateLabel}</p>
          </div>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-slate-400" />
          </button>
        </div>
        <button
          onClick={() => setShowAddEventDialog(true)}
          className="px-4 py-2 bg-emerald-700 text-emerald-50 rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Add Event</span>
        </button>
      </div>

      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-6">
        {eventsLoading ? (
          <p className="text-slate-400 text-center">Loading events...</p>
        ) : events.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-slate-400 mb-2">No events scheduled</p>
            <button
              onClick={() => setShowAddEventDialog(true)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-colors"
            >
              Add your first event
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => {
              const isActive = activeEventForChat?.id === event.id;
              return (
                <div
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className={`flex items-start gap-4 p-4 bg-slate-900/50 border rounded-lg hover:border-slate-700 hover:bg-slate-900 transition-all cursor-pointer ${isActive ? 'border-emerald-400/60 bg-emerald-950/40' : 'border-slate-800'}`}
                >
                  <div className="flex flex-col items-center w-16 text-center">
                    <span className="text-[11px] text-slate-400 uppercase tracking-widest">
                      {formatEventDateLabel(event.startTime)}
                    </span>
                    <span className="text-lg font-semibold text-slate-100 mt-2">
                      {formatEventTimeLabel(event.startTime)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-100">{event.title}</h3>
                    {event.location && (
                      <p className="text-xs text-slate-500 mt-1">{event.location}</p>
                    )}
                    {event.attendees.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.attendees.map((name, index) => (
                          <span
                            key={`${event.id}-attendee-${index}`}
                            className="text-[11px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-400"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-slate-500 mt-2" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageCircle className="text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-slate-100">Event Discussion</p>
              <p className="text-xs text-slate-500">
                {activeEventForChat
                  ? `Chatting on ${formatEventTimeLabel(activeEventForChat.startTime)} · ${activeEventForChat.title}`
                  : 'Select an event to start a conversation with your agents'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4">
          {activeConversationId ? (
            <>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {messagesLoading ? (
                  <p className="text-slate-400 text-sm text-center">Loading chat...</p>
                ) : messages.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center">No messages yet — say hello!</p>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ${
                          message.sender === 'user'
                            ? 'bg-emerald-600 text-emerald-50'
                            : 'bg-slate-800 text-slate-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            message.sender === 'user' ? 'text-emerald-100' : 'text-slate-400'
                          }`}
                        >
                          {new Date(message.created_at).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleSendChat} className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={event => setChatInput(event.target.value)}
                  placeholder="Write a quick note..."
                  className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isChatSending || !chatInput.trim()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-emerald-50 disabled:opacity-60"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <p className="text-slate-400 text-sm">Select an event to unlock the mission chat.</p>
          )}
        </div>
      </section>

      {showEventDialog && selectedEvent && (
        <CalendarEventDialog
          event={{
            id: selectedEvent.id,
            title: selectedEvent.title,
            start_time: selectedEvent.startTime.toISOString(),
            end_time: selectedEvent.endTime ? selectedEvent.endTime.toISOString() : null,
            attendees: selectedEvent.attendees,
            location: selectedEvent.location,
          }}
          onClose={() => {
            setShowEventDialog(false);
            setSelectedEvent(null);
          }}
          onUpdate={() => {
            reload();
            if (activeEventForChat) {
              void openEventChat(activeEventForChat);
            }
          }}
        />
      )}

      {showAddEventDialog && (
        <NewCalendarEventDialog
          onClose={() => setShowAddEventDialog(false)}
          onCreate={async payload => {
            const created = await handleCreateEvent(payload);
            if (created) {
              setShowAddEventDialog(false);
            }
            return created;
          }}
        />
      )}
    </div>
  );
};

export default SchedulePage;
