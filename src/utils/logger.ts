/**
 * CelebrAI — Enterprise Structured Logger
 * Safe logging abstraction that suppresses verbose output in production,
 * strips credentials/PII, and formats error diagnostics.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SENSITIVE_PATTERNS = [
  /AIza[0-9A-Za-z-_]{35}/g,
  /gsk_[0-9A-Za-z]{48,}/g,
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /"password":\s*"[^"]+"/gi,
  /"token":\s*"[^"]+"/gi,
];

function sanitizeLogMessage(msg: unknown): string {
  if (typeof msg !== 'string') {
    try {
      msg = JSON.stringify(msg);
    } catch {
      msg = String(msg);
    }
  }

  let cleaned = String(msg);
  for (const pattern of SENSITIVE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[REDACTED]');
  }
  return cleaned;
}

const isProduction = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
const isDev = !isProduction;

class Logger {
  debug(...args: unknown[]): void {
    if (isDev) {
      console.debug('[CelebrAI:debug]', ...args.map(sanitizeLogMessage));
    }
  }

  info(...args: unknown[]): void {
    if (isDev) {
      console.info('[CelebrAI:info]', ...args.map(sanitizeLogMessage));
    }
  }

  warn(...args: unknown[]): void {
    console.warn('[CelebrAI:warn]', ...args.map(sanitizeLogMessage));
  }

  error(...args: unknown[]): void {
    console.error('[CelebrAI:error]', ...args.map(sanitizeLogMessage));
  }
}

export const logger = new Logger();
