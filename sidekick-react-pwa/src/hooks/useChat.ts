/**
 * Chat Persistence Hooks
 * React hooks for managing chat conversations and messages
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../services/database/types';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

export function useConversations(userId?: string) {
  const actualUserId = userId;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!actualUserId) {
      setLoading(false);
      setConversations([]);
      return;
    }
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', actualUserId)
        .order('updated_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setConversations(data || []);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [actualUserId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const createConversation = useCallback(async (title?: string) => {
    if (!actualUserId) return null;
    try {
      const { data, error: createError } = await supabase
        .from('conversations')
        .insert({
          user_id: actualUserId,
          title: title || 'New Chat'
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      if (data) {
        setConversations([data, ...conversations]);
        return data;
      }
      return null;
    } catch (err) {
      console.error('Error creating conversation:', err);
      return null;
    }
  }, [actualUserId, conversations]);

  const updateConversation = useCallback(async (id: string, updates: Partial<Conversation>) => {
    try {
      const { error: updateError } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      setConversations(conversations.map(c => 
        c.id === id ? { ...c, ...updates } : c
      ));
    } catch (err) {
      console.error('Error updating conversation:', err);
    }
  }, [conversations]);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setConversations(conversations.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting conversation:', err);
      // Optimistic deletion for demo
      setConversations(conversations.filter(c => c.id !== id));
    }
  }, [conversations]);

  return {
    conversations,
    loading,
    error,
    createConversation,
    updateConversation,
    deleteConversation,
    reload: loadConversations
  };
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const addMessage = useCallback(async (
    content: string,
    sender: 'user' | 'assistant',
    agentType?: string,
    behavioralMode?: string
  ) => {
    if (!conversationId) return null;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const msgUserId = user?.id;
      
      if (!msgUserId) {
        console.error('Cannot add message: No user ID available');
        return null;
      }

      const { data, error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          user_id: msgUserId,
          content,
          sender,
          agent_type: agentType || null,
          behavioral_mode: behavioralMode || null
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      if (data) {
        setMessages([...messages, data]);
        
        // Update conversation timestamp
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);
      }

      return data;
    } catch (err) {
      console.error('Error adding message:', err);
      return null;
    }
  }, [conversationId, messages]);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (deleteError) {
        throw deleteError;
      }

      setMessages(messages.filter(m => m.id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  }, [messages]);

  return {
    messages,
    loading,
    addMessage,
    deleteMessage,
    reload: loadMessages
  };
}

export default {
  useConversations,
  useMessages,
};
