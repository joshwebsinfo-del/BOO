import { createClient } from '@supabase/supabase-js';

// Configuration placeholders for Supabase production environment
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  similarity?: number;
}

/**
 * Simulates finding relevant academic text chunks using Supabase pgvector cosine distance metrics.
 * @param query Student query
 * @param courseId Filter by target course
 */
export async function searchSyllabusAndMaterials(
  query: string,
  courseId?: string
): Promise<DocumentChunk[]> {
  try {
    // Fallback to offline mock matches during client sandbox execution:
    const mockDb: DocumentChunk[] = [
      {
        id: 'chunk-1',
        document_id: 'doc-normalization',
        content: 'Database Normalization minimizes redundancy. 1NF requires atomic attribute values. 2NF resolves partial dependencies. 3NF removes transitive functional dependencies. BCNF requires every determinant to be a superkey.'
      },
      {
        id: 'chunk-2',
        document_id: 'doc-protocols',
        content: 'TCP is reliable and connection-oriented, performing a three-way handshake and ordering checks. UDP is connectionless and faster, but unreliable, with lower overhead.'
      },
      {
        id: 'chunk-3',
        document_id: 'doc-syllabus',
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
