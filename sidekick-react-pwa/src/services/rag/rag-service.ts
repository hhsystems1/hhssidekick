/**
 * RAG Service
 * Retrieval-Augmented Generation for knowledge base querying
 */

import { supabase } from '../../lib/supabaseClient';
import { generateEmbedding, generateSimpleEmbedding } from './embeddings';
import { callLLM } from '../ai/llm-client';
import type { AgentType } from '../../types/agents';

const SIMILARITY_THRESHOLD = 0.5;
const MAX_CHUNKS = 5;

export interface SearchResult {
  id: string;
  documentId: string;
  documentTitle: string;
  content: string;
  similarity: number;
}

export interface RAGResponse {
  content: string;
  sources: Array<{
    title: string;
    excerpt: string;
    similarity: number;
  }>;
}

/**
 * Search the knowledge base for relevant documents
 */
export async function searchKnowledgeBase(
  userId: string,
  query: string,
  limit: number = MAX_CHUNKS
): Promise<SearchResult[]> {
  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Call the PostgreSQL function for vector search
    const { data, error } = await supabase
      .rpc('match_document_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: SIMILARITY_THRESHOLD,
        match_count: limit,
        user_uuid: userId
      })
      .select('id, document_id, content, similarity, documents(title)');

    if (error) {
      console.error('RAG search error:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    // Ensure we have an array
    const chunks = Array.isArray(data) ? data : [data];

    return chunks.map((chunk: Record<string, unknown>) => ({
      id: chunk.id as string,
      documentId: chunk.document_id as string,
      documentTitle: Array.isArray(chunk.documents) 
        ? (chunk.documents[0] as { title: string })?.title || 'Unknown'
        : 'Unknown',
      content: chunk.content as string,
      similarity: chunk.similarity as number,
    }));
  } catch (error) {
    console.error('RAG search error:', error);
    return [];
  }
}

/**
 * Generate RAG-enhanced response using knowledge base
 */
export async function generateRAGResponse(
  userId: string,
  query: string,
  systemPrompt: string,
  agentType: AgentType = 'reflection',
  behavioralMode: string = 'mirror'
): Promise<RAGResponse> {
  // Get relevant context from knowledge base
  const contextChunks = await searchKnowledgeBase(userId, query);

  if (contextChunks.length === 0) {
    // No relevant documents found, use regular response
    const response = await callLLM({
      systemPrompt,
      userMessage: query,
      agentType,
      behavioralMode,
      maxTokens: 2000,
    });

    return {
      content: response.content,
      sources: [],
    };
  }

  // Build context from documents
  const context = contextChunks
    .map((chunk, i) => `[Document ${i + 1}: ${chunk.documentTitle}]\n${chunk.content}`)
    .join('\n\n');

  // Enhanced system prompt with RAG context
  const enhancedPrompt = `${systemPrompt}

You have access to the user's knowledge base. Use this context to provide accurate, grounded answers.

=== KNOWLEDGE BASE CONTEXT ===
${context}
=== END CONTEXT ===

When referencing information from the knowledge base, cite the document title in brackets.`;

  const response = await callLLM({
    systemPrompt: enhancedPrompt,
    userMessage: query,
    agentType,
    behavioralMode,
    maxTokens: 2000,
  });

  return {
    content: response.content,
    sources: contextChunks.map(chunk => ({
      title: chunk.documentTitle,
      excerpt: chunk.content.substring(0, 300) + (chunk.content.length > 300 ? '...' : ''),
      similarity: chunk.similarity,
    })),
  };
}

/**
 * Add a document to the knowledge base
 */
export async function addDocument(
  userId: string,
  title: string,
  content: string,
  fileType: string = 'text'
): Promise<{ documentId: string; chunkCount: number }> {
  // Create document record
  const { data: document, error: docError } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      title,
      content,
      file_type: fileType,
      status: 'processing'
    })
    .select()
    .single();

  if (docError) {
    throw docError;
  }

  try {
    // Chunk the content
    const chunks = chunkText(content, 2000);

    // Generate embeddings and store chunks
    const chunkRecords = await Promise.all(
      chunks.map(async (chunkText, index) => {
        let embedding: number[];
        try {
          embedding = await generateEmbedding(chunkText);
        } catch {
          embedding = generateSimpleEmbedding(chunkText);
        }

        return {
          document_id: document.id,
          content: chunkText,
          embedding,
          metadata: { chunk_index: index },
        };
      })
    );

    const { error: chunkError } = await supabase
      .from('document_chunks')
      .insert(chunkRecords);

    if (chunkError) {
      throw chunkError;
    }

    // Update document status
    await supabase
      .from('documents')
      .update({ status: 'ready' })
      .eq('id', document.id);

    return { documentId: document.id, chunkCount: chunks.length };
  } catch (error) {
    // Mark as error on failure
    await supabase
      .from('documents')
      .update({ 
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('id', document.id);
    throw error;
  }
}

/**
 * Delete a document and its chunks
 */
export async function deleteDocument(documentId: string): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (error) {
    throw error;
  }
}

/**
 * Get all documents for a user
 */
export async function getUserDocuments(userId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }

  return data || [];
}

/**
 * Get document by ID
 */
export async function getDocument(documentId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Helper: Split text into chunks
 */
function chunkText(text: string, maxChars: number): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  
  let currentChunk = '';
  for (const para of paragraphs) {
    const paraClean = para.trim();
    if (!paraClean) continue;
    
    if ((currentChunk + paraClean).length > maxChars) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = paraClean;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paraClean;
    }
  }
  if (currentChunk) chunks.push(currentChunk);
  
  return chunks;
}

export default {
  searchKnowledgeBase,
  generateRAGResponse,
  addDocument,
  deleteDocument,
  getUserDocuments,
  getDocument,
};
