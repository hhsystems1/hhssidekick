/**
 * Database Hooks
 * React hooks for accessing Supabase data with loading states
 */

import { useState, useEffect, useCallback } from 'react';
import * as db from '../services/database';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to load tasks from database
 */
export function useTasks() {
  const { user } = useAuth();
  const userId = user?.id;
  const [tasks, setTasks] = useState<Array<{
    id: string;
    title: string;
    completed: boolean;
    priority: 'high' | 'medium' | 'low';
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setTasks([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await db.getTodayTasks(userId);
      setTasks(data);
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
      setError(err.message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

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
    if (!userId) {
      console.error('Cannot add task: No user ID available');
      return false;
    }
    console.log('Adding task with userId:', userId, 'title:', title, 'priority:', priority);
    try {
      const newTask = await db.createTask(userId, title, { priority });
      if (newTask) {
        console.log('Task created successfully:', newTask);
        setTasks([...tasks, newTask]);
        return true;
      }
      console.error('Task creation returned null');
      return false;
    } catch (err: any) {
      console.error('Failed to add task:', err);
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
      return false;
    }
  }, [tasks, userId]);

  return { tasks, loading, error, toggleTask, addTask, reload: loadTasks };
}

/**
 * Hook to load agents from database
 */
export function useAgents() {
  const { user } = useAuth();
  const userId = user?.id;
  const [agents, setAgents] = useState<Array<{
    id: string;
    name: string;
    status: 'active' | 'idle';
    metric: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAgents = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setAgents([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await db.getUserAgents(userId);
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
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

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
    if (!userId) {
      console.error('Cannot add agent: No user ID available');
      return false;
    }
    console.log('Adding agent with userId:', userId, 'name:', name, 'type:', agentType);
    try {
      const newAgent = await db.createAgent(userId, name, agentType);
      if (newAgent) {
        console.log('Agent created successfully:', newAgent);
        setAgents([...agents, {
          id: newAgent.id,
          name: newAgent.name,
          status: 'idle',
          metric: 'Never run',
        }]);
        return true;
      }
      console.error('Agent creation returned null');
      return false;
    } catch (err: any) {
      console.error('Failed to add agent:', err);
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
      return false;
    }
  }, [agents, userId]);

  const deleteAgent = useCallback(async (agentId: string) => {
    try {
      const success = await db.deleteAgent(agentId);
      if (success) {
        setAgents(agents.filter(a => a.id !== agentId));
      }
      return success;
    } catch (err) {
      console.error('Failed to delete agent:', err);
      return false;
    }
  }, [agents]);

  return { agents, loading, error, toggleAgent, addAgent, deleteAgent, reload: loadAgents };
}

/**
 * Hook to load calendar events from database
 */
export function useCalendarEvents() {
  const { user } = useAuth();
  const userId = user?.id;
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
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await db.getTodayEvents(userId);
      const next = await db.getNextEvent(userId);

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
      setEvents([]);
      setNextEvent(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return { events, nextEvent, loading, error, reload: loadEvents };
}

/**
 * Hook to load conversations from database
 */
export function useConversations() {
  const { user } = useAuth();
  const userId = user?.id;
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await db.getUserConversations(userId);
      setConversations(data);
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
      setError(err.message);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const createConversation = useCallback(async (title?: string) => {
    if (!userId) return null;
    try {
      const conv = await db.createConversation(userId, title);
      if (conv) {
        setConversations([conv, ...conversations]);
        return conv;
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
    return null;
  }, [conversations, userId]);

  return { conversations, loading, error, createConversation, reload: loadConversations };
}

/**
 * Hook to load user profile from database
 */
export function useUserProfile() {
  const { user } = useAuth();
  const userId = user?.id;
  const [profile, setProfile] = useState<{
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    timezone: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setProfile(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await db.getProfile(userId);
      if (data) {
        setProfile({
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          timezone: data.timezone,
        });
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError(err.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = useCallback(async (updates: {
    full_name?: string | null;
    avatar_url?: string | null;
    timezone?: string | null;
  }) => {
    if (!userId) return false;
    try {
      const { data, error } = await db.updateProfile(userId, updates);
      if (data && !error) {
        setProfile({
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
          timezone: data.timezone,
        });
        return true;
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
    return false;
  }, [userId]);

  return { profile, loading, error, updateProfile, reload: loadProfile };
}

/**
 * Hook to load user settings from database
 */
export function useUserSettings() {
  const { user } = useAuth();
  const userId = user?.id;
  const [settings, setSettings] = useState<{
    push_notifications: boolean;
    email_notifications: boolean;
    task_reminders: boolean;
    two_factor_enabled: boolean;
    theme: 'dark' | 'light' | 'system';
    language: string;
    font_size: 'small' | 'medium' | 'large';
  }>({
    push_notifications: true,
    email_notifications: true,
    task_reminders: true,
    two_factor_enabled: false,
    theme: 'dark',
    language: 'en',
    font_size: 'medium',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await db.getUserSettings(userId);
      setSettings({
        push_notifications: data.push_notifications,
        email_notifications: data.email_notifications,
        task_reminders: data.task_reminders,
        two_factor_enabled: data.two_factor_enabled,
        theme: data.theme,
        language: data.language,
        font_size: data.font_size,
      });
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback(async (updates: Partial<{
    push_notifications: boolean;
    email_notifications: boolean;
    task_reminders: boolean;
    two_factor_enabled: boolean;
    theme: 'dark' | 'light' | 'system';
    language: string;
    font_size: 'small' | 'medium' | 'large';
  }>) => {
    if (!userId) return false;
    // Optimistic update
    setSettings(prev => ({ ...prev, ...updates }));

    try {
      const { error } = await db.updateUserSettings(userId, updates);
      if (error) {
        // Revert on error
        loadSettings();
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to update settings:', err);
      loadSettings();
      return false;
    }
  }, [loadSettings, userId]);

  return { settings, loading, error, updateSettings, reload: loadSettings };
}

/**
 * Hook to load and update user memory
 */
export function useUserMemory() {
  const { user } = useAuth();
  const userId = user?.id;
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMemory = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await db.getUserMemory(userId);
      setContent(data?.content || '');
    } catch (err: any) {
      console.error('Failed to load user memory:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadMemory();
  }, [loadMemory]);

  const updateMemory = useCallback(async (nextContent: string) => {
    if (!userId) return false;
    setContent(nextContent);
    const { error } = await db.upsertUserMemory(userId, nextContent);
    if (error) {
      setError(error.message);
      return false;
    }
    await db.logMemoryAudit(userId, 'user', 'update', { length: nextContent.length });
    return true;
  }, [userId]);

  return { content, loading, error, updateMemory, reload: loadMemory };
}

/**
 * Hook to load and update agent memory
 */
export function useAgentMemory(agentType: string) {
  const { user } = useAuth();
  const userId = user?.id;
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMemory = useCallback(async () => {
    if (!userId || !agentType) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await db.getAgentMemory(userId, agentType);
      setContent(data?.content || '');
    } catch (err: any) {
      console.error('Failed to load agent memory:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, agentType]);

  useEffect(() => {
    loadMemory();
  }, [loadMemory]);

  const updateMemory = useCallback(async (nextContent: string) => {
    if (!userId || !agentType) return false;
    setContent(nextContent);
    const { error } = await db.upsertAgentMemory(userId, agentType, nextContent);
    if (error) {
      setError(error.message);
      return false;
    }
    await db.logMemoryAudit(userId, 'agent', 'update', { agentType, length: nextContent.length });
    return true;
  }, [userId, agentType]);

  return { content, loading, error, updateMemory, reload: loadMemory };
}
