'use strict';

/**
 * Lightweight structured logger.
 * Swap the console calls for winston/pino if needed later.
 */
const logger = {
  info(tag, msg, data = {}) {
    console.log(`[${tag}]`, msg, Object.keys(data).length ? data : '');
  },

  warn(tag, msg, data = {}) {
    console.warn(`[${tag}] WARN:`, msg, Object.keys(data).length ? data : '');
  },

  error(tag, msg, err, data = {}) {
    console.error(`[${tag}] ERROR: ${msg}`, {
      error: err?.message,
      stack: err?.stack,
      ...data,
    });
  },
};

module.exports = logger;
