// @ts-check
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } from './config.js';

const rateLimitMap = new Map();

/**
 * Checks and increments rate limit counter for an IP.
 * @param {string} ip 
 * @returns {{ allowed: boolean, remaining: number, resetMs: number }}
 */
export function checkRateLimit(ip = 'unknown') {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, startTime: now };

  // Reset window if expired
  if (now - record.startTime > RATE_LIMIT_WINDOW_MS) {
    record.count = 0;
    record.startTime = now;
  }

  record.count += 1;
  rateLimitMap.set(ip, record);

  // Clean old entries periodically
  if (rateLimitMap.size > 2000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now - val.startTime > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }

  const remaining = Math.max(0, RATE_LIMIT_MAX - record.count);
  const resetMs = Math.max(0, RATE_LIMIT_WINDOW_MS - (now - record.startTime));

  return {
    allowed: record.count <= RATE_LIMIT_MAX,
    remaining,
    resetMs,
  };
}

