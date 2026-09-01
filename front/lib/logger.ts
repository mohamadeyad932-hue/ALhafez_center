/* eslint-disable no-console */
export const logger = {
  error: (...args: unknown[]) => {
    if (typeof window !== 'undefined') {
      console.error('[App Error]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (typeof window !== 'undefined') {
      console.warn('[App Warning]', ...args);
    }
  },
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      console.log('[App Log]', ...args);
    }
  }
};
