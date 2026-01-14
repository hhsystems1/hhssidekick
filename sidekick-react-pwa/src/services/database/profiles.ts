import { supabase } from '../../lib/supabaseClient';
import type { Database } from './types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

export const getProfile = async (userId?: string): Promise<Profile | null> => {
  const id = userId || MOCK_USER_ID;

  // Try to fetch from Supabase
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    // Return mock data for demo
    return {
      id: id,
      email: 'demo@example.com',
      full_name: 'Demo User',
      avatar_url: null,
      timezone: 'America/New_York',
      preferences: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return data;
};

export const updateProfile = async (
  userId: string,
  updates: ProfileUpdate
): Promise<{ data: Profile | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
};

export const createProfile = async (
  userId: string,
  email: string,
  fullName?: string
): Promise<{ data: Profile | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email,
      full_name: fullName || null,
      preferences: {
        notifications: { push: true, email: true, taskReminders: true },
        appearance: { theme: 'dark', fontSize: 'medium' },
        privacy: { twoFactorEnabled: false, shareAnalytics: true },
      },
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
};

export const upsertProfile = async (
  userId: string,
  email: string,
  fullName?: string
): Promise<{ data: Profile | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email,
      full_name: fullName || null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
};
