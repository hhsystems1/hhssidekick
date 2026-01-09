/**
 * Agent Service
 * Manages deployed agents in Supabase
 */

import { supabase } from '../../lib/supabaseClient';
import type { Database } from './types';

type Agent = Database['public']['Tables']['agents']['Row'];
type NewAgent = Database['public']['Tables']['agents']['Insert'];
type AgentUpdate = Database['public']['Tables']['agents']['Update'];

/**
 * Get all agents for a user
 */
export async function getUserAgents(userId: string): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching agents:', error);
    return [];
  }

  return data || [];
}

/**
 * Get active agents for a user
 */
export async function getActiveAgents(userId: string): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching active agents:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new agent
 */
export async function createAgent(
  userId: string,
  name: string,
  agentType: string,
  config?: Record<string, any>
): Promise<Agent | null> {
  const newAgent: NewAgent = {
    user_id: userId,
    name,
    agent_type: agentType,
    status: 'idle',
    config: config || null,
  };

  const { data, error } = await supabase
    .from('agents')
    .insert(newAgent)
    .select()
    .single();

  if (error) {
    console.error('Error creating agent:', error);
    return null;
  }

  return data;
}

/**
 * Update an agent
 */
export async function updateAgent(
  agentId: string,
  updates: AgentUpdate
): Promise<boolean> {
  const { error } = await supabase
    .from('agents')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', agentId);

  if (error) {
    console.error('Error updating agent:', error);
    return false;
  }

  return true;
}

/**
 * Toggle agent status (active/idle)
 */
export async function toggleAgentStatus(
  agentId: string,
  status: 'active' | 'idle' | 'paused'
): Promise<boolean> {
  const updates: AgentUpdate = {
    status,
  };

  if (status === 'active') {
    updates.last_run = new Date().toISOString();
  }

  return updateAgent(agentId, updates);
}

/**
 * Delete an agent
 */
export async function deleteAgent(agentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('agents')
    .delete()
    .eq('id', agentId);

  if (error) {
    console.error('Error deleting agent:', error);
    return false;
  }

  return true;
}

/**
 * Update agent's last run time
 */
export async function updateAgentLastRun(agentId: string): Promise<boolean> {
  return updateAgent(agentId, {
    last_run: new Date().toISOString(),
  });
}
