/**
 * Ollama Client Service
 *
 * Provides integration with local Ollama server for running open source LLMs.
 * Supports multiple models per agent type and handles connection errors gracefully.
 */

import { Ollama } from 'ollama/browser';
import { getOllamaURL } from '../../config/ai-models';

/**
 * Ollama client singleton
 * Uses browser-compatible Ollama client for Vite/React
 */
let ollamaClient: Ollama | null = null;

export function getOllamaClient(): Ollama {
  if (!ollamaClient) {
    const baseUrl = getOllamaURL();
    ollamaClient = new Ollama({ host: baseUrl });
  }
  return ollamaClient;
}

/**
 * Request parameters for Ollama generation
 */
export interface OllamaRequest {
  model: string;
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

/**
 * Response from Ollama generation
 */
export interface OllamaResponse {
  content: string;
  model: string;
  tokensUsed?: number;
  executionTimeMs: number;
}

/**
 * Call Ollama for text generation
 *
 * @param request - Generation parameters
 * @returns Generated text and metadata
 * @throws Error if Ollama is unavailable or generation fails
 */
export async function callOllama(request: OllamaRequest): Promise<OllamaResponse> {
  const startTime = Date.now();
  const ollama = getOllamaClient();

  try {
    // Format messages for chat completion
    const response = await ollama.chat({
      model: request.model,
      messages: [
        {
          role: 'system',
          content: request.systemPrompt
        },
        {
          role: 'user',
          content: request.userMessage
        }
      ],
      options: {
        temperature: request.temperature ?? 0.5,
        num_predict: request.maxTokens ?? 1500,
        top_p: request.topP ?? 0.9
      },
      stream: false
    });

    const executionTimeMs = Date.now() - startTime;

    return {
      content: response.message.content,
      model: request.model,
      tokensUsed: response.eval_count,
      executionTimeMs
    };
  } catch (error: any) {
    console.error('Ollama generation error:', error);

    // Provide helpful error messages
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch failed')) {
      throw new Error(
        `Cannot connect to Ollama at ${getOllamaURL()}. ` +
        `Make sure Ollama is running: ollama serve`
      );
    }

    if (error.message?.includes('model') && error.message?.includes('not found')) {
      throw new Error(
        `Model "${request.model}" not found. ` +
        `Pull it first: ollama pull ${request.model}`
      );
    }

    throw new Error(`Ollama generation failed: ${error.message}`);
  }
}

/**
 * Check if Ollama is available and responsive
 *
 * @returns True if Ollama server is reachable
 */
export async function checkOllamaAvailable(): Promise<boolean> {
  try {
    const ollama = getOllamaClient();
    await ollama.list(); // List available models as health check
    return true;
  } catch (error) {
    console.warn('Ollama health check failed:', error);
    return false;
  }
}

/**
 * List available models on the Ollama server
 *
 * @returns Array of model names
 */
export async function listOllamaModels(): Promise<string[]> {
  try {
    const ollama = getOllamaClient();
    const response = await ollama.list();
    return response.models.map((m) => m.name);
  } catch (error) {
    console.error('Failed to list Ollama models:', error);
    return [];
  }
}

/**
 * Pull a model from Ollama registry
 * Note: This might take a while for large models
 *
 * @param modelName - Name of model to pull (e.g., 'llama3.1:8b')
 * @param onProgress - Optional callback for download progress
 */
export async function pullOllamaModel(
  modelName: string,
  onProgress?: (progress: { status: string; completed?: number; total?: number }) => void
): Promise<void> {
  const ollama = getOllamaClient();

  try {
    const stream = await ollama.pull({
      model: modelName,
      stream: true
    });

    for await (const chunk of stream) {
      if (onProgress && chunk.status) {
        onProgress({
          status: chunk.status,
          completed: chunk.completed,
          total: chunk.total
        });
      }
    }
  } catch (error: any) {
    throw new Error(`Failed to pull model ${modelName}: ${error.message}`);
  }
}

/**
 * Verify that required models are available for Sidekick agents
 * Returns list of missing models that need to be pulled
 *
 * @param requiredModels - Array of model names to check
 * @returns Array of missing model names
 */
export async function checkRequiredModels(requiredModels: string[]): Promise<string[]> {
  const availableModels = await listOllamaModels();
  const missing: string[] = [];

  for (const required of requiredModels) {
    // Ollama models can have tags, so check if base name matches
    const baseRequired = required.split(':')[0];
    const found = availableModels.some((available) => {
      const baseAvailable = available.split(':')[0];
      return baseAvailable === baseRequired || available === required;
    });

    if (!found) {
      missing.push(required);
    }
  }

  return missing;
}

/**
 * Get generation statistics for monitoring
 */
export interface GenerationStats {
  totalRequests: number;
  totalTokens: number;
  averageLatencyMs: number;
  modelUsage: Record<string, number>;
}

// Simple in-memory stats (could be moved to Supabase for persistence)
const stats: GenerationStats = {
  totalRequests: 0,
  totalTokens: 0,
  averageLatencyMs: 0,
  modelUsage: {}
};

/**
 * Track usage statistics (called internally after each generation)
 */
export function trackOllamaUsage(model: string, tokensUsed: number, latencyMs: number): void {
  stats.totalRequests++;
  stats.totalTokens += tokensUsed;

  // Update rolling average latency
  stats.averageLatencyMs =
    (stats.averageLatencyMs * (stats.totalRequests - 1) + latencyMs) / stats.totalRequests;

  // Track per-model usage
  stats.modelUsage[model] = (stats.modelUsage[model] || 0) + 1;
}

/**
 * Get current usage statistics
 */
export function getOllamaStats(): GenerationStats {
  return { ...stats };
}

/**
 * Reset usage statistics
 */
export function resetOllamaStats(): void {
  stats.totalRequests = 0;
  stats.totalTokens = 0;
  stats.averageLatencyMs = 0;
  stats.modelUsage = {};
}
