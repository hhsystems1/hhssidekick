/**
 * Base Specialist Agent
 *
 * Abstract base class that all specialist agents extend.
 * Handles common functionality like LLM calls, prompt construction, and response formatting.
 */

import { BaseMessage } from '@langchain/core/messages';
import type { AgentType, BehavioralMode, UserContext } from '../../types/agents';
import { callLLM } from '../../services/ai/llm-client';

export interface SpecialistProcessRequest {
  messageContent: string;
  userContext: UserContext;
  conversationId: string;
  behavioralMode: BehavioralMode;
  messageHistory: BaseMessage[];
}

export interface SpecialistProcessResponse {
  content: string;
  tokensUsed?: number;
  model?: string;
  provider?: string;
}

/**
 * Abstract base class for all specialist agents
 */
export abstract class BaseSpecialist {
  protected readonly agentType: AgentType;

  constructor(agentType: AgentType) {
    this.agentType = agentType;
  }

  /**
   * Main processing method that all specialists must implement
   */
  async process(request: SpecialistProcessRequest): Promise<SpecialistProcessResponse> {
    const { messageContent, userContext, behavioralMode } = request;

    // Build the system prompt based on agent type and behavioral mode
    const systemPrompt = this.buildSystemPrompt(behavioralMode, userContext);

    // Call the LLM with the correct interface
    const response = await callLLM({
      systemPrompt,
      userMessage: messageContent,
      agentType: this.agentType,
      behavioralMode,
      temperature: this.getTemperature(behavioralMode),
      maxTokens: this.getMaxTokens(behavioralMode),
    });

    return {
      content: response.content,
      tokensUsed: response.tokensUsed,
      model: response.model,
      provider: response.provider,
    };
  }

  /**
   * Build the system prompt based on agent type and behavioral mode
   * Each specialist overrides this to provide their specific prompt
   */
  protected abstract buildSystemPrompt(mode: BehavioralMode, userContext: UserContext): string;

  /**
   * Get the temperature for the LLM based on behavioral mode
   */
  protected getTemperature(mode: BehavioralMode): number {
    switch (mode) {
      case 'strategic':
      case 'execution':
        return 0.4; // Lower temperature for analytical/structured work
      case 'structuring':
        return 0.5; // Balanced
      case 'mirror':
        return 0.6; // Higher temperature for conversational/exploratory
      default:
        return 0.5;
    }
  }

  /**
   * Get the max tokens for the LLM based on behavioral mode
   */
  protected getMaxTokens(mode: BehavioralMode): number {
    switch (mode) {
      case 'strategic':
      case 'execution':
        return 2000; // More tokens for detailed analysis
      case 'structuring':
      case 'mirror':
        return 1500; // Moderate length for conversation
      default:
        return 1500;
    }
  }

  /**
   * Helper to extract domain context from user
   */
  protected getDomainContext(userContext: UserContext): string {
    const {
      currentProject,
      recentTopics,
      baseMemory,
      agentMemoryByType,
      projectMemory,
      projectContext,
      projectDailyLog,
    } = userContext;
    const parts: string[] = [];

    if (currentProject) {
      parts.push(`Current project: ${currentProject}`);
    }

    if (projectContext) {
      const contextLines = [
        `Project name: ${projectContext.name}`,
        projectContext.description ? `Description: ${projectContext.description}` : null,
        projectContext.repo_url ? `Repo: ${projectContext.repo_url}` : null,
        projectContext.deploy_target ? `Deploy target: ${projectContext.deploy_target}` : null,
        typeof projectContext.approvals_required === 'boolean'
          ? `Approvals required: ${projectContext.approvals_required ? 'yes' : 'no'}`
          : null,
      ].filter(Boolean) as string[];
      if (contextLines.length > 0) {
        parts.push(`Project context:\n${contextLines.join('\n')}`);
      }
    }

    if (recentTopics && recentTopics.length > 0) {
      parts.push(`Recent topics: ${recentTopics.join(', ')}`);
    }

    if (baseMemory) {
      parts.push(`Base memory:\n${baseMemory}`);
    }

    if (projectMemory) {
      parts.push(`Project memory:\n${projectMemory}`);
    }

    if (projectDailyLog) {
      const dailyParts = [
        projectDailyLog.summary ? `Summary: ${projectDailyLog.summary}` : null,
        projectDailyLog.tasks ? `Tasks: ${projectDailyLog.tasks}` : null,
        projectDailyLog.audits ? `Audits: ${projectDailyLog.audits}` : null,
      ].filter(Boolean) as string[];
      if (dailyParts.length > 0) {
        parts.push(`Today's log (${projectDailyLog.log_date}):\n${dailyParts.join('\n')}`);
      }
    }

    const agentOverlay = agentMemoryByType?.[this.agentType];
    if (agentOverlay) {
      parts.push(`Agent overlay (${this.agentType}):\n${agentOverlay}`);
    }

    return parts.length > 0 ? `\n\nContext:\n${parts.join('\n')}` : '';
  }
}
