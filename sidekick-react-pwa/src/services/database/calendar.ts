/**
 * Calendar Service
 * Manages calendar events in Supabase
 */

import { supabase } from '../../lib/supabaseClient';
import type { Database } from './types';

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row'];
type NewCalendarEvent = Database['public']['Tables']['calendar_events']['Insert'];
type CalendarEventUpdate = Database['public']['Tables']['calendar_events']['Update'];

/**
 * Get events for a user in a date range
 */
export async function getUserEvents(
  userId: string,
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', startDate)
    .lte('start_time', endDate)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return data || [];
}

/**
 * Get today's events for a user
 */
export async function getTodayEvents(userId: string): Promise<CalendarEvent[]> {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  return getUserEvents(userId, startOfDay, endOfDay);
}

/**
 * Get upcoming events (next 7 days)
 */
export async function getUpcomingEvents(userId: string, days: number = 7): Promise<CalendarEvent[]> {
  const now = new Date().toISOString();
  const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  return getUserEvents(userId, now, future);
}

/**
 * Get next event for a user
 */
export async function getNextEvent(userId: string): Promise<CalendarEvent | null> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', now)
    .order('start_time', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching next event:', error);
    return null;
  }

  return data;
}

/**
 * Create a new calendar event
 */
export async function createEvent(
  userId: string,
  title: string,
  startTime: string,
  options?: {
    endTime?: string;
    attendees?: string[];
    location?: string;
    metadata?: Record<string, any>;
  }
): Promise<CalendarEvent | null> {
  const newEvent: NewCalendarEvent = {
    user_id: userId,
    title,
    start_time: startTime,
    end_time: options?.endTime || null,
    attendees: options?.attendees || null,
    location: options?.location || null,
    metadata: options?.metadata || null,
  };

  const { data, error } = await supabase
    .from('calendar_events')
    .insert(newEvent)
    .select()
    .single();

  if (error) {
    console.error('Error creating event:', error);
    return null;
  }

  return data;
}

/**
 * Update a calendar event
 */
export async function updateEvent(
  eventId: string,
  updates: CalendarEventUpdate
): Promise<boolean> {
  const { error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', eventId);

  if (error) {
    console.error('Error updating event:', error);
    return false;
  }

  return true;
}

/**
 * Delete a calendar event
 */
export async function deleteEvent(eventId: string): Promise<boolean> {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', eventId);

  if (error) {
    console.error('Error deleting event:', error);
    return false;
  }

  return true;
}
