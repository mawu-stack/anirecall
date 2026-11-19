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

let discoveredContentModels = null;

/**
 * Dynamically queries Google AI Studio to discover valid models supporting generateContent for this key.
 */
async function discoverContentModels(apiKey) {
  if (discoveredContentModels && discoveredContentModels.length > 0) {
    return discoveredContentModels;
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
      const contentModels = models
        .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace(/^models\//, ''));

      if (contentModels.length > 0) {
        discoveredContentModels = contentModels;
        return discoveredContentModels;
      }
    }
  } catch (err) {
    // Graceful fallback to default candidates
  }

  return GEMINI_CONFIG.fallbackCandidates;
}

/**
 * Executes a structured Gemini prompt with timeout, model fallback, and request-scoped diagnostics.
 * @param {string} prompt
 * @param {object} options
 */
export async function callGemini(prompt, options = {}) {
  const reqDiag = options.requestDiagnostics || null;
  const stage = options.stage || 'inference';

  const updateDiag = (status, code, details, model = null) => {
    lastDiagnostic = {
      hasKey: Boolean(process.env.GEMINI_API_KEY),
      model: model || getGeminiModel(),
      status,
      errorCode: code,
      details
    };
    if (reqDiag) {
      reqDiag.hasKey = Boolean(process.env.GEMINI_API_KEY);
      if (model) reqDiag.activeModel = model;
      reqDiag.status = status;
      reqDiag.errorCode = code;
      reqDiag.details = details;
      if (!reqDiag.stages) reqDiag.stages = {};
      reqDiag.stages[stage] = { status, model: model || reqDiag.activeModel, code };
    }
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    updateDiag('missing_credentials', 'MISSING_KEY', 'GEMINI_API_KEY environment variable is not set.');
    throw new Error('MISSING_CREDENTIALS: GEMINI_API_KEY environment variable is not set.');
  }

  // Confirmed models through Google's current model-list endpoint
  const confirmedModels = await discoverContentModels(apiKey);
  if (reqDiag) {
    reqDiag.confirmedModels = confirmedModels.slice(0, 6);
  }

  // Determine target model
  let targetModel = options.model || (process.env.GEMINI_MODEL ? process.env.GEMINI_MODEL.trim() : null);
  if (!targetModel) {
    // Prefer modern flash model from confirmed models
    const flash = confirmedModels.find(m => m.includes('flash') && !m.includes('1.5'));
    const anyFlash = confirmedModels.find(m => m.includes('flash'));
    targetModel = flash || anyFlash || confirmedModels[0] || GEMINI_CONFIG.defaultModel;
  }

  // Bounded attempts: try at most 3 confirmed models
  const modelsToTry = [targetModel, ...confirmedModels.filter(m => m !== targetModel)].slice(0, 3);

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
          maxOutputTokens: Math.max(512, options.maxTokens || 1024),
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
          updateDiag('rate_limited', classified.code, classified.message, currentModel);
          throw new Error(`GEMINI_RATE_LIMITED: Gemini API rate limit reached (HTTP 429).`);
        }
        if (response.status === 401 || response.status === 403) {
          const classified = classifyGeminiError(new Error('AUTH_ERROR'));
          updateDiag('auth_error', classified.code, classified.message, currentModel);
          throw new Error(`GEMINI_AUTH_ERROR (${response.status}): Authentication failed.`);
        }
        throw new Error(`GEMINI_API_ERROR (${response.status}): ${errText.slice(0, 200)}`);
      }

      const json = await response.json();
      const candidate = json.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      // Extract text: filter out thinking parts (where part.thought === true)
      const nonThoughtParts = parts.filter(p => !p.thought && typeof p.text === 'string');
      let textPart = nonThoughtParts.map(p => p.text).join('').trim();
      if (!textPart) {
        textPart = parts.map(p => p.text).filter(Boolean).join('').trim();
      }

      if (!textPart) {
        throw new Error('GEMINI_EMPTY_RESPONSE: No text returned by Gemini.');
      }

      // Success! Update active model cache and diagnostics
      cachedActiveModel = currentModel;
      updateDiag(
        'ai_success',
        'NONE',
        `Successfully completed ${stage} using ${currentModel}.`,
        currentModel
      );

      return textPart;
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        const classified = classifyGeminiError(new Error('TIMEOUT'));
        updateDiag('timeout', classified.code, classified.message, currentModel);
        throw new Error('GEMINI_TIMEOUT: Request to Gemini API timed out after 8 seconds.');
      }
      if (err.message && err.message.includes('404')) {
        // Continue to next candidate
        lastError = err;
        continue;
      }
      const classified = classifyGeminiError(err);
      updateDiag('failed', classified.code, classified.message, currentModel);
      throw err;
    }
  }

  // If all candidate models failed
  const finalClassified = classifyGeminiError(lastError);
  updateDiag('failed', finalClassified.code, finalClassified.message, targetModel);
  throw lastError || new Error('GEMINI_ALL_MODELS_UNAVAILABLE: All attempted Gemini models returned 404.');
}
