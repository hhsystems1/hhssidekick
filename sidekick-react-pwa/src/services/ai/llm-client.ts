/**
 * LLM Client - Provider Abstraction Layer
 *
 * Unified interface for calling different LLM providers:
 * - Groq (recommended - fast & free)
 * - Ollama (local open source models)
 * - OpenAI (API fallback)
 * - Anthropic (API fallback)
 *
 * Automatically falls back to available providers if primary fails.
 */

import type { AgentType } from '../../types/agents';
import {
  getAIProvider,
  getModelForAgent,
  getParametersForMode,
  hasGroqKey,
  hasOpenAIKey,
  hasAnthropicKey,
  type AIProvider
} from '../../config/ai-models';
import { callOllama, checkOllamaAvailable, trackOllamaUsage } from './ollama';

/**
 * Unified request interface for all LLM providers
 */
export interface LLMRequest {
  systemPrompt: string;
  userMessage: string;
  agentType: AgentType;
  behavioralMode: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

/**
 * Unified response interface
 */
export interface LLMResponse {
  content: string;
  provider: AIProvider;
  model: string;
  tokensUsed?: number;
  executionTimeMs: number;
}

/**
 * Main LLM client function
 * Routes to appropriate provider and handles fallbacks
 */
export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const primaryProvider = getAIProvider();
  const model = getModelForAgent(request.agentType, primaryProvider);
  const params = getParametersForMode(request.behavioralMode);

  // Merge request params with mode defaults
  const temperature = request.temperature ?? params.temperature;
  const maxTokens = request.maxTokens ?? params.maxTokens;
  const topP = request.topP ?? params.topP;

  try {
    // Try primary provider
    return await callProvider(primaryProvider, {
      model,
      systemPrompt: request.systemPrompt,
      userMessage: request.userMessage,
      temperature,
      maxTokens,
      topP
    });
  } catch (error: any) {
    console.warn(`Primary provider ${primaryProvider} failed:`, error.message);

    // Try fallback providers
    const fallbackProviders = getFallbackProviders(primaryProvider);

    for (const fallbackProvider of fallbackProviders) {
      try {
        console.log(`Attempting fallback to ${fallbackProvider}...`);
        const fallbackModel = getModelForAgent(request.agentType, fallbackProvider);

        return await callProvider(fallbackProvider, {
          model: fallbackModel,
          systemPrompt: request.systemPrompt,
          userMessage: request.userMessage,
          temperature,
          maxTokens,
          topP
        });
      } catch (fallbackError: any) {
        console.warn(`Fallback ${fallbackProvider} failed:`, fallbackError.message);
        continue;
      }
    }

    // All providers failed
    throw new Error(
      `All LLM providers failed. Primary: ${primaryProvider} (${error.message}). ` +
        `Check your configuration and API keys.`
    );
  }
}

/**
 * Call a specific provider
 */
async function callProvider(
  provider: AIProvider,
  params: {
    model: string;
    systemPrompt: string;
    userMessage: string;
    temperature: number;
    maxTokens: number;
    topP?: number;
  }
): Promise<LLMResponse> {
  switch (provider) {
    case 'groq':
      return await callGroqProvider(params);

    case 'ollama':
      return await callOllamaProvider(params);

    case 'openai':
      return await callOpenAIProvider(params);

    case 'anthropic':
      return await callAnthropicProvider(params);

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Groq provider implementation
 * Requires VITE_GROQ_API_KEY environment variable
 * Uses OpenAI-compatible API
 */
async function callGroqProvider(params: {
  model: string;
  systemPrompt: string;
  userMessage: string;
  temperature: number;
  maxTokens: number;
}): Promise<LLMResponse> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('Groq API key not configured (VITE_GROQ_API_KEY)');
  }

  const startTime = Date.now();

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userMessage }
      ],
      temperature: params.temperature,
      max_tokens: params.maxTokens
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const executionTimeMs = Date.now() - startTime;

  return {
    content: data.choices[0].message.content,
    provider: 'groq',
    model: params.model,
    tokensUsed: data.usage?.total_tokens,
    executionTimeMs
  };
}

/**
 * Ollama provider implementation
 */
async function callOllamaProvider(params: {
  model: string;
  systemPrompt: string;
  userMessage: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
}): Promise<LLMResponse> {
  const response = await callOllama({
    model: params.model,
    systemPrompt: params.systemPrompt,
    userMessage: params.userMessage,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
    topP: params.topP
  });

  // Track usage statistics
  if (response.tokensUsed) {
    trackOllamaUsage(response.model, response.tokensUsed, response.executionTimeMs);
  }

  return {
    content: response.content,
    provider: 'ollama',
    model: response.model,
    tokensUsed: response.tokensUsed,
    executionTimeMs: response.executionTimeMs
  };
}

/**
 * OpenAI provider implementation
 * Requires VITE_OPENAI_API_KEY environment variable
 */
async function callOpenAIProvider(params: {
  model: string;
  systemPrompt: string;
  userMessage: string;
  temperature: number;
  maxTokens: number;
}): Promise<LLMResponse> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured (VITE_OPENAI_API_KEY)');
  }

  const startTime = Date.now();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userMessage }
      ],
      temperature: params.temperature,
      max_tokens: params.maxTokens
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const executionTimeMs = Date.now() - startTime;

  return {
    content: data.choices[0].message.content,
    provider: 'openai',
    model: params.model,
    tokensUsed: data.usage?.total_tokens,
    executionTimeMs
  };
}

/**
 * Anthropic provider implementation
 * Requires VITE_ANTHROPIC_API_KEY environment variable
 */
async function callAnthropicProvider(params: {
  model: string;
  systemPrompt: string;
  userMessage: string;
  temperature: number;
  maxTokens: number;
}): Promise<LLMResponse> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Anthropic API key not configured (VITE_ANTHROPIC_API_KEY)');
  }

  const startTime = Date.now();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: params.model,
      system: params.systemPrompt,
      messages: [{ role: 'user', content: params.userMessage }],
      temperature: params.temperature,
      max_tokens: params.maxTokens
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const executionTimeMs = Date.now() - startTime;

  return {
    content: data.content[0].text,
    provider: 'anthropic',
    model: params.model,
    tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
    executionTimeMs
  };
}

/**
 * Get fallback providers in priority order
 */
function getFallbackProviders(primaryProvider: AIProvider): AIProvider[] {
  const fallbacks: AIProvider[] = [];

  // Priority fallback chain based on primary provider
  if (primaryProvider === 'groq') {
    // Groq fails → try Ollama, then Anthropic, then OpenAI
    fallbacks.push('ollama');
    if (hasAnthropicKey()) fallbacks.push('anthropic');
    if (hasOpenAIKey()) fallbacks.push('openai');
  } else if (primaryProvider === 'ollama') {
    // Ollama fails → try Groq, then Anthropic, then OpenAI
    if (hasGroqKey()) fallbacks.push('groq');
    if (hasAnthropicKey()) fallbacks.push('anthropic');
    if (hasOpenAIKey()) fallbacks.push('openai');
  } else if (primaryProvider === 'openai') {
    // OpenAI fails → try Groq, then Ollama, then Anthropic
    if (hasGroqKey()) fallbacks.push('groq');
    fallbacks.push('ollama');
    if (hasAnthropicKey()) fallbacks.push('anthropic');
  } else if (primaryProvider === 'anthropic') {
    // Anthropic fails → try Groq, then Ollama, then OpenAI
    if (hasGroqKey()) fallbacks.push('groq');
    fallbacks.push('ollama');
    if (hasOpenAIKey()) fallbacks.push('openai');
  }

  return fallbacks;
}

/**
 * Health check for current provider
 */
export async function checkProviderHealth(): Promise<{
  provider: AIProvider;
  available: boolean;
  error?: string;
}> {
  const provider = getAIProvider();

  switch (provider) {
    case 'groq':
      return {
        provider,
        available: hasGroqKey(),
        error: hasGroqKey() ? undefined : 'Groq API key not configured'
      };

    case 'ollama':
      const ollamaAvailable = await checkOllamaAvailable();
      return {
        provider,
        available: ollamaAvailable,
        error: ollamaAvailable ? undefined : 'Ollama server not reachable'
      };

    case 'openai':
      return {
        provider,
        available: hasOpenAIKey(),
        error: hasOpenAIKey() ? undefined : 'OpenAI API key not configured'
      };

    case 'anthropic':
      return {
        provider,
        available: hasAnthropicKey(),
        error: hasAnthropicKey() ? undefined : 'Anthropic API key not configured'
      };

    default:
      return {
        provider,
        available: false,
        error: 'Unknown provider'
      };
  }
}

/**
 * Test connection to current provider
 */
export async function testConnection(): Promise<boolean> {
  try {
    const response = await callLLM({
      systemPrompt: 'You are a helpful assistant.',
      userMessage: 'Say "OK" if you can read this.',
      agentType: 'reflection',
      behavioralMode: 'mirror',
      maxTokens: 10
    });

    return response.content.toLowerCase().includes('ok');
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}
