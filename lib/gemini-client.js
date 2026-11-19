// lib/gemini-client.js
// Client for Google Gemini API with dynamic model discovery, multi-model fallback,
// structured extraction, sanitized diagnostics, and bounded timeout controls.
// Keeps credentials strictly server-side.

export const GEMINI_CONFIG = {
  defaultModel: 'gemini-2.5-flash',
  fallbackCandidates: [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
    'gemini-4-hydrogen'
  ],
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models'
};

let cachedActiveModel = null;
let lastDiagnostic = {
  hasKey: false,
  model: null,
  status: 'uninitialized',
  errorCode: 'NONE',
  details: ''
};

/**
 * Returns the currently active or configured Gemini model.
 */
export function getGeminiModel() {
  if (process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.trim()) {
    return process.env.GEMINI_MODEL.trim();
  }
  return cachedActiveModel || GEMINI_CONFIG.defaultModel;
}

/**
 * Checks if the Gemini API key is configured.
 */
export function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10);
}

/**
 * Returns sanitized server-side diagnostics without leaking credentials.
 */
export function getGeminiDiagnostics() {
  return {
    hasKey: hasGeminiKey(),
    configuredModel: process.env.GEMINI_MODEL || null,
    activeModel: getGeminiModel(),
    lastStatus: lastDiagnostic.status,
    errorCode: lastDiagnostic.errorCode,
    details: lastDiagnostic.details
  };
}

/**
 * Classifies an error into a standardized, sanitized diagnostic code.
 */
export function classifyGeminiError(err) {
  if (!err) return { code: 'NONE', message: '' };
  const msg = err.message || String(err);

  if (msg.includes('MISSING_CREDENTIALS')) {
    return { code: 'MISSING_KEY', message: 'GEMINI_API_KEY is not configured in server environment.' };
  }
  if (msg.includes('401') || msg.includes('403') || msg.includes('API_KEY_INVALID')) {
    return { code: 'AUTH_ERROR', message: 'Authentication failed. Please verify GEMINI_API_KEY permissions.' };
  }
  if (msg.includes('404') || msg.includes('not found') || msg.includes('UNAVAILABLE_MODEL')) {
    return { code: 'UNAVAILABLE_MODEL', message: 'Requested Gemini model is not supported or unavailable for this key.' };
  }
  if (msg.includes('429') || msg.includes('RATE_LIMITED') || msg.includes('quota')) {
    return { code: 'RATE_LIMITED', message: 'Gemini API rate limit or project quota reached (HTTP 429).' };
  }
  if (msg.includes('TIMEOUT') || msg.includes('AbortError')) {
    return { code: 'TIMEOUT', message: 'Gemini API request timed out after 8 seconds.' };
  }
  if (msg.includes('INVALID_STRUCTURED_OUTPUT') || msg.includes('JSON')) {
    return { code: 'INVALID_STRUCTURED_OUTPUT', message: 'Gemini response could not be parsed into expected JSON schema.' };
  }

  return { code: 'API_ERROR', message: 'External Gemini API request failed.' };
}

/**
 * Dynamically queries Google AI Studio to discover valid models supporting generateContent for this key.
 */
async function discoverSupportedModel(apiKey) {
  if (cachedActiveModel) return cachedActiveModel;
  if (process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.trim()) {
    cachedActiveModel = process.env.GEMINI_MODEL.trim();
    return cachedActiveModel;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      const models = json.models || [];
      const contentModels = models.filter(m =>
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes('generateContent')
      );

      // Check preferred candidates in order
      for (const candidate of GEMINI_CONFIG.fallbackCandidates) {
        const found = contentModels.find(m => m.name === `models/${candidate}` || m.name.endsWith(candidate));
        if (found) {
          cachedActiveModel = candidate;
          return cachedActiveModel;
        }
      }

      // Check for any flash model
      const flash = contentModels.find(m => m.name.toLowerCase().includes('flash'));
      if (flash) {
        cachedActiveModel = flash.name.replace(/^models\//, '');
        return cachedActiveModel;
      }

      if (contentModels.length > 0) {
        cachedActiveModel = contentModels[0].name.replace(/^models\//, '');
        return cachedActiveModel;
      }
    }
  } catch (err) {
    // Graceful fallback to default candidate
  }

  cachedActiveModel = GEMINI_CONFIG.defaultModel;
  return cachedActiveModel;
}

/**
 * Executes a structured Gemini prompt with timeout, model fallback, and sanitized error handling.
 * @param {string} prompt
 * @param {object} options
 */
export async function callGemini(prompt, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    lastDiagnostic = {
      hasKey: false,
      model: null,
      status: 'missing_credentials',
      errorCode: 'MISSING_KEY',
      details: 'GEMINI_API_KEY environment variable is not set.'
    };
    throw new Error('MISSING_CREDENTIALS: GEMINI_API_KEY environment variable is not set.');
  }

  // Determine model to use
  let targetModel = options.model || (await discoverSupportedModel(apiKey));
  const modelsToTry = [targetModel, ...GEMINI_CONFIG.fallbackCandidates.filter(m => m !== targetModel)];

  let lastError = null;

  for (const currentModel of modelsToTry) {
    const endpoint = `${GEMINI_CONFIG.baseUrl}/${currentModel}:generateContent?key=${apiKey}`;
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
        if (response.status === 404) {
          // Model unavailable on this tier/key, try next fallback candidate
          lastError = new Error(`GEMINI_API_ERROR (404): ${errText.slice(0, 160)}`);
          continue;
        }
        if (response.status === 429) {
          const classified = classifyGeminiError(new Error('RATE_LIMITED'));
          lastDiagnostic = { hasKey: true, model: currentModel, status: 'rate_limited', errorCode: classified.code, details: classified.message };
          throw new Error(`GEMINI_RATE_LIMITED: Gemini API rate limit reached (HTTP 429).`);
        }
        if (response.status === 401 || response.status === 403) {
          const classified = classifyGeminiError(new Error('AUTH_ERROR'));
          lastDiagnostic = { hasKey: true, model: currentModel, status: 'auth_error', errorCode: classified.code, details: classified.message };
          throw new Error(`GEMINI_AUTH_ERROR (${response.status}): Authentication failed.`);
        }
        throw new Error(`GEMINI_API_ERROR (${response.status}): ${errText.slice(0, 200)}`);
      }

      const json = await response.json();
      const candidate = json.candidates?.[0];
      const textPart = candidate?.content?.parts?.[0]?.text;

      if (!textPart) {
        throw new Error('GEMINI_EMPTY_RESPONSE: No text returned by Gemini.');
      }

      // Success! Update active model cache and diagnostics
      cachedActiveModel = currentModel;
      lastDiagnostic = {
        hasKey: true,
        model: currentModel,
        status: 'ai_success',
        errorCode: 'NONE',
        details: `Successfully completed generateContent using ${currentModel}.`
      };

      return textPart;
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        const classified = classifyGeminiError(new Error('TIMEOUT'));
        lastDiagnostic = { hasKey: true, model: currentModel, status: 'timeout', errorCode: classified.code, details: classified.message };
        throw new Error('GEMINI_TIMEOUT: Request to Gemini API timed out after 8 seconds.');
      }
      if (err.message && err.message.includes('404')) {
        // Continue to next candidate
        lastError = err;
        continue;
      }
      const classified = classifyGeminiError(err);
      lastDiagnostic = { hasKey: true, model: currentModel, status: 'failed', errorCode: classified.code, details: classified.message };
      throw err;
    }
  }

  // If all candidate models failed
  const finalClassified = classifyGeminiError(lastError);
  lastDiagnostic = {
    hasKey: true,
    model: targetModel,
    status: 'failed',
    errorCode: finalClassified.code,
    details: finalClassified.message
  };
  throw lastError || new Error('GEMINI_ALL_MODELS_UNAVAILABLE: All attempted Gemini models returned 404.');
}
