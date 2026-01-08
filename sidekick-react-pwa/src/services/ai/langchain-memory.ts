/**
 * LangChain Memory Integration
 *
 * Provides conversation memory management using LangChain's memory abstractions
 * with Supabase as the persistence layer.
 */

import { BufferMemory } from 'langchain/memory';
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { supabase } from '../../lib/supabaseClient';

/**
 * Message format from Supabase database
 */
interface DBMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  agent_type?: string;
  behavioral_mode?: string;
}

/**
 * Supabase-backed chat message history
 * Stores and retrieves messages from database
 */
export class SupabaseChatMessageHistory extends ChatMessageHistory {
  private conversationId: string;
  private loaded: boolean = false;

  constructor(conversationId: string) {
    super();
    this.conversationId = conversationId;
  }

  /**
   * Load messages from Supabase on first access
   */
  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', this.conversationId)
      .order('created_at', { ascending: true })
      .limit(50); // Last 50 messages for context window

    if (error) {
      console.error('Failed to load message history:', error);
      return;
    }

    if (messages) {
      // Convert DB messages to LangChain message objects
      const langchainMessages = messages.map((msg) => this.dbMessageToLangChain(msg));
      this.messages = langchainMessages;
    }

    this.loaded = true;
  }

  /**
   * Convert database message to LangChain message format
   */
  private dbMessageToLangChain(dbMsg: DBMessage): BaseMessage {
    switch (dbMsg.sender) {
      case 'user':
        return new HumanMessage(dbMsg.content);
      case 'assistant':
        return new AIMessage(dbMsg.content);
      case 'system':
        return new SystemMessage(dbMsg.content);
      default:
        return new HumanMessage(dbMsg.content);
    }
  }

  /**
   * Add message to history and save to Supabase
   */
  async addMessage(message: BaseMessage): Promise<void> {
    await this.ensureLoaded();
    await super.addMessage(message);

    // Persist to Supabase
    const sender =
      message instanceof HumanMessage
        ? 'user'
        : message instanceof AIMessage
        ? 'assistant'
        : 'system';

    await supabase.from('messages').insert({
      conversation_id: this.conversationId,
      sender,
      content: message.content as string
    });
  }

  /**
   * Get all messages from history
   */
  async getMessages(): Promise<BaseMessage[]> {
    await this.ensureLoaded();
    return super.getMessages();
  }

  /**
   * Clear message history (both in-memory and database)
   */
  async clear(): Promise<void> {
    await super.clear();

    // Clear from database
    await supabase.from('messages').delete().eq('conversation_id', this.conversationId);

    this.loaded = false;
  }
}

/**
 * Create a BufferMemory instance backed by Supabase
 *
 * @param conversationId - ID of the conversation
 * @param maxTokenLimit - Optional token limit for memory (default: 2000)
 * @returns Configured BufferMemory instance
 */
export async function createSupabaseMemory(
  conversationId: string,
  maxTokenLimit: number = 2000
): Promise<BufferMemory> {
  const chatHistory = new SupabaseChatMessageHistory(conversationId);

  const memory = new BufferMemory({
    chatHistory,
    returnMessages: true,
    memoryKey: 'history',
    inputKey: 'input',
    outputKey: 'output'
  });

  return memory;
}

/**
 * Get conversation context as formatted string
 * Useful for including in prompts when not using LangChain chains
 *
 * @param conversationId - ID of the conversation
 * @param maxMessages - Maximum number of recent messages to include
 * @returns Formatted conversation history
 */
export async function getConversationContext(
  conversationId: string,
  maxMessages: number = 10
): Promise<string> {
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(maxMessages);

  if (error || !messages) {
    return '';
  }

  // Reverse to chronological order
  const chronological = messages.reverse();

  // Format as conversation
  return chronological
    .map((msg) => {
      const role = msg.sender === 'user' ? 'User' : 'Assistant';
      return `${role}: ${msg.content}`;
    })
    .join('\n\n');
}

/**
 * Summarize conversation for long-term memory
 * Uses LLM to create concise summary of conversation
 *
 * @param conversationId - ID of the conversation to summarize
 * @param llmCallback - Callback function to call LLM for summarization
 * @returns Summary text
 */
export async function summarizeConversation(
  conversationId: string,
  llmCallback: (prompt: string) => Promise<string>
): Promise<string> {
  const context = await getConversationContext(conversationId, 50);

  if (!context) {
    return '';
  }

  const prompt = `Summarize the following conversation between a user and their AI thinking partner (Sidekick).
Focus on:
- Key decisions made
- Projects or ideas discussed
- Action items identified
- Important context for future conversations

Conversation:
${context}

Summary:`;

  return await llmCallback(prompt);
}

/**
 * Save conversation summary to context_items
 *
 * @param userId - User ID
 * @param conversationId - Conversation ID
 * @param summary - Summary text
 */
export async function saveConversationSummary(
  userId: string,
  conversationId: string,
  summary: string
): Promise<void> {
  await supabase.from('context_items').insert({
    user_id: userId,
    type: 'note',
    title: `Conversation Summary - ${new Date().toISOString().split('T')[0]}`,
    description: summary,
    status: 'active',
    properties: {
      conversation_id: conversationId,
      type: 'conversation_summary',
      created_at: new Date().toISOString()
    },
    tags: ['conversation', 'summary']
  });
}

/**
 * Memory management utilities
 */
export class MemoryManager {
  private conversationId: string;
  private memory: BufferMemory | null = null;

  constructor(conversationId: string) {
    this.conversationId = conversationId;
  }

  /**
   * Initialize memory (lazy loading)
   */
  async getMemory(): Promise<BufferMemory> {
    if (!this.memory) {
      this.memory = await createSupabaseMemory(this.conversationId);
    }
    return this.memory;
  }

  /**
   * Add user message to memory
   */
  async addUserMessage(content: string): Promise<void> {
    const memory = await this.getMemory();
    await memory.chatHistory.addMessage(new HumanMessage(content));
  }

  /**
   * Add AI message to memory
   */
  async addAIMessage(content: string): Promise<void> {
    const memory = await this.getMemory();
    await memory.chatHistory.addMessage(new AIMessage(content));
  }

  /**
   * Get recent context for prompts
   */
  async getRecentContext(maxMessages: number = 10): Promise<string> {
    return await getConversationContext(this.conversationId, maxMessages);
  }

  /**
   * Create summary and save to long-term memory
   */
  async createSummary(
    userId: string,
    llmCallback: (prompt: string) => Promise<string>
  ): Promise<void> {
    const summary = await summarizeConversation(this.conversationId, llmCallback);
    if (summary) {
      await saveConversationSummary(userId, this.conversationId, summary);
    }
  }

  /**
   * Clear conversation memory
   */
  async clear(): Promise<void> {
    if (this.memory) {
      await this.memory.chatHistory.clear();
      this.memory = null;
    }
  }
}

/**
 * Get or create a MemoryManager for a conversation
 */
const memoryManagers = new Map<string, MemoryManager>();

export function getMemoryManager(conversationId: string): MemoryManager {
  if (!memoryManagers.has(conversationId)) {
    memoryManagers.set(conversationId, new MemoryManager(conversationId));
  }
  return memoryManagers.get(conversationId)!;
}
