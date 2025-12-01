/**
 * QA Signal Logging Utility
 *
 * Provides non-invasive logging for QA monitoring.
 * Signals are only emitted when QA_MODE=1 environment flag is set.
 *
 * Usage:
 *   import { qaSignal } from './qaSignals';
 *   qaSignal('verify:start', { token: '...' });
 *   qaSignal('cookie:valid', { userId: '...' });
 */

// Check QA mode at module load time (server-side)
const isQaModeServer = (): boolean => {
  return process.env.QA_MODE === '1';
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
 * Only logs when QA_MODE=1 environment flag is set.
 *
 * @param signal - The signal type
 * @param details - Optional details object
 */
export const qaSignal = (signal: QaSignalType, details?: Record<string, unknown>): void => {
  if (!isQaModeServer()) {
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
 * Create a scoped QA signal logger for a specific domain.
 *
 * @param domain - The domain prefix (e.g., 'sso', 'auth')
 * @returns A scoped signal function
 */
export const createQaSignalScope = (domain: string) => {
  return (signal: string, details?: Record<string, unknown>): void => {
    if (!isQaModeServer()) {
      return;
    }

    const data = {
      timestamp: new Date().toISOString(),
      domain,
      signal,
      details,
    };

    console.info(`[qa-signal] ${domain}:${signal}`, data);
  };
};

/**
 * Measure and log execution time for a function.
 *
 * @param name - Name of the operation
 * @param fn - Async function to measure
 * @returns The function result
 */
export const qaTimedOperation = async <T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> => {
  if (!isQaModeServer()) {
    return fn();
  }

  const start = Date.now();
  qaSignal('verify:start' as QaSignalType, { operation: name });

  try {
    const result = await fn();
    const duration = Date.now() - start;
    qaSignal('verify:end' as QaSignalType, { operation: name, duration, success: true });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    qaSignal('verify:end' as QaSignalType, {
      operation: name,
      duration,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
