/**
 * Conversation Service
 * Manages conversations and messages in Supabase
 */

import { supabase } from '../../lib/supabaseClient';
import type { Database } from './types';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];
type NewConversation = Database['public']['Tables']['conversations']['Insert'];
type NewMessage = Database['public']['Tables']['messages']['Insert'];

/**
 * Create a new conversation
 */
export async function createConversation(
  userId: string,
  title?: string,
  metadata?: Record<string, any>
): Promise<Conversation | null> {
  const newConversation: NewConversation = {
    user_id: userId,
    title: title || null,
    metadata: metadata || null,
  };

  const { data, error } = await supabase
    .from('conversations')
    .insert(newConversation)
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  return data;
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a specific conversation
 */
export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) {
    console.error('Error fetching conversation:', error);
    return null;
  }

  return data;
}

/**
 * Update conversation metadata
 */
export async function updateConversation(
  conversationId: string,
  updates: { title?: string; metadata?: Record<string, any> }
): Promise<boolean> {
  const { error } = await supabase
    .from('conversations')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  if (error) {
    console.error('Error updating conversation:', error);
    return false;
  }

  return true;
}

/**
 * Delete a conversation (and all its messages via cascade)
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);

  if (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }

  return true;
}

// ============================================================================
// MESSAGE OPERATIONS
// ============================================================================

/**
 * Add a message to a conversation
 */
export async function addMessage(
  userId: string,
  conversationId: string,
  sender: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: {
    agentType?: string;
    behavioralMode?: string;
    tokensUsed?: number;
    executionTimeMs?: number;
    [key: string]: any;
  }
): Promise<Message | null> {
  const newMessage: NewMessage = {
    user_id: userId,
    conversation_id: conversationId,
    sender,
    content,
    agent_type: metadata?.agentType || null,
    behavioral_mode: metadata?.behavioralMode || null,
    metadata: metadata || null,
  };

  const { data, error } = await supabase
    .from('messages')
    .insert(newMessage)
    .select()
    .single();

  if (error) {
    console.error('Error adding message:', error);
    return null;
  }

  // Update conversation's updated_at timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data;
}

/**
 * Get all messages for a conversation
 */
export async function getConversationMessages(
  conversationId: string,
  limit?: number
): Promise<Message[]> {
  let query = supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data || [];
}

/**
 * Get recent messages across all conversations for a user
 */
export async function getRecentMessages(userId: string, limit: number = 50): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      conversations!inner(user_id)
    `)
    .eq('conversations.user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent messages:', error);
    return [];
  }

  return data || [];
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string): Promise<boolean> {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    console.error('Error deleting message:', error);
    return false;
  }

  return true;
}
