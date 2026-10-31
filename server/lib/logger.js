// @ts-check
/**
 * CelebrAI Server Logger
 * Structured, secret-redacting logging utility for Node/Netlify serverless runtime.
 */

/**
 * @param {any} val
 * @returns {string}
 */
function sanitizeLogMessage(val) {
  let str;
  if (typeof val !== 'string') {
    try {
      str = JSON.stringify(val);
    } catch {
      str = String(val);
    }
  } else {
    str = val;
  }
  return str
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/gsk_[A-Za-z0-9]+/g, 'gsk_[REDACTED]')
    .replace(/AIza[0-9A-Za-z-_]{35}/g, 'AIza[REDACTED]');
}

export const logger = {
  /** @param {...any} args */
  info(...args) {
    if (process.env.NODE_ENV !== 'test') {
      const sanitized = args.map(sanitizeLogMessage);
      process.stdout.write(`[INFO] ${new Date().toISOString()} ${sanitized.join(' ')}\n`);
    }
  },
  /** @param {...any} args */
  warn(...args) {
    if (process.env.NODE_ENV !== 'test') {
      const sanitized = args.map(sanitizeLogMessage);
      process.stderr.write(`[WARN] ${new Date().toISOString()} ${sanitized.join(' ')}\n`);
    }
  },
  /** @param {...any} args */
  error(...args) {
    if (process.env.NODE_ENV !== 'test') {
      const sanitized = args.map(sanitizeLogMessage);
      process.stderr.write(`[ERROR] ${new Date().toISOString()} ${sanitized.join(' ')}\n`);
    }
  },
  /** @param {...any} args */
  debug(...args) {
    if (process.env.DEBUG) {
      const sanitized = args.map(sanitizeLogMessage);
      process.stdout.write(`[DEBUG] ${new Date().toISOString()} ${sanitized.join(' ')}\n`);
    }
  },
};

