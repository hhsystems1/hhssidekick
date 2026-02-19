import { supabase } from '../../lib/supabaseClient';

export async function getUserMemory(userId: string) {
  const { data, error } = await supabase
    .from('user_memory')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function upsertUserMemory(userId: string, content: string) {
  const { data, error } = await supabase
    .from('user_memory')
    .upsert({
      user_id: userId,
      content,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

export async function getAgentMemory(userId: string, agentType: string) {
  const { data, error } = await supabase
    .from('agent_memory')
    .select('*')
    .eq('user_id', userId)
    .eq('agent_type', agentType)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function upsertAgentMemory(userId: string, agentType: string, content: string) {
  const { data, error } = await supabase
    .from('agent_memory')
    .upsert({
      user_id: userId,
      agent_type: agentType,
      content,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

export async function logMemoryAudit(userId: string, scope: string, action: string, metadata: Record<string, unknown>) {
  await supabase.from('memory_audit_logs').insert({
    user_id: userId,
    scope,
    action,
    metadata,
  });
}
