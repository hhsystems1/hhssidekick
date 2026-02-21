/**
 * Type definitions for Sidekick agent system
 */

export type AgentType =
  | 'reflection'
  | 'strategy'
  | 'systems'
  | 'technical'
  | 'creative'
  | 'orchestrator';

export type BehavioralMode =
  | 'mirror'       // Exploring, clarifying, understanding
  | 'structuring'  // Organizing, planning, systematizing
  | 'strategic'    // Deciding, prioritizing, choosing direction
  | 'execution';   // Doing, implementing, taking action

export interface UserContext {
  userId: string;
  currentProject?: string;
  recentTopics?: string[];
  preferences?: Record<string, unknown>;
  baseMemory?: string;
  agentMemoryByType?: Partial<Record<AgentType, string>>;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface AgentRequest {
  messageContent: string;
  userContext: UserContext;
  conversationId: string;
  messageHistory: Message[];
}

export interface AgentResponse {
  content: string;
  agentType: AgentType;
  behavioralMode: BehavioralMode;
  routingReason?: string;
  extractedEntities?: string[];
  suggestedActions?: string[];
  metadata: {
    tokensUsed?: number;
    executionTimeMs: number;
    confidence: number;
    model?: string;
    provider?: string;
  };
}

export interface AgentMetadata {
  agentType: AgentType;
  behavioralMode: BehavioralMode;
  tokensUsed: number;
  executionTimeMs: number;
  model?: string;
  provider?: string;
}
