import { chromium } from 'playwright';

const baseUrl = process.env.LOGIN_BASE_URL ?? 'http://127.0.0.1:5173/';

const getInput = (page, selectors) => {
  return page.locator(selectors.map((selector) => `input[aria-label="${selector}"]`).join(', ')).first();
};

const steps = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    const usernameField = getInput(page, ['Username', 'Brugernavn']);
    const passwordField = getInput(page, ['Password', 'Adgangskode']);
    const pinField = getInput(page, ['PIN code', 'PIN-kode']);
    const loginButton = page.getByRole('button', { name: /LOG (IN|IND)/i });

    // Invalid attempt
    await usernameField.fill('wrong');
    await passwordField.fill('bad');
    await loginButton.click();
    await page.getByText(/Invalid username or password|Forkert brugernavn eller adgangskode/i).waitFor({ timeout: 5000 });
    console.log('[login-check] Invalid credentials error surfaced');

    // Successful attempt with demo operator
    await usernameField.fill('AlphaGrey');
    await passwordField.fill('Nex212325');
    await pinField.fill('123456');
    await loginButton.click();

    await page.getByText(/Secure access|Sikker adgang/i).waitFor({ state: 'detached', timeout: 5000 });
    await page.waitForSelector('.topbar', { timeout: 5000 });
    console.log('[login-check] Successful login reached dashboard');
  } finally {
    await page.close();
    await browser.close();
  }
};

steps().catch((error) => {
  console.error('[login-check] Flow verification failed', error);
  process.exit(1);
});
