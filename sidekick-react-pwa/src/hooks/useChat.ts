/**
 * Chat Persistence Hooks
 * React hooks for managing chat conversations and messages
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '../services/database/types';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000000';

export function useConversations(userId?: string) {
  const actualUserId = userId || MOCK_USER_ID;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
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
      
      // Fallback mock data
      setConversations([
        {
          id: '1',
          user_id: actualUserId,
          title: 'Support Team',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: null,
        },
        {
          id: '2',
          user_id: actualUserId,
          title: 'General Chat',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          metadata: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [actualUserId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const createConversation = useCallback(async (title?: string) => {
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
      // Create mock conversation for demo
      const mockConv: Conversation = {
        id: Date.now().toString(),
        user_id: actualUserId,
        title: title || 'New Chat',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: null,
      };
      setConversations([mockConv, ...conversations]);
      return mockConv;
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

export function useMessages(conversationId: string | null, userId?: string) {
  const actualUserId = userId || MOCK_USER_ID;
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
      // Fallback mock messages
      setMessages([
        {
          id: '1',
          conversation_id: conversationId,
          user_id: actualUserId,
          sender: 'assistant',
          content: 'Hello! How can I help you today?',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          agent_type: null,
          behavioral_mode: null,
          metadata: null,
        },
      ]);
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
      const msgUserId = user?.id || actualUserId;

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
      
      // Add mock message for demo
      const mockMessage: Message = {
        id: Date.now().toString(),
        conversation_id: conversationId,
        user_id: actualUserId,
        content,
        sender,
        created_at: new Date().toISOString(),
        agent_type: agentType || null,
        behavioral_mode: behavioralMode || null,
        metadata: null,
      };
      setMessages([...messages, mockMessage]);
      return mockMessage;
    }
  }, [conversationId, actualUserId, messages]);

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
