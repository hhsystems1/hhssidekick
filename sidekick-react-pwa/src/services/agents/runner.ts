import { supabase } from '../../lib/supabaseClient';

export async function enqueueAgentRun(agentId: string, payload: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke('agent-enqueue', {
    method: 'POST',
    body: { agent_id: agentId, payload },
  });

  if (error) {
    return { success: false, error: error.message } as const;
  }

  return { success: true, job: data.job } as const;
}
