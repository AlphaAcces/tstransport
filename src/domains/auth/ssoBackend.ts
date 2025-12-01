/**
 * SSO Backend Integration
 *
 * Client-side service for verifying SSO tokens via the backend /api/auth/verify endpoint.
 * This replaces client-side JWT verification with server-side validation for enhanced security.
 */

import type { AuthUser, AuthRole } from './types';
import { qaSignal } from './qaSignals';

// Error codes returned by the backend /api/auth/verify endpoint
export type BackendSsoErrorCode =
  | 'TOKEN_MISSING'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_ISSUER_MISMATCH'
  | 'TOKEN_AUDIENCE_MISMATCH'
  | 'TOKEN_UNKNOWN_AGENT'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export class BackendSsoError extends Error {
  public readonly code: BackendSsoErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: BackendSsoErrorCode, message?: string, details?: Record<string, unknown>) {
    super(message ?? code);
    this.name = 'BackendSsoError';
    this.code = code;
    this.details = details;
  }
}

export const isBackendSsoError = (error: unknown): error is BackendSsoError =>
  error instanceof BackendSsoError;

/**
 * Backend SSO verification response (success)
 */
interface BackendVerifySuccessResponse {
  status: 'ok';
  ts: number;
  ts24_user_id: string;
  role: 'admin' | 'user';
  tenant: string;
}

/**
 * Backend SSO verification response (error)
 */
interface BackendVerifyErrorResponse {
  status: 'error';
  error: BackendSsoErrorCode;
}

type BackendVerifyResponse = BackendVerifySuccessResponse | BackendVerifyErrorResponse;

/**
 * SSO session data decoded from ts24_sso_session cookie
 */
export interface SsoSessionData {
  userId: string;
  role: AuthRole;
  name: string;
  tenant: string;
  ssoAuth: boolean;
  authTime: number;
}

/**
 * User-friendly error messages for each error code
 */
export const SSO_ERROR_MESSAGES: Record<BackendSsoErrorCode, string> = {
  TOKEN_MISSING: 'No authentication token provided',
  TOKEN_INVALID: 'Invalid session - please sign in again',
  TOKEN_EXPIRED: 'Session expired - please sign in again',
  TOKEN_ISSUER_MISMATCH: 'Authentication source mismatch',
  TOKEN_AUDIENCE_MISMATCH: 'Authentication target mismatch',
  TOKEN_UNKNOWN_AGENT: 'Access denied - unknown user',
  NETWORK_ERROR: 'Network error - please check your connection',
  UNKNOWN_ERROR: 'An unexpected error occurred',
};

/**
 * Verify an SSO token via the backend /api/auth/verify endpoint.
 *
 * @param token - The JWT token to verify
 * @returns The authenticated user
 * @throws BackendSsoError if verification fails
 */
export const verifySsoTokenViaBackend = async (token: string): Promise<AuthUser> => {
  qaSignal('verify:start', { tokenLength: token?.length ?? 0 });

  if (!token || typeof token !== 'string' || token.trim() === '') {
    qaSignal('verify:failed', { reason: 'TOKEN_MISSING' });
    throw new BackendSsoError('TOKEN_MISSING', SSO_ERROR_MESSAGES.TOKEN_MISSING);
  }

  try {
    const response = await fetch('/api/auth/verify', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data: BackendVerifyResponse = await response.json();

    if (data.status === 'ok') {
      qaSignal('verify:success', { userId: data.ts24_user_id, role: data.role });
      return {
        id: data.ts24_user_id,
        role: data.role,
        name: data.ts24_user_id, // Name not returned from verify, will be populated from session cookie
      };
    }

    // Error response
    const errorCode = data.error as BackendSsoErrorCode;
    throw new BackendSsoError(
      errorCode,
      SSO_ERROR_MESSAGES[errorCode] ?? SSO_ERROR_MESSAGES.UNKNOWN_ERROR
    );
  } catch (error) {
    if (error instanceof BackendSsoError) {
      throw error;
    }

    // Network or parsing error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new BackendSsoError('NETWORK_ERROR', SSO_ERROR_MESSAGES.NETWORK_ERROR);
    }

    throw new BackendSsoError(
      'UNKNOWN_ERROR',
      SSO_ERROR_MESSAGES.UNKNOWN_ERROR,
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
};

/**
 * Decode the ts24_sso_session cookie value.
 * The cookie contains a base64url-encoded JSON payload.
 *
 * @param cookieValue - The raw cookie value (base64url encoded)
 * @returns The decoded session data or null if invalid
 */
export const decodeSsoSessionCookie = (cookieValue: string): SsoSessionData | null => {
  if (!cookieValue) {
    return null;
  }

  try {
    // Base64url decode (handles URL-safe characters)
    const base64 = cookieValue.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(base64 + padding);
    const data = JSON.parse(decoded);

    // Validate required fields
    if (
      typeof data.userId !== 'string' ||
      typeof data.role !== 'string' ||
      typeof data.name !== 'string' ||
      typeof data.tenant !== 'string' ||
      typeof data.ssoAuth !== 'boolean' ||
      typeof data.authTime !== 'number'
    ) {
      qaSignal('cookie:invalid', { reason: 'invalid_structure' });
      console.warn('[sso] Invalid session cookie structure');
      return null;
    }

    qaSignal('cookie:valid', { userId: data.userId, role: data.role });

    return {
      userId: data.userId,
      role: data.role as AuthRole,
      name: data.name,
      tenant: data.tenant,
      ssoAuth: data.ssoAuth,
      authTime: data.authTime,
    };
  } catch (error) {
    console.error('[sso] Failed to decode session cookie:', error);
    return null;
  }
};

/**
 * Get the ts24_sso_session cookie value from document.cookie
 *
 * @returns The cookie value or null if not found
 */
export const getSsoSessionCookieValue = (): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'ts24_sso_session' && value) {
      return value;
    }
  }
  return null;
};

/**
 * Get and decode the SSO session from the ts24_sso_session cookie.
 *
 * @returns The decoded session data or null if not present/invalid
 */
export const getSsoSession = (): SsoSessionData | null => {
  const cookieValue = getSsoSessionCookieValue();
  if (!cookieValue) {
    qaSignal('cookie:missing', {});
    return null;
  }
  return decodeSsoSessionCookie(cookieValue);
};

/**
 * Clear the SSO session cookie.
 * Sets the cookie with an expired date to remove it.
 */
export const clearSsoSessionCookie = (): void => {
  if (typeof document !== 'undefined') {
    qaSignal('cookie:cleared', {});
    document.cookie = 'ts24_sso_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
};

/**
 * Check if an SSO session cookie exists and is not expired.
 *
 * @param maxAgeMs - Maximum age in milliseconds (default: 8 hours)
 * @returns true if a valid session cookie exists
 */
export const hasValidSsoSession = (maxAgeMs: number = 8 * 60 * 60 * 1000): boolean => {
  const session = getSsoSession();
  if (!session) {
    return false;
  }

  const now = Date.now();
  const sessionAge = now - session.authTime;
  return sessionAge < maxAgeMs;
};

/**
 * Build an AuthUser from SSO session data.
 *
 * @param session - The decoded SSO session
 * @returns An AuthUser object
 */
export const buildAuthUserFromSession = (session: SsoSessionData): AuthUser => ({
  id: session.userId,
  role: session.role,
  name: session.name,
});
