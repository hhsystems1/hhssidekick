import { supabase } from '../../lib/supabaseClient';

export async function listProjects(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: error.message } as const;
  return { data: data || [], error: null } as const;
}

export async function createProject(userId: string, project: {
  name: string;
  description?: string;
  repo_url?: string;
  deploy_target?: string;
  approvals_required?: boolean;
}) {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      ...project,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message } as const;
  return { data, error: null } as const;
}

export async function updateProject(projectId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) return { data: null, error: error.message } as const;
  return { data, error: null } as const;
}

export async function getProjectById(projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) return { data: null, error: error.message } as const;
  return { data, error: null } as const;
}

export async function getProjectMemory(projectId: string) {
  const { data, error } = await supabase
    .from('project_memory')
    .select('*')
    .eq('project_id', projectId)
    .single();

  if (error) return null;
  return data;
}

export async function upsertProjectMemory(projectId: string, content: string) {
  const { data, error } = await supabase
    .from('project_memory')
    .upsert({
      project_id: projectId,
      content,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message } as const;
  return { data, error: null } as const;
}

export async function getProjectDailyLog(projectId: string, logDate: string) {
  const { data, error } = await supabase
    .from('project_daily_log')
    .select('*')
    .eq('project_id', projectId)
    .eq('log_date', logDate)
    .single();

  if (error) return null;
  return data;
}

export async function upsertProjectDailyLog(
  projectId: string,
  logDate: string,
  updates: { summary?: string; tasks?: string; audits?: string }
) {
  const { data, error } = await supabase
    .from('project_daily_log')
    .upsert({
      project_id: projectId,
      log_date: logDate,
      summary: updates.summary ?? '',
      tasks: updates.tasks ?? '',
      audits: updates.audits ?? '',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message } as const;
  return { data, error: null } as const;
}
