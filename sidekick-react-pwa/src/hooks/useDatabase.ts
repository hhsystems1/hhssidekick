/**
 * Database Hooks
 * React hooks for accessing Supabase data with loading states
 */

import { useState, useEffect, useCallback } from 'react';
import * as db from '../services/database';

// Mock user ID for development (replace with actual auth in production)
const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Hook to load tasks from database
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Array<{
    id: string;
    title: string;
    completed: boolean;
    priority: 'high' | 'medium' | 'low';
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.getTodayTasks(MOCK_USER_ID);
      setTasks(data);
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
      setError(err.message);
      // Fallback to mock data on error
      setTasks([
        { id: '1', title: 'Launch Victoria Commercial Outreach', completed: false, priority: 'high' },
        { id: '2', title: 'Review AZ Quiz Funnel Performance', completed: true, priority: 'medium' },
        { id: '3', title: 'Update Solar PPA Lead Script', completed: false, priority: 'low' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const toggleTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Optimistic update
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));

    try {
      await db.toggleTaskCompletion(taskId, !task.completed);
    } catch (err) {
      console.error('Failed to toggle task:', err);
      // Revert on error
      setTasks(tasks);
    }
  }, [tasks]);

  const addTask = useCallback(async (title: string, priority: 'high' | 'medium' | 'low' = 'medium') => {
    try {
      const newTask = await db.createTask(MOCK_USER_ID, title, { priority });
      if (newTask) {
        setTasks([...tasks, newTask]);
        return true;
      }
    } catch (err) {
      console.error('Failed to add task:', err);
    }
    return false;
  }, [tasks]);

  return { tasks, loading, error, toggleTask, addTask, reload: loadTasks };
}

/**
 * Hook to load agents from database
 */
export function useAgents() {
  const [agents, setAgents] = useState<Array<{
    id: string;
    name: string;
    status: 'active' | 'idle';
    metric: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.getUserAgents(MOCK_USER_ID);
      // Map database agents to UI format
      setAgents(data.map(agent => ({
        id: agent.id,
        name: agent.name,
        status: agent.status === 'active' ? 'active' : 'idle',
        metric: agent.last_run
          ? `Last run: ${new Date(agent.last_run).toLocaleTimeString()}`
          : 'Never run',
      })));
    } catch (err: any) {
      console.error('Failed to load agents:', err);
      setError(err.message);
      // Fallback to mock data
      setAgents([
        { id: '1', name: 'Lead Gen Bot', status: 'active', metric: '12 leads today' },
        { id: '2', name: 'Follow-up Automator', status: 'idle', metric: 'Last run: 2h ago' },
        { id: '3', name: 'Email Qualifier', status: 'active', metric: '8 emails processed' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const toggleAgent = useCallback(async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    const newStatus = agent.status === 'active' ? 'idle' : 'active';

    // Optimistic update
    setAgents(agents.map(a =>
      a.id === agentId ? { ...a, status: newStatus } : a
    ));

    try {
      await db.toggleAgentStatus(agentId, newStatus as 'active' | 'idle');
    } catch (err) {
      console.error('Failed to toggle agent:', err);
      // Revert on error
      setAgents(agents);
    }
  }, [agents]);

  const addAgent = useCallback(async (name: string, agentType: string) => {
    try {
      const newAgent = await db.createAgent(MOCK_USER_ID, name, agentType);
      if (newAgent) {
        setAgents([...agents, {
          id: newAgent.id,
          name: newAgent.name,
          status: 'idle',
          metric: 'Never run',
        }]);
        return true;
      }
    } catch (err) {
      console.error('Failed to add agent:', err);
    }
    return false;
  }, [agents]);

  return { agents, loading, error, toggleAgent, addAgent, reload: loadAgents };
}

/**
 * Hook to load calendar events from database
 */
export function useCalendarEvents() {
  const [events, setEvents] = useState<Array<{
    id: string;
    time: string;
    title: string;
    attendees: string[];
  }>>([]);
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.getTodayEvents(MOCK_USER_ID);
      const next = await db.getNextEvent(MOCK_USER_ID);

      setEvents(data.map(event => ({
        id: event.id,
        time: new Date(event.start_time).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
        title: event.title,
        attendees: event.attendees || [],
      })));
      setNextEvent(next);
    } catch (err: any) {
      console.error('Failed to load events:', err);
      setError(err.message);
      // Fallback to mock data
      setEvents([
        { id: '1', time: '9:00 AM', title: 'Team Standup', attendees: ['Jo', 'Brendon'] },
        { id: '2', time: '2:00 PM', title: 'Jeromy - AZ Market Review', attendees: ['Jeromy'] },
      ]);
      setNextEvent({ title: 'Team Standup' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return { events, nextEvent, loading, error, reload: loadEvents };
}

/**
 * Hook to load conversations from database
 */
export function useConversations() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.getUserConversations(MOCK_USER_ID);
      setConversations(data);
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      setError(err.message);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const createConversation = useCallback(async (title?: string) => {
    try {
      const conv = await db.createConversation(MOCK_USER_ID, title);
      if (conv) {
        setConversations([conv, ...conversations]);
        return conv;
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
    return null;
  }, [conversations]);

  return { conversations, loading, error, createConversation, reload: loadConversations };
}
