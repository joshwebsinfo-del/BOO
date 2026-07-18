/**
 * Secure EduMentor AI Frontend Service
 * Communicates strictly with the backend node.js Express API.
 * Never leaks AI provider API keys in frontend.
 */

// Production Backend API URL configured via Expo environment variables
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Sends a structured learning query to the Node.js secure backend server with automatic retry logic.
 * @param {string} message - Student query
 * @param {string} [subject] - Academic subject context
 * @param {string} [context] - Additional text materials context
 * @returns {Promise<{ answer: string; model: string; success: boolean }>}
 */
export async function askAI(message, subject = 'General', context = '') {
  const endpoint = `${API_URL}/api/ai/chat`;
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[aiService]: Requesting secure backend (Attempt ${attempt}/${maxRetries})...`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, subject, context })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return {
        answer: data.answer,
        model: data.model || 'unknown',
        success: data.success ?? true
      };
    } catch (err) {
      console.warn(`[aiService]: Attempt ${attempt} failed: ${err.message}`);
      lastError = err;
      if (attempt < maxRetries) {
        // Wait briefly (backoff helper) before retrying
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
      }
    }
  }

  // Handle terminal error or fallback gracefully
  console.error('[aiService]: All connection attempts to secure backend failed.', lastError);

  // High fidelity fallback offline response for offline resilience and developer safety
  let fallbackText = "Offline simulation answer: Database normalization involves 1NF (atomicity), 2NF (no partial dependency), and 3NF (no transitive dependency).";
  if (message.toLowerCase().includes('tcp') || message.toLowerCase().includes('udp')) {
    fallbackText = "Offline simulation answer: TCP is connection-oriented and reliable; UDP is connectionless, fast, and low-latency.";
  }

  return {
    answer: fallbackText + `\n\n(Note: Secure backend connection error occurred: ${lastError.message})`,
    model: 'offline-simulator',
    success: false
  };
}
