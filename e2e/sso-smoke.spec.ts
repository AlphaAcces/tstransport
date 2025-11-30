import { test, expect } from '@playwright/test';
import { SignJWT } from 'jose';

const ssoSecret = process.env.SSO_JWT_SECRET || process.env.VITE_SSO_JWT_SECRET;

async function mintSsoToken(subject = 'AlphaGrey', role = 'admin', name = 'Alpha Grey') {
  if (!ssoSecret) {
    throw new Error('SSO_JWT_SECRET or VITE_SSO_JWT_SECRET must be set to run the SSO smoke test.');
  }

  const encoder = new TextEncoder();
  return new SignJWT({ role, name })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime('5m')
    .setProtectedHeader({ alg: 'HS256' })
    .sign(encoder.encode(ssoSecret));
}

test.describe('SSO smoke flow', () => {
  test('logs in via canonical /sso-login route', async ({ page }) => {
    test.skip(!ssoSecret, 'SSO secret missing – set SSO_JWT_SECRET or VITE_SSO_JWT_SECRET.');
    page.on('console', (message) => {
      // Surface browser console output to aid debugging when the smoke test fails in CI.
      console.log(`[browser:${message.type()}] ${message.text()}`);
    });

    const token = await mintSsoToken();
    await page.goto(`/login?sso=${encodeURIComponent(token)}`);

    await expect(page.locator('.topbar')).toBeVisible();
    await expect(page.getByTestId('sso-failure-banner')).toHaveCount(0);
  });
});
