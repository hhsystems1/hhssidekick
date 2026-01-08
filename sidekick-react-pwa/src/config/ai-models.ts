/**
 * AI Model Configuration
 *
 * Maps agent types to their recommended models across different providers.
 * Supports Ollama (local), OpenAI, and Anthropic.
 */

import type { AgentType } from '../types/agents';

export type AIProvider = 'ollama' | 'openai' | 'anthropic';

export interface ModelConfig {
  ollama: string;
  openai?: string;
  anthropic?: string;
  description: string;
  reasoning: string;
}

/**
 * Model recommendations per agent type
 *
 * OLLAMA MODELS:
 * - llama3.1:8b - Fast, general purpose, good for reflection/creative tasks
 * - qwen2.5:14b - Excellent reasoning, good for strategy/systems
 * - deepseek-r1:14b - Strong technical reasoning, best for code/architecture
 * - mistral:7b - Alternative lightweight model
 *
 * OPENAI MODELS:
 * - gpt-4o-mini - Fast, cost-effective
 * - gpt-4o - Best quality
 *
 * ANTHROPIC MODELS:
 * - claude-3-5-haiku-20241022 - Fast, efficient
 * - claude-3-5-sonnet-20241022 - Best quality
 */
export const AGENT_MODELS: Record<AgentType, ModelConfig> = {
  reflection: {
    ollama: 'llama3.1:8b',
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-haiku-20241022',
    description: 'General thinking partner for clarity and reflection',
    reasoning: 'Needs conversational fluency and empathy, less focus on deep analysis'
  },

  strategy: {
    ollama: 'qwen2.5:14b',
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20241022',
    description: 'Business strategy, leverage, and decision analysis',
    reasoning: 'Requires strong reasoning for tradeoff analysis and long-term thinking'
  },

  systems: {
    ollama: 'qwen2.5:14b',
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20241022',
    description: 'Workflow design, automation, and process optimization',
    reasoning: 'Needs systematic thinking and ability to design complex processes'
  },

  technical: {
    ollama: 'deepseek-r1:14b',
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20241022',
    description: 'Software architecture, implementation, and debugging',
    reasoning: 'Optimized for code reasoning and technical problem-solving'
  },

  creative: {
    ollama: 'llama3.1:8b',
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20241022',
    description: 'Messaging, content, and communication',
    reasoning: 'Needs creative language generation and framing abilities'
  },

  orchestrator: {
    ollama: 'llama3.1:8b',
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-haiku-20241022',
    description: 'Routing and mode detection',
    reasoning: 'Fast classification task, lighter model sufficient'
  }
};

/**
 * Get the configured provider from environment variables
 */
export function getAIProvider(): AIProvider {
  const provider = import.meta.env.VITE_AI_PROVIDER?.toLowerCase();

  if (provider === 'openai' || provider === 'anthropic' || provider === 'ollama') {
    return provider;
  }

  // Default to Ollama
  return 'ollama';
}

/**
 * Get the model for a specific agent type
 * Checks environment variable override first, then falls back to defaults
 */
export function getModelForAgent(agentType: AgentType, provider?: AIProvider): string {
  const currentProvider = provider || getAIProvider();

  // Check for environment variable override
  const envKey = `VITE_MODEL_${agentType.toUpperCase()}`;
  const envOverride = import.meta.env[envKey];

  if (envOverride) {
    return envOverride;
  }

  // Use default from config
  const config = AGENT_MODELS[agentType];
  return config[currentProvider] || config.ollama;
}

/**
 * Get Ollama base URL from environment
 */
export function getOllamaURL(): string {
  return import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';
}

/**
 * Check if API keys are available for fallback providers
 */
export function hasOpenAIKey(): boolean {
  return !!import.meta.env.VITE_OPENAI_API_KEY;
}

export function hasAnthropicKey(): boolean {
  return !!import.meta.env.VITE_ANTHROPIC_API_KEY;
}

/**
 * Get available providers based on configuration
 */
export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = ['ollama']; // Always available (assumes local Ollama)

  if (hasOpenAIKey()) {
    providers.push('openai');
  }

  if (hasAnthropicKey()) {
    providers.push('anthropic');
  }

  return providers;
}

/**
 * Model parameters per provider
 */
export interface ModelParameters {
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * Get recommended parameters for a behavioral mode
 */
export function getParametersForMode(mode: string): ModelParameters {
  switch (mode) {
    case 'strategic':
    case 'execution':
      return {
        temperature: 0.4,  // Lower temp for analytical thinking
        maxTokens: 2000,
        topP: 0.9
      };

    case 'structuring':
      return {
        temperature: 0.5,
        maxTokens: 1500,
        topP: 0.9
      };

    case 'mirror':
    default:
      return {
        temperature: 0.6,  // Higher temp for conversational responses
        maxTokens: 1500,
        topP: 0.95
      };
  }
}
