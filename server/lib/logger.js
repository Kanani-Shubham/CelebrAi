// @ts-check
/**
 * CelebrAI Server Logger
 * Structured, secret-redacting logging utility for Node/Netlify serverless runtime.
 */

function sanitizeLogMessage(val) {
  if (typeof val !== 'string') {
    try {
      val = JSON.stringify(val);
    } catch {
      val = String(val);
    }
  }
  return val
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/gsk_[A-Za-z0-9]+/g, 'gsk_[REDACTED]')
    .replace(/AIza[0-9A-Za-z-_]{35}/g, 'AIza[REDACTED]');
}

export const logger = {
  info(...args) {
    if (process.env.NODE_ENV !== 'test') {
      const sanitized = args.map(sanitizeLogMessage);
      process.stdout.write(`[INFO] ${new Date().toISOString()} ${sanitized.join(' ')}\n`);
    }
  },
  warn(...args) {
    if (process.env.NODE_ENV !== 'test') {
      const sanitized = args.map(sanitizeLogMessage);
      process.stderr.write(`[WARN] ${new Date().toISOString()} ${sanitized.join(' ')}\n`);
    }
  },
  error(...args) {
    if (process.env.NODE_ENV !== 'test') {
      const sanitized = args.map(sanitizeLogMessage);
      process.stderr.write(`[ERROR] ${new Date().toISOString()} ${sanitized.join(' ')}\n`);
    }
  },
  debug(...args) {
    if (process.env.DEBUG) {
      const sanitized = args.map(sanitizeLogMessage);
      process.stdout.write(`[DEBUG] ${new Date().toISOString()} ${sanitized.join(' ')}\n`);
    }
  },
};
