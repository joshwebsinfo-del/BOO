import { createClient } from '@supabase/supabase-js';

// Configuration credentials for Supabase production environment
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://flmhdvwsdvbtnjeekoxo.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsbWhkdndzZHZidG5qZWVrb3hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNzY0MDAsImV4cCI6MjA5OTg1MjQwMH0.5TAV7AHqZql0UyH7ShJteYg2JyXtQPW0TMetsFKUvkI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface DocumentChunk {
  id: string;
  material_id: string;
  chunk_index: number;
  content: string;
  similarity?: number;
}

/**
 * Finds relevant academic text chunks using Supabase pgvector cosine distance metrics (RPC).
 * Falls back gracefully to offline mock matches if credentials fail or are offline.
 * @param query Student query
 * @param queryEmbedding Optional vector embedding representation of the query
 */
export async function searchSyllabusAndMaterials(
  query: string,
  queryEmbedding?: number[]
): Promise<DocumentChunk[]> {
  try {
    if (queryEmbedding && queryEmbedding.length > 0) {
      console.log('[supabase.ts]: Querying remote pgvector matching function match_document_chunks...');
      const { data, error } = await supabase.rpc('match_document_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: 5
      });

      if (!error && data) {
        return data as DocumentChunk[];
      }
      console.warn('[supabase.ts]: match_document_chunks RPC returned error/null. Falling back to semantic word matching...', error);
    }

    // High fidelity offline fallback matches for robustness and terminal environment safety
    const mockDb: DocumentChunk[] = [
      {
        id: 'chunk-1',
        material_id: 'doc-normalization',
        chunk_index: 0,
        content: 'Database Normalization minimizes redundancy. 1NF requires atomic attribute values. 2NF resolves partial dependencies. 3NF removes transitive functional dependencies. BCNF requires every determinant to be a superkey.'
      },
      {
        id: 'chunk-2',
        material_id: 'doc-protocols',
        chunk_index: 1,
        content: 'TCP is reliable and connection-oriented, performing a three-way handshake and ordering checks. UDP is connectionless and faster, but unreliable, with lower overhead.'
      },
      {
        id: 'chunk-3',
        material_id: 'doc-syllabus',
        chunk_index: 2,
        content: 'CS301 Relational Databases. Syllabus includes functional dependencies, keys, normalization, index tables, and physical storage design.'
      }
    ];

    const normalizedQuery = query.toLowerCase();
    return mockDb.filter(chunk =>
      chunk.content.toLowerCase().split(' ').some(word => normalizedQuery.includes(word))
    );
  } catch (err) {
    console.error('Supabase pgvector search failed:', err);
    return [];
  }
}
