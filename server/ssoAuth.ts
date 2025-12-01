/**
 * Server-side SSO Token Verification
 *
 * This module provides HS256 JWT verification for the TS24 backend SSO bridge.
 * It mirrors the client-side verification in src/domains/auth/sso.ts but runs
 * on the server for secure session establishment.
 */

import { jwtVerify, errors as joseErrors } from 'jose';
import { recordSsoMetric, type SsoMetricKey } from '../shared/ssoMetrics';

// SSO Configuration Constants (must match ALPHA-GUI)
export const SSO_EXPECTED_ISS = 'ts24-intel';
export const SSO_EXPECTED_AUD = 'ts24-intel';
export const SSO_ALGORITHM = 'HS256';

export type SsoErrorCode =
  | 'TOKEN_MISSING'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_ISSUER_MISMATCH'
  | 'TOKEN_AUDIENCE_MISMATCH'
  | 'TOKEN_SECRET_MISSING'
  | 'TOKEN_UNKNOWN_AGENT';

export class ServerSsoError extends Error {
  public readonly code: SsoErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: SsoErrorCode, message?: string, details?: Record<string, unknown>) {
    super(message ?? code);
    this.name = 'ServerSsoError';
    this.code = code;
    this.details = details;
  }
}

const metricMap: Record<SsoErrorCode, SsoMetricKey | null> = {
  TOKEN_MISSING: 'malformed',
  TOKEN_INVALID: 'invalidSignature',
  TOKEN_EXPIRED: 'expired',
  TOKEN_ISSUER_MISMATCH: 'malformed',
  TOKEN_AUDIENCE_MISMATCH: 'malformed',
  TOKEN_SECRET_MISSING: 'malformed',
  TOKEN_UNKNOWN_AGENT: 'unknownAgent',
};

const recordMetricForCode = (code: SsoErrorCode) => {
  const metricKey = metricMap[code];
  if (metricKey) {
    recordSsoMetric(metricKey);
  }
};

const encoder = new TextEncoder();
let cachedSecret: Uint8Array | null = null;

/**
 * Get the SSO shared secret from environment variables.
 * Server-side uses SSO_JWT_SECRET (not VITE_ prefixed).
 */
const getSsoSecret = (): Uint8Array => {
  if (cachedSecret) return cachedSecret;

  // Server-side: use SSO_JWT_SECRET (or fall back to VITE_ for dev compatibility)
  const secretValue = process.env.SSO_JWT_SECRET || process.env.VITE_SSO_JWT_SECRET;
  if (!secretValue) {
    throw new ServerSsoError(
      'TOKEN_SECRET_MISSING',
      'SSO JWT secret is not configured. Set SSO_JWT_SECRET environment variable.'
    );
  }
  cachedSecret = encoder.encode(secretValue);
  return cachedSecret;
};

/**
 * Clear cached secret (useful for testing)
 */
export const clearSecretCache = () => {
  cachedSecret = null;
};

export interface SsoTokenPayload {
  sub: string;
  name?: string;
  role?: string;
  tenant?: string;
  iss?: string;
  aud?: string;
  exp?: number;
  iat?: number;
}

export interface VerifiedSsoUser {
  userId: string;
  name: string;
  role: 'admin' | 'user';
  tenant: string;
}

// Known demo users (mirrors src/domains/auth/demoUsers.ts)
const KNOWN_USERS: Record<string, { displayName: string; role: 'admin' | 'user' }> = {
  AlphaGrey: { displayName: 'Alpha Grey', role: 'admin' },
  'cetin.umit.TS': { displayName: 'Cetin Ümit', role: 'user' },
};

/**
 * Verify an SSO JWT token server-side.
 *
 * Validates:
 * - HS256 signature with shared secret
 * - Issuer claim (iss)
 * - Audience claim (aud)
 * - Expiration (exp)
 * - Issued-at not in future (iat)
 * - Subject exists in known users
 *
 * @param token - The JWT token string
 * @returns Verified user payload
 * @throws ServerSsoError with specific error codes
 */
export const verifySsoTokenServerSide = async (token: string): Promise<VerifiedSsoUser> => {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    const error = new ServerSsoError('TOKEN_MISSING', 'SSO token must be provided');
    recordMetricForCode(error.code);
    throw error;
  }

  let secret: Uint8Array;
  try {
    secret = getSsoSecret();
  } catch (err) {
    if (err instanceof ServerSsoError) {
      recordMetricForCode(err.code);
      throw err;
    }
    throw err;
  }

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [SSO_ALGORITHM],
      issuer: SSO_EXPECTED_ISS,
      audience: SSO_EXPECTED_AUD,
    });

    const typedPayload = payload as SsoTokenPayload;

    // Validate subject exists
    const subject = typedPayload.sub;
    if (!subject || typeof subject !== 'string') {
      const error = new ServerSsoError('TOKEN_INVALID', 'Missing or invalid subject claim in token');
      recordMetricForCode(error.code);
      throw error;
    }

    // Validate iat is not in the future (clock skew tolerance: 60 seconds)
    const now = Math.floor(Date.now() / 1000);
    if (typedPayload.iat && typedPayload.iat > now + 60) {
      const error = new ServerSsoError('TOKEN_INVALID', 'Token issued-at time is in the future', {
        iat: typedPayload.iat,
        serverTime: now,
      });
      recordMetricForCode(error.code);
      throw error;
    }

    // Check if user is known
    const knownUser = KNOWN_USERS[subject];
    if (!knownUser) {
      const error = new ServerSsoError('TOKEN_UNKNOWN_AGENT', 'Unknown agent identifier in token', { subject });
      recordMetricForCode(error.code);
      throw error;
    }

    // Build verified user
    const name = typeof typedPayload.name === 'string' ? typedPayload.name : knownUser.displayName;
    const role = typedPayload.role === 'admin' ? 'admin' : knownUser.role;
    const tenant = typeof typedPayload.tenant === 'string' ? typedPayload.tenant : 'default';

    return {
      userId: subject,
      name,
      role,
      tenant,
    };
  } catch (error) {
    // Re-throw our own errors
    if (error instanceof ServerSsoError) {
      throw error;
    }

    // Map jose errors to our error codes
    if (error instanceof joseErrors.JWTExpired) {
      const mapped = new ServerSsoError('TOKEN_EXPIRED', 'SSO token has expired');
      recordMetricForCode(mapped.code);
      throw mapped;
    }

    if (error instanceof joseErrors.JWSSignatureVerificationFailed) {
      const mapped = new ServerSsoError('TOKEN_INVALID', 'SSO token signature verification failed');
      recordMetricForCode(mapped.code);
      throw mapped;
    }

    if (error instanceof joseErrors.JWTClaimValidationFailed) {
      const jwtError = error as joseErrors.JWTClaimValidationFailed;
      if (jwtError.claim === 'iss') {
        const mapped = new ServerSsoError('TOKEN_ISSUER_MISMATCH', 'SSO token issuer does not match expected value');
        recordMetricForCode(mapped.code);
        throw mapped;
      }
      if (jwtError.claim === 'aud') {
        const mapped = new ServerSsoError('TOKEN_AUDIENCE_MISMATCH', 'SSO token audience does not match expected value');
        recordMetricForCode(mapped.code);
        throw mapped;
      }
      // Generic claim validation failure
      const mapped = new ServerSsoError('TOKEN_INVALID', `Token claim validation failed: ${jwtError.claim}`);
      recordMetricForCode(mapped.code);
      throw mapped;
    }

    if (error instanceof joseErrors.JWTInvalid) {
      const mapped = new ServerSsoError('TOKEN_INVALID', 'SSO token is malformed or invalid');
      recordMetricForCode(mapped.code);
      throw mapped;
    }

    // Fallback for unknown errors
    const fallbackError = new ServerSsoError('TOKEN_INVALID', 'Failed to verify SSO token', {
      reason: error instanceof Error ? error.message : String(error),
    });
    recordMetricForCode(fallbackError.code);
    throw fallbackError;
  }
};

/**
 * Check if the SSO secret is configured
 */
export const isSsoSecretConfigured = (): boolean => {
  return Boolean(process.env.SSO_JWT_SECRET || process.env.VITE_SSO_JWT_SECRET);
};
