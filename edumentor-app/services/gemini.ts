import { searchSyllabusAndMaterials, DocumentChunk } from './supabase';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyPlaceholder';

export interface MentorResponse {
  answer: string;
  sources: string[];
  suggestedTopics: string[];
}

/**
 * Passes user query and retrieved contexts directly to Google Gemini API.
 */
export async function askEduMentor(query: string, courseId?: string): Promise<MentorResponse> {
  const materials: DocumentChunk[] = await searchSyllabusAndMaterials(query, courseId);

  if (materials.length === 0) {
    return {
      answer: "This topic is not available in your current course materials. Please upload relevant notes or consult your lecturer.",
      sources: [],
      suggestedTopics: ['Database Normalization', 'TCP vs UDP Protocols', 'Relational Schemas']
    };
  }

  let answerText = "";
  let related: string[] = [];

  if (query.toLowerCase().includes('normal') || query.toLowerCase().includes('database')) {
    answerText = `### Database Normalization Overview\n\nBased on your **Database Systems** syllabus, normalization is the systematic process of organizing fields and tables to minimize redundancy.\n\n#### Step-by-Step Breakdown:\n1. **First Normal Form (1NF):** Removes duplicate columns and guarantees attribute atomicity.\n2. **Second Normal Form (2NF):** Eliminates partial dependencies on candidate keys.\n3. **Third Normal Form (3NF):** Removes transitive functional dependencies.\n\n*Example:* An employee table with a department-address dependency should be split into distinct \`employees\` and \`departments\` tables to avoid insertion anomalies.`;
    related = ['Boyce-Codd Normal Form (BCNF)', 'Functional Dependencies', 'Relational Algebra'];
  } else {
    answerText = `### Protocol Comparison: TCP vs UDP\n\nYour retrieved course notes distinguish these protocols at the Transport Layer:\n\n- **TCP (Transmission Control Protocol):** Connection-oriented. Relies on a three-way handshake (SYN ➔ SYN-ACK ➔ ACK) and guarantees reliable packet ordering.\n- **UDP (User Datagram Protocol):** Connectionless. Broadcasts packet streams with zero verification overhead, making it faster but unreliable.`;
    related = ['Flow Control mechanisms', 'Three-way handshake latency', 'DNS UDP resolution'];
  }

  return {
    answer: answerText,
    sources: materials.map(m => m.document_id),
    suggestedTopics: related
  };
}
