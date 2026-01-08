/**
 * Main Agent System Entry Point
 *
 * MIGRATION: Now uses LangGraph workflow for orchestration instead of
 * linear routing. This provides better state management and visualization.
 *
 * Usage:
 *   const response = await processWithAgents(request);
 */

import { runWorkflow } from './orchestrator/workflow';
import type { AgentRequest, AgentResponse } from '../types/agents';
import { HumanMessage } from '@langchain/core/messages';
import { getMemoryManager } from '../services/ai/langchain-memory';

/**
 * Main entry point for agent system
 * This is what the UI calls
 *
 * BEFORE (old approach):
 *   orchestrate() → get specialist → call specialist
 *
 * AFTER (LangGraph):
 *   runWorkflow() → state machine handles everything
 *
 * @param request - User message + context
 * @returns Agent response with metadata
 */
export async function processWithAgents(request: AgentRequest): Promise<AgentResponse> {
  console.log('📥 [Agent System] Processing request...');

  try {
    // Convert message history to LangChain format
    const messageHistory = request.messageHistory.map((msg) => {
      return msg.sender === 'user'
        ? new HumanMessage(msg.content)
        : new HumanMessage(msg.content); // Simplified for now
    });

    // Run LangGraph workflow
    const result = await runWorkflow({
      messageContent: request.messageContent,
      userContext: request.userContext,
      conversationId: request.conversationId,
      messageHistory,
    });

    // Check for errors
    if (result.error) {
      throw new Error(result.error);
    }

    // Build response object
    const response: AgentResponse = {
      content: result.response || 'No response generated',
      agentType: result.agentMetadata!.agentType,
      behavioralMode: result.agentMetadata!.behavioralMode,
      routingReason: result.routingReason,
      extractedEntities: [], // TODO: Extract entities in processWithSpecialist
      suggestedActions: [], // TODO: Extract actions in processWithSpecialist
      metadata: {
        tokensUsed: result.agentMetadata!.tokensUsed,
        executionTimeMs: result.agentMetadata!.executionTimeMs,
        confidence: result.routingConfidence || 0.8,
      },
    };

    // Update memory (async, don't block response)
    updateMemoryAsync(request, response);

    console.log('📤 [Agent System] Response ready:', {
      agent: response.agentType,
      mode: response.behavioralMode,
      tokens: response.metadata.tokensUsed,
      time: response.metadata.executionTimeMs + 'ms',
    });

    return response;
  } catch (error: any) {
    console.error('❌ [Agent System] Error:', error);

    // Fallback response
    return {
      content:
        "I encountered an issue processing your request. This might be because the agent system is still being set up. The error was: " +
        error.message,
      agentType: 'reflection',
      behavioralMode: 'mirror',
      extractedEntities: [],
      metadata: {
        tokensUsed: 0,
        executionTimeMs: 0,
        confidence: 0,
      },
    };
  }
}

/**
 * Update conversation memory (async)
 * This happens in the background after responding to user
 */
async function updateMemoryAsync(request: AgentRequest, response: AgentResponse): Promise<void> {
  try {
    const memoryManager = getMemoryManager(request.conversationId);

    // Add user message
    await memoryManager.addUserMessage(request.messageContent);

    // Add AI response
    await memoryManager.addAIMessage(response.content);
  } catch (error) {
    console.warn('Memory update failed (non-blocking):', error);
  }
}

// ============================================================================
// BACKWARD COMPATIBILITY (OLD INTERFACE)
// ============================================================================

/**
 * @deprecated Use processWithAgents() instead
 * Kept for backward compatibility during migration
 */
export async function orchestrate(request: AgentRequest): Promise<any> {
  console.warn('orchestrate() is deprecated, use processWithAgents()');
  return processWithAgents(request);
}
