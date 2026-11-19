// lib/gemini-client.js
// Client for Google Gemini API with function calling, structured extraction, and timeout controls.
// Keeps credentials strictly server-side.

export const GEMINI_CONFIG = {
  defaultModel: 'gemini-1.5-flash',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models'
};

/**
 * Returns the configured Gemini model name from server-side environment or default.
 */
export function getGeminiModel() {
  return (process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.trim()) || GEMINI_CONFIG.defaultModel;
}

/**
 * Checks if the Gemini API key is configured.
 */
export function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10);
}

/**
 * Executes a structured Gemini prompt with timeout and error handling.
 * @param {string} prompt
 * @param {object} options
 */
export async function callGemini(prompt, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('MISSING_CREDENTIALS: GEMINI_API_KEY environment variable is not set.');
  }

  const model = options.model || getGeminiModel();
  const endpoint = `${GEMINI_CONFIG.baseUrl}/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 8000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        topP: 0.8,
        maxOutputTokens: options.maxTokens || 1024,
        responseMimeType: options.responseMimeType || 'application/json'
      }
    };

    if (options.systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: options.systemInstruction }]
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429) {
        throw new Error(`GEMINI_RATE_LIMITED: Gemini API rate limit reached (HTTP 429).`);
      }
      throw new Error(`GEMINI_API_ERROR (${response.status}): ${errText.slice(0, 200)}`);
    }

    const json = await response.json();
    const candidate = json.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text;

    if (!textPart) {
      throw new Error('GEMINI_EMPTY_RESPONSE: No text returned by Gemini.');
    }

    return textPart;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('GEMINI_TIMEOUT: Request to Gemini API timed out after 8 seconds.');
    }
    throw err;
  }
}
