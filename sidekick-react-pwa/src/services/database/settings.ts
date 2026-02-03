import { supabase } from '../../lib/supabaseClient';
import type { Database } from './types';

type UserSettings = Database['public']['Tables']['user_settings']['Row'];
type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update'];

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

// Default settings
const defaultSettings: UserSettings = {
  user_id: MOCK_USER_ID,
  push_notifications: true,
  email_notifications: true,
  task_reminders: true,
  two_factor_enabled: false,
  theme: 'dark',
  language: 'en',
  font_size: 'medium',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const getUserSettings = async (userId?: string): Promise<UserSettings> => {
  const id = userId || MOCK_USER_ID;

  // Try to fetch from Supabase
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', id)
    .single();

  if (error || !data) {
    // Return default settings for demo
    return { ...defaultSettings, user_id: id };
  }

  return data;
};

export const updateUserSettings = async (
  userId: string,
  updates: Partial<UserSettingsUpdate>
): Promise<{ data: UserSettings | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      ...updates,
      user_id: userId,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
};

export const updateNotificationSettings = async (
  userId: string,
  settings: {
    push_notifications?: boolean;
    email_notifications?: boolean;
    task_reminders?: boolean;
  }
): Promise<{ data: UserSettings | null; error: Error | null }> => {
  return updateUserSettings(userId, settings);
};

export const updateAppearanceSettings = async (
  userId: string,
  settings: {
    theme?: 'dark' | 'light' | 'system';
    font_size?: 'small' | 'medium' | 'large';
    language?: string;
  }
): Promise<{ data: UserSettings | null; error: Error | null }> => {
  return updateUserSettings(userId, settings);
};

export const updatePrivacySettings = async (
  userId: string,
  settings: {
    two_factor_enabled?: boolean;
  }
): Promise<{ data: UserSettings | null; error: Error | null }> => {
  return updateUserSettings(userId, settings);
};
