/**
 * Database Types for Supabase
 *
 * These types match the expected Supabase schema.
 * Run the SQL migration in /database/schema.sql to create these tables.
 */

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: Record<string, any> | null;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender: 'user' | 'assistant' | 'system';
          content: string;
          created_at: string;
          agent_type: string | null;
          behavioral_mode: string | null;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender: 'user' | 'assistant' | 'system';
          content: string;
          created_at?: string;
          agent_type?: string | null;
          behavioral_mode?: string | null;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender?: 'user' | 'assistant' | 'system';
          content?: string;
          created_at?: string;
          agent_type?: string | null;
          behavioral_mode?: string | null;
          metadata?: Record<string, any> | null;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          completed: boolean;
          priority: 'high' | 'medium' | 'low';
          due_date: string | null;
          created_at: string;
          updated_at: string;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          completed?: boolean;
          priority?: 'high' | 'medium' | 'low';
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          completed?: boolean;
          priority?: 'high' | 'medium' | 'low';
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: Record<string, any> | null;
        };
      };
      agents: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          status: 'active' | 'idle' | 'paused';
          agent_type: string;
          config: Record<string, any> | null;
          last_run: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          status?: 'active' | 'idle' | 'paused';
          agent_type: string;
          config?: Record<string, any> | null;
          last_run?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          status?: 'active' | 'idle' | 'paused';
          agent_type?: string;
          config?: Record<string, any> | null;
          last_run?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      calendar_events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          start_time: string;
          end_time: string | null;
          attendees: string[] | null;
          location: string | null;
          metadata: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          start_time: string;
          end_time?: string | null;
          attendees?: string[] | null;
          location?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          start_time?: string;
          end_time?: string | null;
          attendees?: string[] | null;
          location?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string;
        };
      };
    };
  };
}
