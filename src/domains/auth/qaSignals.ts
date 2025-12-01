/**
 * QA Signal Logging Utility (Client-side)
 *
 * Provides non-invasive logging for QA monitoring.
 * Signals are only emitted when window.__QA_MODE__ is set or localStorage contains 'qa_mode'.
 *
 * Usage:
 *   import { qaSignal } from './qaSignals';
 *   qaSignal('verify:start', { token: '...' });
 *   qaSignal('cookie:valid', { userId: '...' });
 */

// Check QA mode at runtime (client-side)
const isQaModeClient = (): boolean => {
  // Check window flag (can be set by dev tools)
  if (
    typeof window !== 'undefined' &&
    (window as unknown as Record<string, unknown>).__QA_MODE__
  ) {
    return true;
  }

  // Check localStorage flag
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('qa_mode') === '1';
  }

  return false;
};

export type QaSignalType =
  // SSO Verification signals
  | 'verify:start'
  | 'verify:end'
  | 'verify:success'
  | 'verify:failed'
  // Cookie signals
  | 'cookie:valid'
  | 'cookie:invalid'
  | 'cookie:missing'
  | 'cookie:expired'
  | 'cookie:cleared'
  // Session signals
  | 'session:created'
  | 'session:restored'
  | 'session:destroyed'
  // Login flow signals
  | 'sso-login:start'
  | 'sso-login:redirect'
  | 'sso-login:error'
  // Auth signals
  | 'auth:login'
  | 'auth:logout'
  | 'auth:denied';

export interface QaSignalData {
  timestamp: string;
  signal: QaSignalType;
  details?: Record<string, unknown>;
}

/**
 * Emit a QA signal log.
 *
 * Only logs when QA mode is enabled (localStorage.qa_mode = '1' or window.__QA_MODE__ = true).
 *
 * @param signal - The signal type
 * @param details - Optional details object
 */
export const qaSignal = (signal: QaSignalType, details?: Record<string, unknown>): void => {
  if (!isQaModeClient()) {
    return;
  }

  const data: QaSignalData = {
    timestamp: new Date().toISOString(),
    signal,
    details,
  };

  console.info(`[qa-signal] ${signal}`, data);
};

/**
 * Enable QA mode from browser console.
 * Run: enableQaMode() in the console.
 */
export const enableQaMode = (): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('qa_mode', '1');
    console.info('[qa-signal] QA mode enabled. Refresh to see all signals.');
  }
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__QA_MODE__ = true;
  }
};

/**
 * Disable QA mode.
 */
export const disableQaMode = (): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('qa_mode');
  }
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__QA_MODE__ = false;
  }
  console.info('[qa-signal] QA mode disabled.');
};

// Expose functions globally for console access
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).enableQaMode = enableQaMode;
  (window as unknown as Record<string, unknown>).disableQaMode = disableQaMode;
}
