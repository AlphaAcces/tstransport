# TS24 SSO v1 Sign-off (TS-side)

**Last updated:** 1 Dec 2025

## Purpose

This document tracks the TS24-side acceptance criteria for SSO v1 before sign-off. It complements the GUI-team's runbook and focuses on API endpoints, token validation, and monitoring.

---

## 🎯 Canonical TS24 Entry URL

**Production domain:** `https://intel24.blackbox.codes`

| Entry Point | URL | Use |
|-------------|-----|-----|
| **SSO (kanonisk)** | `https://intel24.blackbox.codes/sso-login?sso=<JWT>` | GDI sætter `TS24_CONSOLE_URL` til denne |
| **Manuel login** | `https://intel24.blackbox.codes/login` | Backup / direkte adgang |

> **For GDI-lederen:** Sæt `TS24_CONSOLE_URL=https://intel24.blackbox.codes/sso-login` i `env.php`.

---

## Where in the Code

| Component/File | Path | Responsibility |
|----------------|------|----------------|
| SSO server auth | `server/ssoAuth.ts` | `verifySsoTokenServerSide()`, server-side HS256 verification |
| SSO auth verify endpoint | `server/app.ts` | `GET /api/auth/verify` - token verification for GDI preflight |
| SSO login handler | `server/app.ts` | `GET /sso-login` - server-side token validation + redirect |
| SSO health endpoint | `server/app.ts` | `/api/auth/sso-health` returns config status |
| Public health endpoint | `server/app.ts` | `/api/health` readiness probe for DNS/TLS |
| **SSO Backend Service** | `src/domains/auth/ssoBackend.ts` | Client-side backend integration, cookie handling |
| **SSO Error Display** | `src/components/Auth/SsoErrorDisplay.tsx` | User-friendly SSO error UI components |
| SsoLoginPage | `src/components/Auth/SsoLoginPage.tsx` | Client-side SSO verification + error display |
| SSO domain (legacy) | `src/domains/auth/sso.ts` | Legacy client-side HS256 verification (deprecated) |
| SSO metrics | `shared/ssoMetrics.ts` → `server/app.ts` | `getSsoMetricsSnapshot()` for error counters |
| LoginRoute | `src/App.tsx` (line ~350) | Redirects `?sso=` params to `/sso-login` |
| Login flow check | `scripts/login-flow-check.mjs` | Automated smoke test script |
| E2E SSO smoke | `e2e/sso-smoke.spec.ts` | Playwright SSO test |
| **E2E Backend tests** | `e2e/sso-backend.spec.ts` | Playwright tests for backend verification flow |
| SSO auth tests | `server/__tests__/ssoAuthApi.test.ts` | Vitest tests for SSO endpoints |

---

## Frontend SSO Integration (v1.1)

### ssoBackend.ts Service

The new `src/domains/auth/ssoBackend.ts` provides client-side integration with the backend SSO verification:

```typescript
// Verify token via backend API
const user = await verifySsoTokenViaBackend(token);

// Read SSO session from cookie
const session = getSsoSession();
const user = buildAuthUserFromSession(session);

// Check if valid session exists
if (hasValidSsoSession(8 * 60 * 60 * 1000)) {
  // Session valid within 8 hours
}

// Clear session on logout
clearSsoSessionCookie();
```

### Error Codes

| Code | Description | User Message |
|------|-------------|--------------|
| `TOKEN_MISSING` | No token provided | Authentication required |
| `TOKEN_INVALID` | Malformed/tampered token | Invalid session |
| `TOKEN_EXPIRED` | Token TTL exceeded | Session expired |
| `TOKEN_ISSUER_MISMATCH` | Wrong `iss` claim | Authentication error |
| `TOKEN_AUDIENCE_MISMATCH` | Wrong `aud` claim | Authentication error |
| `TOKEN_UNKNOWN_AGENT` | Subject not in allowlist | Access denied |
| `NETWORK_ERROR` | Failed to reach backend | Connection error |

### SSO Session Cookie

```
Name: ts24_sso_session
Format: base64url-encoded JSON
Fields: { userId, role, name, tenant, ssoAuth: true, authTime }
```

---

## Scope

- Dokumenterer hvilke TS24-kontroller der skal være grønne, før SSO v1 erklæres klar fra vores side.
- Supplerer, men ændrer ikke, GUI-teamets kontrakt. Fokus er på API'er, tokenbro og overvågning i TS24 backenden.
- Bliver versioneret sammen med koden, så vi kan matche sign-off med GUI-runbook'en inden endelig godkendelse.

## Checks før "grøn" status

### `/sso-login` happy path (server-side v1.1)

- Gyldigt `?sso=` token (signeret med HS256 og delt hemmelighed) skal:
  1. Blive verificeret server-side i `server/ssoAuth.ts` via `verifySsoTokenServerSide()`.
  2. Sætte `ts24_sso_session` cookie med brugerdata.
  3. Redirecte brugeren til hoveddashboardet (`/`) med aktiv session.
  4. Logge audit-entry via `logAudit()` med `sso:login_success` action.
- `scripts/login-flow-check.mjs` kan køres lokalt for et hurtig-run af broen (`node scripts/login-flow-check.mjs`).

### `/api/auth/verify` endpoint (GDI preflight)

- GDI kan kalde `GET /api/auth/verify` med `Authorization: Bearer <JWT>` header.
- Ved gyldig token: returnerer `{ status: "ok", ts24_user_id, role, tenant, ts }`.
- Ved ugyldig token: returnerer `401` + `{ status: "error", error: "<ERROR_CODE>" }`.

### Fejlhåndtering

- Ugyldigt eller udløbet token skal:
  1. Logge `[sso-login] Token verification failed (...)` på serveren.
  2. Logge audit-entry med `sso:login_failed` action.
  3. Redirecte til `/login?ssoFailed=true`.
- Manuel login skal stadig være synligt/tilgængeligt (url `/login`).
- Der må ikke opstå redirect-loops – brugeren skal lande på `/login` med `ssoFailed=true` query param.

### `/api/auth/sso-health`

- Endpoint skal svare succesfuldt (200) når korrekt `X-SSO-Health-Key` er angivet i prod.
- Payload-felter vi validerer mod GUI-siden:
  - `secretConfigured` → `true`, ellers blokerer vi sign-off.
  - `usesHS256` → `true` (hardkodet i v1).
  - `expectedIss` og `expectedAud` → `ts24-intel` (skal matche GUI).
  - `configVersion` → `v1` (kan bruges til fremtidig migrering).
  - `recentErrors` → Ingen uløste fejl de seneste 24 timer; ellers skal der følge en RCA i loggen.

### Public `/api/health`

- **Formål:** Hurtig sanity-check når DNS/CNAME + TLS er deployeret, så GUI/ops kan se om TS24 svarer.
- **Endpoint:** `GET https://intel24.blackbox.codes/api/health`
- **Forventet payload:**

  ```json
  {
    "service": "TS24 Intel Console",
    "status": "ok",
    "timestamp": "<ISO8601>",
    "version": "<semver-or-dev>"
  }
  ```

- **Sikkerhed:** Public og uden auth → kan rammes af ekstern monitorering (Statuspage, Pingdom, etc.).

## Tests & automatisering

- `npm test -- --run` dækker bl.a.:
  - `src/components/Auth/__tests__/SsoLoginFlow.test.tsx` (happy path + failure banner).
  - `src/domains/tenant/__tests__/tenantApi.test.ts` (sørger for at auth-headere og tokenrefresh ikke brydes).
- `scripts/login-flow-check.mjs` (kan også køres via `npx start-server-and-test ... login-flow-check`).
- `e2e/sso-smoke.spec.ts` (Playwright) kører på CI for at sikre at redirect + dashboard stadig virker mod dev-serveren.

## Logs & metrics, når noget fejler

- Browser-konsol: `[sso-login]`-prefiksede logs viser både succes og failures.
- Server (`server/app.ts`): `/api/auth/sso-health` og `getSsoMetricsSnapshot()` eksponerer `recentErrors` (fx `SSO_INVALID_SIGNATURE`).
- Event logs: `scripts/login-flow-check.mjs` printer lærredet med HTTP-status + eventuelle JSON-fejl for opsamling i runbook.
- Monitoring: `docs/ts24_login_flow.md` beskriver hvordan `sso-health` matches mod GUI'ens `sso_health.php` view.

## Relation til GUI-runbook

- Dette dokument er TS24-side pendant til GUI-teamets `sso_ops_runbook.md`.
- Endelig SSO v1 sign-off kræver:
  1. TS24-dokumentet: alle ovenstående checks grønne.
  2. GUI-runbook'en: grøn status for deres valideringer.
- Når begge er grønne, registreres sign-off i release-noten sammen med reference til begge dokumenter.

---

## Ops-test: DNS & Certifikat Verifikation

Før SSO v1 kan erklæres live, skal ops bekræfte at domænet `intel24.blackbox.codes` er korrekt konfigureret.

> 📘 **Detaljeret runbook:** For komplet DNS/cert-setup, GO-checkliste og fejlsøgning, se [ts24_dns_and_cert_ops.md](ts24_dns_and_cert_ops.md).

### DNS Check

```bash
# Forventet: A/CNAME record peger på TS24-hosting
dig intel24.blackbox.codes +short
# eller
nslookup intel24.blackbox.codes
```

**Forventet resultat:** En gyldig IP-adresse eller CNAME. `NXDOMAIN` eller `ERR_NAME_NOT_RESOLVED` er kun acceptabelt **før** DNS er sat op – ikke efter.

### HTTP/TLS Check

```bash
# Check at serveren svarer med korrekt certifikat
curl -I https://intel24.blackbox.codes/login
```

**Forventet:**

- HTTP status: `200 OK` eller `304 Not Modified`
- TLS: Gyldigt certifikat for `intel24.blackbox.codes` (ingen cert warnings)

```bash
# SSO entry check
curl -I "https://intel24.blackbox.codes/sso-login"
```

**Forventet:** `200 OK` (SsoLoginPage renderes, da manglende token redirecter til login)

```bash
# Health probe (ingen auth)
curl -I https://intel24.blackbox.codes/api/health
```

**Forventet:** `200 OK` + JSON med `status: "ok"`

### SSO Health Endpoint

```bash
curl https://intel24.blackbox.codes/api/auth/sso-health | jq
```

**Forventet payload:**

```json
{
  "secretConfigured": true,
  "usesHS256": true,
  "expectedIss": "ts24-intel",
  "expectedAud": "ts24-intel",
  "configVersion": "v1"
}
```

> **Note:** I prod kræver dette `X-SSO-Health-Key` header. Kontakt ops for key.

### Sign-off Blokkere

| Check | Status | Blokerer? |
|-------|--------|-----------|
| DNS opløser korrekt | ☐ | Ja |
| HTTPS/TLS fungerer | ☐ | Ja |
| `/sso-login` returnerer 200 | ☐ | Ja |
| `/api/health` returnerer 200 | ☐ | Ja |
| `/api/auth/sso-health.secretConfigured` = true | ☐ | Ja |
| `recentErrors` alle = 0 (eller kendt RCA) | ☐ | Ja |

---

## End-to-end HTTP-flow

```text
Browser (GDI) ──TLS──▶ https://intel24.blackbox.codes
  │                       │
  │ (1) DNS lookup        │
  │ (2) TLS handshake     │
  └───────┬───────────────┘
      │
      ▼
    /sso-login (SPA)
      │
      ├── Valid token → `/` dashboard
      └── Invalid/missing token → `/login` + `ssoFailed=true`

Monitoring path (ops)
  ├── `/api/health` → public readiness (no auth)
  └── `/api/auth/sso-health` → protected SSO config probe
```

---

## GO-krav (TS24 software side)

1. DNS peger på TS24 infra og svarer på IPv4 (og evt. IPv6).
2. TLS-certifikat gyldigt og testet via `curl -I https://intel24.blackbox.codes/login`.
3. `/sso-login` loader uden cert-fejl og håndterer redirects korrekt.
4. `/api/health` svarer 200 + `{ status: "ok" }` uden auth.
5. `/api/auth/sso-health` svarer 200 (med nøgle) og `secretConfigured=true`.
6. Negativ SSO-test (ugyldigt token) lander på `/login` med banner.
