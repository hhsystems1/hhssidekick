import { supabase } from '../lib/supabaseClient';
import { enqueueAgentRun } from './agents/runner';

export interface PendingAction {
  id: string;
  action_type: string;
  params: Record<string, unknown>;
  status: string;
  created_at: string;
}

export async function listPendingActions() {
  const { data, error } = await supabase
    .from('action_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    return { actions: [], error: error.message } as const;
  }

  return { actions: (data || []) as PendingAction[], error: null } as const;
}

export async function approveAction(actionId: string) {
  const { data, error } = await supabase.functions.invoke('action-approve', {
    method: 'POST',
    body: { action_id: actionId },
  });

  if (error) {
    return { success: false, error: error.message } as const;
  }

  return { success: true, action: data.action } as const;
}

export async function rejectAction(actionId: string) {
  const { data, error } = await supabase.functions.invoke('action-reject', {
    method: 'POST',
    body: { action_id: actionId },
  });

  if (error) {
    return { success: false, error: error.message } as const;
  }

  return { success: true, action: data.action } as const;
}

export async function requestAction(actionType: string, params: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('action-request', {
    method: 'POST',
    body: { action_type: actionType, params },
  });

  if (error) {
    return { success: false, error: error.message } as const;
  }

  return { success: true, action: data.action } as const;
}

export function getActionAgentId(action: { params?: Record<string, unknown> | null }) {
  const agentId = action.params?._sidekick_agent_id;
  return typeof agentId === 'string' && agentId ? agentId : null;
}

export async function queueApprovedAction(actionId: string, agentId: string) {
  const res = await enqueueAgentRun(agentId, {
    action_id: actionId,
  });

  if (!res.success) {
    return { success: false, error: res.error } as const;
  }

  return { success: true, job: res.job } as const;
}

export async function executeAction(actionId: string) {
  const { data, error } = await supabase.functions.invoke('action-execute', {
    method: 'POST',
    body: { action_id: actionId },
  });

  if (error) {
    return { success: false, error: error.message } as const;
  }

  return { success: true, result: data.result } as const;
}
