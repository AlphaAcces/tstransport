/**
 * @vitest-environment node
 *
 * SSO Auth API Tests
 * Tests for server-side JWT verification endpoint /api/auth/verify
 * and /sso-login redirect flow with session cookie creation.
 */
import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import * as jose from 'jose';

import app from '../app';
import { clearSecretCache, SSO_EXPECTED_ISS, SSO_EXPECTED_AUD } from '../ssoAuth';

const TEST_SECRET = 'test-shared-secret-for-sso-verification';

/**
 * Helper to mint a test JWT token using jose library
 */
async function mintTestToken(options: {
  sub?: string;
  name?: string;
  role?: string;
  tenant?: string;
  iss?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  secret?: string;
}): Promise<string> {
  const secretString = options.secret ?? TEST_SECRET;
  const encoder = new TextEncoder();
  const secret = encoder.encode(secretString);
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    sub: options.sub ?? 'AlphaGrey',
    name: options.name ?? 'Alpha Grey',
    role: options.role ?? 'admin',
    tenant: options.tenant ?? 'default',
  };

  let jwt = new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(options.iat ?? now);

  // Set issuer
  if (options.iss !== undefined) {
    jwt = jwt.setIssuer(options.iss);
  } else {
    jwt = jwt.setIssuer(SSO_EXPECTED_ISS);
  }

  // Set audience
  if (options.aud !== undefined) {
    jwt = jwt.setAudience(options.aud);
  } else {
    jwt = jwt.setAudience(SSO_EXPECTED_AUD);
  }

  // Set expiration
  if (options.exp !== undefined) {
    jwt = jwt.setExpirationTime(options.exp);
  } else {
    jwt = jwt.setExpirationTime(now + 3600); // 1 hour from now
  }

  return jwt.sign(secret);
}

describe('SSO Auth API', () => {
  beforeAll(() => {
    // Set the SSO secret for tests
    process.env.SSO_JWT_SECRET = TEST_SECRET;
  });

  afterAll(() => {
    delete process.env.SSO_JWT_SECRET;
  });

  beforeEach(() => {
    // Clear cached secret before each test to ensure fresh reads
    clearSecretCache();
  });

  describe('GET /api/auth/verify', () => {
    it('returns 400 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/auth/verify');

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        error: 'TOKEN_MISSING',
      });
    });

    it('returns 400 when Authorization header has no Bearer prefix', async () => {
      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'some-token-without-bearer');

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        error: 'TOKEN_MISSING',
      });
    });

    it('returns 400 when Bearer token is empty', async () => {
      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer ');

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        status: 'error',
        error: 'TOKEN_MISSING',
      });
    });

    it('returns 200 with user payload for valid token', async () => {
      const token = await mintTestToken({
        sub: 'AlphaGrey',
        name: 'Alpha Grey',
        role: 'admin',
        tenant: 'test-tenant',
      });

      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'ok',
        ts24_user_id: 'AlphaGrey',
        role: 'admin',
        tenant: 'test-tenant',
      });
      expect(typeof res.body.ts).toBe('number');
    });

    it('returns 401 with TOKEN_EXPIRED for expired token', async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = await mintTestToken({
        sub: 'AlphaGrey',
        exp: now - 3600, // Expired 1 hour ago
        iat: now - 7200, // Issued 2 hours ago
      });

      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        error: 'TOKEN_EXPIRED',
      });
    });

    it('returns 401 with TOKEN_INVALID for wrong signature (wrong secret)', async () => {
      const token = await mintTestToken({
        sub: 'AlphaGrey',
        secret: 'wrong-secret-key',
      });

      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        error: 'TOKEN_INVALID',
      });
    });

    it('returns 401 with TOKEN_ISSUER_MISMATCH for wrong issuer', async () => {
      const token = await mintTestToken({
        sub: 'AlphaGrey',
        iss: 'wrong-issuer',
      });

      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        error: 'TOKEN_ISSUER_MISMATCH',
      });
    });

    it('returns 401 with TOKEN_AUDIENCE_MISMATCH for wrong audience', async () => {
      const token = await mintTestToken({
        sub: 'AlphaGrey',
        aud: 'wrong-audience',
      });

      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        error: 'TOKEN_AUDIENCE_MISMATCH',
      });
    });

    it('returns 401 with TOKEN_INVALID for malformed token', async () => {
      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer not.a.valid.jwt');

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        error: 'TOKEN_INVALID',
      });
    });

    it('returns 401 with TOKEN_UNKNOWN_AGENT for unknown user subject', async () => {
      const token = await mintTestToken({
        sub: 'unknown-user-not-in-system',
      });

      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({
        status: 'error',
        error: 'TOKEN_UNKNOWN_AGENT',
      });
    });

    it('correctly identifies user role from token', async () => {
      const token = await mintTestToken({
        sub: 'cetin.umit.TS',
        name: 'Cetin Ümit',
        role: 'user',
      });

      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: 'ok',
        ts24_user_id: 'cetin.umit.TS',
        role: 'user',
      });
    });
  });

  describe('GET /sso-login', () => {
    it('redirects to /login?ssoFailed=true when no token provided', async () => {
      const res = await request(app).get('/sso-login');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login?ssoFailed=true');
    });

    it('redirects to / with session cookie for valid token', async () => {
      const token = await mintTestToken({
        sub: 'AlphaGrey',
        name: 'Alpha Grey',
        role: 'admin',
      });

      const res = await request(app).get(`/sso-login?sso=${token}`);

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/');

      // Check that a session cookie was set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies) ? cookies.some(c => c.includes('ts24_sso_session=')) : cookies.includes('ts24_sso_session=')).toBe(true);
    });

    it('redirects to /login?ssoFailed=true for invalid token', async () => {
      const token = await mintTestToken({
        sub: 'AlphaGrey',
        secret: 'wrong-secret',
      });

      const res = await request(app).get(`/sso-login?sso=${token}`);

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login?ssoFailed=true');
    });

    it('redirects to /login?ssoFailed=true for expired token', async () => {
      const now = Math.floor(Date.now() / 1000);
      const token = await mintTestToken({
        sub: 'AlphaGrey',
        exp: now - 3600,
        iat: now - 7200,
      });

      const res = await request(app).get(`/sso-login?sso=${token}`);

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/login?ssoFailed=true');
    });

    it('handles legacy ssoToken query parameter', async () => {
      const token = await mintTestToken({
        sub: 'AlphaGrey',
      });

      const res = await request(app).get(`/sso-login?ssoToken=${token}`);

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/');
    });

    it('prefers sso param over ssoToken when both present', async () => {
      const validToken = await mintTestToken({ sub: 'AlphaGrey' });
      const invalidToken = await mintTestToken({ sub: 'AlphaGrey', secret: 'wrong' });

      // Valid token in sso, invalid in ssoToken - should succeed
      const res = await request(app).get(`/sso-login?sso=${validToken}&ssoToken=${invalidToken}`);

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/');
    });

    it('session cookie contains correct user info', async () => {
      const token = await mintTestToken({
        sub: 'AlphaGrey',
        name: 'Alpha Grey',
        role: 'admin',
        tenant: 'test-tenant',
      });

      const res = await request(app).get(`/sso-login?sso=${token}`);

      const cookies = res.headers['set-cookie'];
      const sessionCookie = Array.isArray(cookies)
        ? cookies.find(c => c.includes('ts24_sso_session='))
        : cookies?.includes('ts24_sso_session=') ? cookies : undefined;

      expect(sessionCookie).toBeDefined();

      // Extract and decode the session value
      const match = sessionCookie?.match(/ts24_sso_session=([^;]+)/);
      expect(match).toBeDefined();

      const encodedValue = match![1];
      const decoded = JSON.parse(Buffer.from(encodedValue, 'base64url').toString());

      expect(decoded).toMatchObject({
        userId: 'AlphaGrey',
        role: 'admin',
        name: 'Alpha Grey',
        tenant: 'test-tenant',
        ssoAuth: true,
      });
      expect(typeof decoded.authTime).toBe('number');
    });
  });
});
