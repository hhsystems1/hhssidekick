import { supabase } from '../lib/supabaseClient';

export async function listPendingActions() {
  const { data, error } = await supabase
    .from('action_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    return { actions: [], error: error.message } as const;
  }

  return { actions: data || [], error: null } as const;
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
