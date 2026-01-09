/**
 * Base Specialist Agent
 *
 * Common interface and utilities for all specialist agents.
 */

import { callLLM } from '../../services/ai/llm-client';
import type { AgentType, BehavioralMode, UserContext } from '../../types/agents';
import { BaseMessage } from '@langchain/core/messages';

export interface SpecialistRequest {
  messageContent: string;
  userContext: UserContext;
  conversationId: string;
  behavioralMode: BehavioralMode;
  messageHistory: BaseMessage[];
}

export interface SpecialistResponse {
  content: string;
  tokensUsed?: number;
}

/**
 * Abstract base class for all specialists
 */
export abstract class BaseSpecialist {
  protected agentType: AgentType;

  constructor(agentType: AgentType) {
    this.agentType = agentType;
  }

  /**
   * Process a request with this specialist
   */
  async process(request: SpecialistRequest): Promise<SpecialistResponse> {
    const systemPrompt = this.buildSystemPrompt(request.behavioralMode);
    const userMessage = this.buildUserMessage(request);

    try {
      const response = await callLLM({
        systemPrompt,
        userMessage,
        agentType: this.agentType,
        behavioralMode: request.behavioralMode,
      });

      return {
        content: response.content,
        tokensUsed: response.tokensUsed,
      };
    } catch (error: any) {
      console.error(`[${this.agentType}] Processing failed:`, error);
      throw new Error(`${this.agentType} agent failed: ${error.message}`);
    }
  }

  /**
   * Build the system prompt based on agent type and behavioral mode
   * Subclasses should override this to customize their behavior
   */
  protected abstract buildSystemPrompt(mode: BehavioralMode): string;

  /**
   * Build the user message with context
   * Can be overridden if specialist needs custom context formatting
   */
  protected buildUserMessage(request: SpecialistRequest): string {
    let message = request.messageContent;

    // Add conversation context if available
    if (request.messageHistory.length > 0) {
      const recentHistory = request.messageHistory.slice(-3); // Last 3 messages
      const historyText = recentHistory
        .map((msg) => `${msg._getType()}: ${msg.content}`)
        .join('\n');

      message = `Recent conversation:\n${historyText}\n\nCurrent message: ${message}`;
    }

    return message;
  }
}
