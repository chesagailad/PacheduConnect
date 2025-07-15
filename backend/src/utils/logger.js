const logger = {
  info: (message, ...args) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message, ...args) => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message, ...args) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  debug: (message, ...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
};

module.exports = { logger }; 