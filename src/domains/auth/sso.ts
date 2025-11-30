import { jwtVerify } from 'jose';
import { JWSSignatureVerificationFailed, JWTExpired, JWTInvalid } from 'jose/errors';
import { recordSsoMetric, type SsoMetricKey } from '../../../shared/ssoMetrics';
import { AuthUser } from './types';
import { coerceAuthRole, getDemoUser } from './demoUsers';

export type SsoErrorCode =
  | 'SSO_SECRET_MISSING'
  | 'SSO_INVALID_SIGNATURE'
  | 'SSO_EXPIRED'
  | 'SSO_MALFORMED'
  | 'SSO_UNKNOWN_AGENT';

export class SsoError extends Error {
  public readonly code: SsoErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(code: SsoErrorCode, message?: string, details?: Record<string, unknown>) {
    super(message ?? code);
    this.name = 'SsoError';
    this.code = code;
    this.details = details;
  }
}

export const isSsoError = (error: unknown): error is SsoError => error instanceof SsoError;

const metricMap: Record<SsoErrorCode, SsoMetricKey> = {
  SSO_INVALID_SIGNATURE: 'invalidSignature',
  SSO_EXPIRED: 'expired',
  SSO_MALFORMED: 'malformed',
  SSO_SECRET_MISSING: 'malformed',
  SSO_UNKNOWN_AGENT: 'unknownAgent',
};

const recordMetricForCode = (code: SsoErrorCode) => {
  const metricKey = metricMap[code];
  if (metricKey) {
    recordSsoMetric(metricKey);
  }
};

export const isSsoSecretConfigured = () => Boolean(import.meta.env.VITE_SSO_JWT_SECRET);

const encoder = new TextEncoder();
let cachedSecret: Uint8Array | null = null;

const getSsoSecret = () => {
  if (cachedSecret) return cachedSecret;
  const secretValue = import.meta.env.VITE_SSO_JWT_SECRET;
  if (!secretValue) {
    const error = new SsoError('SSO_SECRET_MISSING', 'SSO JWT secret is not configured. Set VITE_SSO_JWT_SECRET.');
    recordMetricForCode(error.code);
    throw error;
  }
  cachedSecret = encoder.encode(secretValue);
  return cachedSecret;
};

export const verifySsoToken = async (token: string): Promise<AuthUser> => {
  if (!token) {
    const error = new SsoError('SSO_MALFORMED', 'Token must be provided');
    recordMetricForCode(error.code);
    throw error;
  }

  try {
    const { payload } = await jwtVerify(token, getSsoSecret(), {
      algorithms: ['HS256'],
    });

    const subject = payload.sub;
    if (!subject || typeof subject !== 'string') {
      const error = new SsoError('SSO_MALFORMED', 'Missing subject in SSO token');
      recordMetricForCode(error.code);
      throw error;
    }

    const knownUser = getDemoUser(subject);
    if (!knownUser) {
      const error = new SsoError('SSO_UNKNOWN_AGENT', 'Unknown agent for SSO token', { subject });
      recordMetricForCode(error.code);
      throw error;
    }

    const name = typeof payload.name === 'string' ? payload.name : knownUser.name;
    const role = coerceAuthRole(payload.role ?? knownUser.role);

    return {
      id: knownUser.id,
      role,
      name,
    };
  } catch (error) {
    if (error instanceof SsoError) {
      recordMetricForCode(error.code);
      throw error;
    }
    if (error instanceof JWTExpired) {
      const mapped = new SsoError('SSO_EXPIRED', 'SSO token expired');
      recordMetricForCode(mapped.code);
      throw mapped;
    }
    if (error instanceof JWSSignatureVerificationFailed) {
      const mapped = new SsoError('SSO_INVALID_SIGNATURE', 'SSO token signature invalid');
      recordMetricForCode(mapped.code);
      throw mapped;
    }
    if (error instanceof JWTInvalid) {
      const mapped = new SsoError('SSO_MALFORMED', 'SSO token invalid');
      recordMetricForCode(mapped.code);
      throw mapped;
    }

    const fallbackError = new SsoError('SSO_MALFORMED', 'Failed to verify SSO token', {
      reason: error instanceof Error ? error.message : String(error),
    });
    recordMetricForCode(fallbackError.code);
    throw fallbackError;
  }
};
