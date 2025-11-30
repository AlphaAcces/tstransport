# TS24 Login Flow

**Last updated:** 30 Nov 2025

## Entry Point & Components

- `App.tsx` renders `<LoginPage />` whenever `authUser` is `null`. The login UI therefore lives at the root route (`/`) and is shown before any layout, TopBar or navigation is mounted.
- Successful authentication calls `onLoginSuccess` → `App` stores the `{ id, role }` payload both in component state and in `sessionStorage` under the `authUser` key. A stored user is re-hydrated on refresh inside a `useEffect` so the console opens directly on the dashboard the next time the user visits.
- Logout is handled in `App.handleLogout`, which clears the same storage key and collapses the Command Deck.

## Credential Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| Username (`auth.usernameLabel`) | Text | Yes | Client-side `required` attribute enforced. Used as key lookup in a local `users` map inside `LoginPage.tsx`. |
| Password (`auth.passwordLabel`) | Password | Yes | Client-side `required`. Content compared against the `users` map. Show/Hide toggle mirrors label text and currently shares the same `aria-label`. |
| PIN code (`auth.pinLabel`) | Password (numeric input mode) | No | Displayed to mimic 2FA, but the entered value is not validated or sent anywhere yet. |
| Token (`auth.tokenLabel`) | Text | No | Placeholder for hardware token / SSO values. Input is optional and currently unused. |

Demo credentials (hard-coded in `LoginPage.tsx`):

- `AlphaGrey` / `Nex212325` → role `admin`
- `cetin.umit.TS` / `26353569` → role `user`

## SSO Entry (`/sso-login`)

- Canonical route: `/sso-login?sso=<JWT>`. The legacy `/sso-login?ssoToken=<JWT>` and `/login?sso=<JWT>` aliases still work, but they immediately 302/`navigate()` into the canonical URI so dashboards, bookmarks and telemetry only see one entry-point.
- Tokens are HS256 JWTs minted by ALPHA-Interface-GUI (see `sso_notes.md` in that repo) after a successful GDI login.
- Verification happens entirely in the browser using [`jose`](https://github.com/panva/jose). The shared secret **must** be supplied through `VITE_SSO_JWT_SECRET` at build time.
- Required claims: `sub` (agent identifier matching the existing demo user map), `name` (shown in the UI), `role` (`admin`/`user`), plus standard `iat`/`exp` managed by the PHP helper.
- Success path mirrors manual login: the decoded `{ id, role, name }` payload is persisted to `sessionStorage` and the dashboard shell mounts instantly.
- Failure (missing/invalid/expired token or unknown subject) funnels into the localized banner on `/login` (visible thanks to `location.state.ssoFailed = true`). Operators always land on the manual form after a few seconds, so there is a single fallback UX for every SSO problem.
- Future improvement (documented inline as TODO): move away from the static user map and swap the client-side verification for a backend-issued session + refresh token.

### SSO Healthcheck (TS24-side)

- Endpoint: `GET /api/auth/sso-health` (open in dev/staging, gated in prod when `TS24_SSO_HEALTH_PROTECTED=true` or `NODE_ENV=production`). When protection is enabled, callers must include `X-SSO-Health-Key: <TS24_SSO_HEALTH_KEY>`.
- Sample response:

```json
{
  "expectedIss": "ts24-intel",
  "expectedAud": "ts24-intel",
  "secretConfigured": true,
  "usesHS256": true,
  "configVersion": "v1",
  "recentErrors": {
    "invalidSignature": 0,
    "expired": 0,
    "malformed": 0,
    "unknownAgent": 0
  }
}
```

- `secretConfigured` reflects whether `VITE_SSO_JWT_SECRET`/`SSO_JWT_SECRET` (shared with the client verifier) is available on the server. `recentErrors` draws from the shared in-memory `ssoMetrics` store that every `SsoError` increments (until we swap to Prometheus/Redis).
- Usage (dev/staging):

```bash
curl http://localhost:4001/api/auth/sso-health | jq
```

- Cross-check this output with `sso_health.php` from ALPHA-Interface-GUI to ensure both sides agree on issuer/audience/secrets before testing redirects end-to-end. In prod, include the `X-SSO-Health-Key` header to avoid `403` responses.

## Submission, Validation & Errors

- `handleSubmit` prevents default form submission, clears `errorKey`, and simulates a 500 ms network delay via `setTimeout` to display the spinner copy (`auth.submitting`).
- Username/password pairs are validated entirely on the client against the `users` object. No API is called yet, and PIN/token values are ignored.
- On failure the component sets `errorKey = 'auth.error.invalidCredentials'`, which shows an inline banner using the translated copy (`Invalid username or password` / `Forkert brugernavn eller adgangskode`).
- Accessibility: every field exposes `aria-label` text from i18n; the error box is announced using a descriptive `role="alert"` for the request form, while the credential error uses semantic content and icon.

## Success Flow

1. Credentials match a known entry → `onLoginSuccess` fires with `{ id: username, role }`.
2. `App` stores that payload in state and `sessionStorage`, then renders the full shell (TopBar, SideNav, Command Deck, DataProvider, etc.).
3. `useAppNavigation` boots with `navState.activeView = 'dashboard'`, so the first post-login view is `DashboardView`.
4. All downstream contexts (tenant, theme, Redux store) are mounted only after login, so network hooks and telemetry start at this point.

## Failure Flow

- Any mismatch sets `errorKey` and re-enables the button after the simulated delay.
- Because validation is local only, brute-force lockouts, throttling and audit logging are not implemented yet.
- If translations switch to Danish, error text changes but behavior remains identical.

## Request-Access Drawer

- Secondary accordion lets prospective users submit an access request. Required fields: `name`, `email`, `role`, `purpose`. Organization is optional.
- Submission payload is sent to `tenantApi.submitAccessRequest`, which today is a mock returning `{ success, data?, error? }`.
- Success clears the form, shows `auth.requestAccess.success` for 6 s, and disables the button while `isRequestSubmitting` is true. Errors either use the explicit reason returned from the API or fall back to `auth.requestAccess.error.generic`.

## Session/Guard Hooks for Future SSO

- Session check lives solely in `App.tsx` via the `authUser` state and the `sessionStorage` copy. Any SSO bootstrapping can short-circuit the login screen by setting this state as soon as a verified token is present.
- The natural insertion points for SSO are:
  1. **LoginPage pre-flight** – detect an inbound SSO token (query param, postMessage, etc.) and exchange it for a `{ id, role }` bundle before rendering the manual form.
  2. **`handleSubmit` override** – replace the `setTimeout`/`users` check with a real API request that validates username/password + token/PIN and returns a session/refresh token.
  3. **`App` session bootstrap** – extend the existing `useEffect` that reads `sessionStorage` so it also validates opaque SSO tokens (e.g., stored in cookies or localStorage) before trusting the cached user.
- Downstream components already check `authUser` to decide whether to show navigation, so once `authUser` comes from an SSO handshake the rest of the console works unchanged.

## Manual Verification (Dev)

1. `npx playwright install chromium` to provision a browser runner.
2. `npx start-server-and-test "npm run dev -- --host 127.0.0.1 --port 5189 --strictPort" http://127.0.0.1:5189 "SET LOGIN_BASE_URL=http://127.0.0.1:5189/&& node scripts/login-flow-check.mjs"`
   - The temporary Playwright script filled wrong credentials first and asserted the red banner copy.
   - It then submitted `AlphaGrey / Nex212325 / 123456 PIN`, waited for the login hero text to disappear, and confirmed that the `.topbar` (dashboard shell) mounted.
   - Vite logged proxy warnings for `/api/system-status` and `/api/network-stats` because those backend stubs are not running locally; the UI handles the missing telemetry by showing loading states.
   - `start-server-and-test` tries to call the deprecated `wmic.exe` on Windows 11 when shutting Vite down, so the command exits with a non-zero status even though the login checks passed. The warnings can be ignored for now.

### Manual SSO smoke test

1. Export the same secret that ALPHA uses: `set "SSO_JWT_SECRET=dev-shared-secret"`.
2. Mint a token for the demo operator: `node scripts/dev-mint-sso-token.mjs AlphaGrey admin "Alpha Grey"` → copy the string.
3. Start the dev server (`npm run dev`) and open `http://localhost:5173/sso-login?sso=<copied-token>` (aliases such as `/login?sso=` redirect here automatically).
4. Expected result: the SSO status card briefly shows “Secure token verified” before the dashboard header/topbar loads without touching the login form.
5. If the token is invalid/expired/missing, the SSO page shows the localized error and redirects back to `/` so manual login remains available.

### Automated Playwright smoke

- Command: `npm run test:sso-smoke` (ensure both `VITE_SSO_JWT_SECRET` **and** `SSO_JWT_SECRET` are set in the invoking shell so the client verifier and minting helper share the same secret; requires the dev server on `http://localhost:5173`).
- The spec mints a short-lived HS256 token using the same helper logic as `dev-mint-sso-token.mjs`, opens `/login?sso=<token>`, and asserts that the dashboard top bar renders while the SSO failure banner (`data-testid="sso-failure-banner"`) stays hidden.
- Recommended workflow locally:
  1. `VITE_SSO_JWT_SECRET=dev-shared-secret npm run dev`
  2. In another terminal: `SSO_JWT_SECRET=dev-shared-secret npm run test:sso-smoke`
- CI can wrap the same command with `start-server-and-test` or a bespoke Playwright project once we add the TS24 dev server task.

## Known Limitations / Risks

- Authentication is entirely client-side with plaintext demo users, so the current flow provides no real security. Never ship this variant to production.
- PIN and token inputs are cosmetic today. They are not part of validation or submitted anywhere.
- No throttling, CAPTCHA, lockouts, or audit logging for repeated failures.
- Translated `aria-label`s cause the show/hide buttons to reuse field names (e.g., "Vis adgangskode" contains "adgangskode"), so automation should target the `input[aria-label=...]` selectors explicitly.
- Session persistence relies solely on browser `sessionStorage`; closing the tab clears the session, but background API calls have no concept of token expiry yet.

## Recommendations for SSO Enablement

1. **Introduce a real auth API** – replace the local `users` map with a `POST /api/auth/login` call (username/password/PIN/token) and treat the response as the new `authUser` source. This makes it easier to drop in SSO because both flows can return the same payload.
2. **Token plumbing** – store issued tokens (or SSO assertions) alongside `authUser` and attach them to fetch requests from `tenantApi`, monitoring, etc.
3. **Guarded routes** – add a higher-order component or router guard so direct deep links also bounce unauthenticated users to `/login`.
4. **SSO hook** – insert a detection layer in `LoginPage` (or a wrapper) that listens for an IdP redirect containing an auth code/SSO token, exchanges it server-side, and calls `onLoginSuccess` automatically.
5. **Session refresh** – extend `App` to verify cached tokens against the backend before trusting them, and add logout-on-expiry behavior so the UI doesn’t stay open when a session is invalidated elsewhere.
