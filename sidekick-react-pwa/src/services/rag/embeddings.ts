/**
 * Embeddings Service
 * Generate text embeddings for RAG using OpenAI (cheapest option)
 * Groq doesn't have embeddings, so we use OpenAI text-embedding-3-small
 */

import type { AgentType } from '../../types/agents';
import { callLLM } from '../ai/llm-client';

// OpenAI API for embeddings
const OPENAI_EMBEDDING_URL = 'https://api.openai.com/v1/embeddings';
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSION = 1024;

export async function generateEmbedding(text: string): Promise<number[]> {
  const truncatedText = text.substring(0, 8000);

  // Check for OpenAI API key
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (openaiKey) {
    try {
      const response = await fetch(OPENAI_EMBEDDING_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: truncatedText,
          dimensions: EMBEDDING_DIMENSION,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('OpenAI embeddings error:', error);
    }
  }

  // Fallback: Generate pseudo-embedding using LLM
  console.warn('Using fallback embedding generation (not real embeddings)');
  return await generateLLMFallbackEmbedding(truncatedText);
}

// Generate embeddings batch
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  const batchSize = 5;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchEmbeddings = await Promise.all(
      batch.map(text => generateEmbedding(text))
    );
    embeddings.push(...batchEmbeddings);
    
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return embeddings;
}

// Fallback: Use LLM to generate semantic representation
async function generateLLMFallbackEmbedding(text: string): Promise<number[]> {
  const response = await callLLM({
    systemPrompt: `You are an embedding generator. Create a JSON array of ${EMBEDDING_DIMENSION} numbers between -1 and 1 representing the semantic meaning of the text. Similar concepts should have similar values. Return ONLY the JSON array.`,
    userMessage: `Generate embedding for: ${text.substring(0, 2000)}`,
    agentType: 'reflection' as AgentType,
    behavioralMode: 'mirror',
    maxTokens: 4096,
    temperature: 0,
  });

  try {
    const content = response.content;
    const match = content.match(/\[.*\]/s);
    if (match) {
      const numbers = JSON.parse(match[0]);
      if (numbers.length === EMBEDDING_DIMENSION) {
        return numbers;
      }
    }
  } catch (error) {
    console.error('Failed to parse fallback embedding:', error);
  }

  return new Array(EMBEDDING_DIMENSION).fill(0);
}

// Generate a simple hash-based embedding for testing
export function generateSimpleEmbedding(text: string): number[] {
  const dimension = EMBEDDING_DIMENSION;
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq: Record<string, number> = {};
  
  for (const word of words) {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  }
  
  const embedding: number[] = [];
  
  for (let i = 0; i < dimension; i++) {
    const wordIndex = i % words.length;
    const word = words[wordIndex] || '';
    
    let value = 0;
    if (word.length > 0) {
      value = (word.charCodeAt(0) / 127.5 - 1) * (wordFreq[word] || 1) / Math.max(words.length, 1);
    }
    
    value += Math.sin(i * 0.1) * 0.1;
    embedding.push(Math.max(-1, Math.min(1, value)));
  }
  
  return embedding;
}

export default {
  generateEmbedding,
  generateEmbeddingsBatch,
  generateSimpleEmbedding,
};
