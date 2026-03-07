import axios from 'axios';

const COHERE_API_KEY = process.env.COHERE_API_KEY;
const COHERE_MODEL = process.env.COHERE_MODEL || 'command-xlarge';
const COHERE_API_BASE_URL = process.env.COHERE_API_BASE_URL || 'https://api.cohere.com/v1';

/**
 * Generate text using Cohere's Chat API (Migrated from Generate API)
 * @param {string} prompt
 * @param {object} options { max_tokens, temperature }
 */
export async function generateCompletion(prompt, options = {}) {
  if (!COHERE_API_KEY) {
    throw new Error('COHERE_API_KEY not configured');
  }

  const payload = {
    model: COHERE_MODEL,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: options.max_tokens || 600,
    temperature: typeof options.temperature === 'number' ? options.temperature : 0.2,
  };

  try {
    const resp = await axios.post(`${COHERE_API_BASE_URL.replace(/\/$/, '')}/chat`, payload, {
      headers: {
        Authorization: `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: options.timeout || 30_000,
    });

    // Cohere V2 Chat API returns text in message.content[0].text
    const text = resp?.data?.message?.content?.[0]?.text;
    return text ?? '';
  } catch (err) {
    // Surface HTTP errors with status and response body for easier debugging
    if (err.response) {
      const status = err.response.status;
      const data = err.response.data;
      const message = `Cohere API error: ${status} - ${JSON.stringify(data)}`;
      const e = new Error(message);
      e.status = status;
      e.response = data;
      throw e;
    }
    throw err;
  }
}

export default { generateCompletion };
