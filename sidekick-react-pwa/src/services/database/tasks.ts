/**
 * Task Service
 * Manages tasks in Supabase
 */

import { supabase } from '../../lib/supabaseClient';
import type { Database } from './types';

type Task = Database['public']['Tables']['tasks']['Row'];
type NewTask = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

/**
 * Get all tasks for a user
 */
export async function getUserTasks(
  userId: string,
  options?: {
    includeCompleted?: boolean;
    dueDate?: string;
  }
): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId);

  if (!options?.includeCompleted) {
    query = query.eq('completed', false);
  }

  if (options?.dueDate) {
    query = query.lte('due_date', options.dueDate);
  }

  query = query.order('priority', { ascending: false }).order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }

  return data || [];
}

/**
 * Get today's tasks for a user
 */
export async function getTodayTasks(userId: string): Promise<Task[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .or(`due_date.lte.${today},due_date.is.null`)
    .eq('completed', false)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching today tasks:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new task
 */
export async function createTask(
  userId: string,
  title: string,
  options?: {
    priority?: 'high' | 'medium' | 'low';
    dueDate?: string;
    metadata?: Record<string, any>;
  }
): Promise<Task | null> {
  const newTask: NewTask = {
    user_id: userId,
    title,
    priority: options?.priority || 'medium',
    due_date: options?.dueDate || null,
    metadata: options?.metadata || null,
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(newTask)
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    console.error('Task data attempted:', newTask);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error; // Throw instead of returning null so we can catch it
  }

  return data;
}

/**
 * Update a task
 */
export async function updateTask(
  taskId: string,
  updates: TaskUpdate
): Promise<boolean> {
  const { error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  if (error) {
    console.error('Error updating task:', error);
    return false;
  }

  return true;
}

/**
 * Toggle task completion
 */
export async function toggleTaskCompletion(taskId: string, completed: boolean): Promise<boolean> {
  return updateTask(taskId, { completed });
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<boolean> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting task:', error);
    return false;
  }

  return true;
}

/**
 * Get task statistics for a user
 */
export async function getTaskStats(userId: string): Promise<{
  total: number;
  completed: number;
  pending: number;
  highPriority: number;
}> {
  const { data, error } = await supabase
    .from('tasks')
    .select('completed, priority')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching task stats:', error);
    return { total: 0, completed: 0, pending: 0, highPriority: 0 };
  }

  const total = data?.length || 0;
  const completed = data?.filter(t => t.completed).length || 0;
  const pending = total - completed;
  const highPriority = data?.filter(t => t.priority === 'high' && !t.completed).length || 0;

  return { total, completed, pending, highPriority };
}
