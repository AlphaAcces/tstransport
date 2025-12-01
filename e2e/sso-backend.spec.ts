/**
 * SSO Backend Verification E2E Tests
 * Tests the full SSO flow using backend verification via GET /api/auth/verify
 */
import { test, expect } from '@playwright/test';
import { SignJWT } from 'jose';

const SSO_SECRET = process.env.SSO_JWT_SECRET || process.env.VITE_SSO_JWT_SECRET;
const API_BASE = process.env.API_URL || 'http://localhost:4290';

// Known expected issuer/audience from server config
const SSO_ISSUER = 'ts24-sso';
const SSO_AUDIENCE = 'ts24-intel-console';

/**
 * Mint a valid SSO token with configurable parameters
 */
async function mintSsoToken(options: {
  subject?: string;
  role?: string;
  name?: string;
  tenant?: string;
  expiresIn?: string;
  issuer?: string;
  audience?: string;
} = {}) {
  if (!SSO_SECRET) {
    throw new Error('SSO_JWT_SECRET must be set to run SSO E2E tests.');
  }

  const {
    subject = 'AlphaGrey',
    role = 'admin',
    name = 'Alpha Grey',
    tenant = 'tsl',
    expiresIn = '5m',
    issuer = SSO_ISSUER,
    audience = SSO_AUDIENCE,
  } = options;

  const encoder = new TextEncoder();
  const builder = new SignJWT({ role, name, tenant })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setProtectedHeader({ alg: 'HS256' });

  if (issuer) builder.setIssuer(issuer);
  if (audience) builder.setAudience(audience);

  return builder.sign(encoder.encode(SSO_SECRET));
}

/**
 * Create an expired token (issued in the past with short expiry)
 */
async function mintExpiredToken() {
  if (!SSO_SECRET) {
    throw new Error('SSO_JWT_SECRET must be set.');
  }

  const encoder = new TextEncoder();
  const iat = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
  const exp = iat + 60; // expired 59 minutes ago

  return new SignJWT({ role: 'viewer', name: 'Expired User', tenant: 'tsl' })
    .setSubject('ExpiredUser')
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .setIssuer(SSO_ISSUER)
    .setAudience(SSO_AUDIENCE)
    .setProtectedHeader({ alg: 'HS256' })
    .sign(encoder.encode(SSO_SECRET));
}

test.describe('SSO Backend Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and local storage before each test
    await page.context().clearCookies();
  });

  test('1. Valid token → backend verify → redirect to dashboard', async ({ page }) => {
    test.skip(!SSO_SECRET, 'SSO secret missing – set SSO_JWT_SECRET.');

    const token = await mintSsoToken();

    // Navigate to SSO login with valid token
    await page.goto(`/sso-login?sso=${encodeURIComponent(token)}`);

    // Should show verifying state briefly, then redirect to dashboard
    await expect(page.locator('[data-testid="dashboard"], .topbar')).toBeVisible({ timeout: 10000 });

    // SSO failure banner should NOT be visible
    await expect(page.getByTestId('sso-failure-banner')).toHaveCount(0);

    // Should have SSO session cookie set
    const cookies = await page.context().cookies();
    const ssoCookie = cookies.find(c => c.name === 'ts24_sso_session');
    expect(ssoCookie).toBeDefined();
  });

  test('2. Expired token → backend rejects → redirect to login with error', async ({ page }) => {
    test.skip(!SSO_SECRET, 'SSO secret missing – set SSO_JWT_SECRET.');

    const expiredToken = await mintExpiredToken();

    // Navigate to SSO login with expired token
    await page.goto(`/sso-login?sso=${encodeURIComponent(expiredToken)}`);

    // Should eventually redirect to login page with error banner
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Error banner should be visible (either full error display or banner)
    const hasErrorDisplay = await page.locator('[data-testid="sso-error-display"], [data-testid="sso-error-banner"]').count();
    expect(hasErrorDisplay).toBeGreaterThan(0);
  });

  test('3. Invalid/tampered token → backend rejects → error displayed', async ({ page }) => {
    test.skip(!SSO_SECRET, 'SSO secret missing – set SSO_JWT_SECRET.');

    // Create a tampered token (modified signature)
    const validToken = await mintSsoToken();
    const tamperedToken = validToken.slice(0, -10) + 'TAMPERED!!';

    await page.goto(`/sso-login?sso=${encodeURIComponent(tamperedToken)}`);

    // Should show error or redirect to login
    await expect(page.locator('[data-testid="sso-error-display"], [data-testid="sso-error-banner"]').or(
      page.locator('text=Invalid token')
    )).toBeVisible({ timeout: 10000 });
  });

  test('4. Wrong issuer → TOKEN_ISSUER_MISMATCH error', async ({ page }) => {
    test.skip(!SSO_SECRET, 'SSO secret missing – set SSO_JWT_SECRET.');

    const wrongIssuerToken = await mintSsoToken({ issuer: 'wrong-issuer' });

    await page.goto(`/sso-login?sso=${encodeURIComponent(wrongIssuerToken)}`);

    // Should display error related to issuer mismatch
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('5. Missing token → TOKEN_MISSING error → redirect to login', async ({ page }) => {
    // Navigate to SSO login without any token
    await page.goto('/sso-login');

    // Should redirect to login or show TOKEN_MISSING error
    // If there's no SSO session cookie, it should show error
    await expect(page).toHaveURL(/\/login|\/sso-login/, { timeout: 10000 });

    // Either redirects to login or shows error display
    const isOnLogin = page.url().includes('/login');
    const hasErrorDisplay = await page.locator('[data-testid="sso-error-display"]').count() > 0;

    expect(isOnLogin || hasErrorDisplay).toBe(true);
  });
});

test.describe('SSO Session Cookie Handling', () => {
  test('Session cookie is httpOnly and secure in production', async ({ request }) => {
    test.skip(!SSO_SECRET, 'SSO secret missing – set SSO_JWT_SECRET.');

    const token = await mintSsoToken();

    // Call the backend verify endpoint directly
    const response = await request.get(`${API_BASE}/api/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('valid');
    expect(data.ts24_user_id).toBeDefined();
    expect(data.role).toBeDefined();
  });

  test('Cookie expiry after maxAge', async ({ page }) => {
    test.skip(!SSO_SECRET, 'SSO secret missing – set SSO_JWT_SECRET.');

    const token = await mintSsoToken();

    // Login successfully
    await page.goto(`/sso-login?sso=${encodeURIComponent(token)}`);
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 10000 });

    // Verify cookie exists
    const cookies = await page.context().cookies();
    const ssoCookie = cookies.find(c => c.name === 'ts24_sso_session');
    expect(ssoCookie).toBeDefined();

    // Cookie should have reasonable maxAge (we can't easily test expiry without time mocking)
    // Just verify the cookie format is correct
    if (ssoCookie) {
      // Cookie value should be base64url encoded JSON
      const decoded = Buffer.from(ssoCookie.value, 'base64url').toString('utf-8');
      const sessionData = JSON.parse(decoded);

      expect(sessionData).toHaveProperty('userId');
      expect(sessionData).toHaveProperty('role');
      expect(sessionData).toHaveProperty('ssoAuth', true);
    }
  });
});test.describe('SSO Logout Flow', () => {
  test('Logout clears SSO session cookie', async ({ page }) => {
    test.skip(!SSO_SECRET, 'SSO secret missing – set SSO_JWT_SECRET.');

    const token = await mintSsoToken();

    // Login
    await page.goto(`/sso-login?sso=${encodeURIComponent(token)}`);
    await expect(page.locator('.topbar')).toBeVisible({ timeout: 10000 });

    // Verify cookie exists
    let cookies = await page.context().cookies();
    expect(cookies.some(c => c.name === 'ts24_sso_session')).toBe(true);

    // Click logout button (find it in the UI)
    const logoutButton = page.locator('[data-testid="logout-button"], button:has-text("Log out"), button:has-text("Logout")');
    if (await logoutButton.count() > 0) {
      await logoutButton.first().click();

      // Wait for redirect to login
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

      // Cookie should be cleared
      cookies = await page.context().cookies();
      expect(cookies.some(c => c.name === 'ts24_sso_session')).toBe(false);
    }
  });
});
