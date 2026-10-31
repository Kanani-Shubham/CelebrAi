// @ts-check
/**
 * CelebrAI — Groq AI API Client
 * Enterprise-grade Groq inference wrapper with automatic fallback handling,
 * reasoning model parameter tuning (max_completion_tokens, reasoning_effort),
 * and zero secret leakage.
 */

import { PRIMARY_MODEL, FALLBACK_MODEL, LEGACY_FALLBACK_MODEL, GROQ_BASE_URL } from './config.js';

/**
 * Calls Groq chat completion API with a specified model.
 * Handles both reasoning models (gpt-oss) and legacy completion models.
 * @param {string} apiKey
 * @param {string} model
 * @param {Array<{role: string, content: string}>} messages
 * @param {number} temperature
 * @param {number} maxTokens
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ content: string, model: string }>}
 */
export async function callGroqWithModel(apiKey, model, messages, temperature, maxTokens, signal) {
  const isReasoning = model.includes('gpt-oss') || model.includes('o1') || model.includes('o3');

  const payload = {
    model,
    messages,
    ...(isReasoning
      ? { max_completion_tokens: maxTokens, reasoning_effort: 'low' }
      : { temperature, max_tokens: maxTokens }),
  };

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    let errJson;
    try {
      errJson = JSON.parse(errText);
    } catch {
      errJson = null;
    }
    const msg = errJson?.error?.message || errText || `HTTP ${response.status}`;
    const err = new Error(`Groq API (${model}): ${msg}`);
    /** @type {any} */ (err).status = response.status;
    throw err;
  }

  const data = await response.json();
  const choice = data.choices?.[0]?.message;
  return {
    content: choice?.content ?? '',
    model: data.model || model,
  };
}

/**
 * Resilient Groq completion caller with automatic multi-tiered fallback.
 * @param {string} apiKey
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} [options]
 * @param {number} [options.temperature=0.7]
 * @param {number} [options.maxTokens=1024]
 * @param {string} [options.model]
 * @param {number} [options.timeoutMs=30000]
 * @returns {Promise<{ content: string, model: string }>}
 */
export async function callGroq(apiKey, messages, options = {}) {
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured on the server. Add it to your environment.');
  }

  const {
    temperature = 0.7,
    maxTokens = 1024,
    model = PRIMARY_MODEL,
    timeoutMs = 30000,
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    try {
      const result = await callGroqWithModel(apiKey, model, messages, temperature, maxTokens, controller.signal);
      clearTimeout(timer);
      return result;
    } catch (err) {
      const status = /** @type {any} */ (err).status;
      // Fallback on 400 (model bad request) or 404 (model not found) or 401
      if (status === 400 || status === 404) {
        console.warn(`[callGroq] Primary model "${model}" failed (${status}), trying fallback "${FALLBACK_MODEL}"`);
        try {
          const fallbackRes = await callGroqWithModel(apiKey, FALLBACK_MODEL, messages, temperature, maxTokens, controller.signal);
          clearTimeout(timer);
          return fallbackRes;
        } catch {
          console.warn(`[callGroq] Secondary fallback "${FALLBACK_MODEL}" failed, trying "${LEGACY_FALLBACK_MODEL}"`);
          const legacyRes = await callGroqWithModel(apiKey, LEGACY_FALLBACK_MODEL, messages, temperature, maxTokens, controller.signal);
          clearTimeout(timer);
          return legacyRes;
        }
      }
      throw err;
    }
  } catch (err) {
    clearTimeout(timer);
    if (/** @type {Error} */ (err).name === 'AbortError') {
      throw new Error('Groq request timed out after 30 seconds.');
    }
    throw err;
  }
}
