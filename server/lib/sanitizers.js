// @ts-check
/**
 * CelebrAI — Server Input & Output Sanitizers
 * Cleans user prompt input, enforces bounds, and strips markdown code fences for JSON parsing.
 */

export const DECLINE_CODE_MESSAGE =
  "I'm CelebrAI, your event-planning assistant. I specialize in helping with celebrations, budgets, guests, vendors, and event management. I can't generate general-purpose programming code in this assistant.";

/**
 * Sanitizes user-provided string inputs.
 * Strips HTML tags and enforces max length.
 * @param {unknown} str
 * @param {number} [maxLen=2000]
 * @returns {string}
 */
export function sanitize(str, maxLen = 2000) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').slice(0, maxLen).trim();
}

/**
 * Sanitizes numeric input within bounds.
 * @param {unknown} n
 * @param {number} [min=0]
 * @param {number} [max=100000000]
 * @param {number} [fallback=0]
 * @returns {number}
 */
export function sanitizeNumber(n, min = 0, max = 100_000_000, fallback = 0) {
  const num = Number(n);
  if (isNaN(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

/**
 * Strips markdown code fences (```json ... ```) from model output.
 * @param {string} text
 * @returns {string}
 */
export function stripCodeFences(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

/**
 * Finds and parses the outermost JSON object in raw model output.
 * @param {string} rawText
 * @returns {Record<string, unknown>}
 */
export function extractJson(rawText) {
  let cleaned = stripCodeFences(rawText);
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

/**
 * Determines whether a prompt is asking for out-of-scope general programming code.
 * @param {string} text
 * @returns {boolean}
 */
export function isGeneralProgrammingRequest(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  const codePatterns = [
    /\b(write|create|generate|give me|show me)\s+(a\s+)?(python|javascript|typescript|c\+\+|java|rust|go|php|ruby|swift|kotlin|c#|sql)\s+(script|code|function|program|algorithm|class)\b/i,
    /\b(html|css)\s+(code|script)\s+for\s+(a\s+)?(lamp|button|navbar|slider|form|page|animation|modal|table|header|footer)\b/i,
    /\bwrite\s+(the\s+)?(code|script)\s+for\s+(a\s+)?(lamp|calculator|snake game|todo app|weather app)\b/i,
    /\b(leetcode|hackerrank|codeforces|binary search tree|linked list|sorting algorithm|dijkstra|fibonacci)\b/i,
    /\b(create|write)\s+(an?\s+)?api\s+(endpoint|route)\s+(in|using)\s+(express|node|flask|fastapi|django)\b/i,
  ];
  return codePatterns.some(pattern => pattern.test(lower));
}
