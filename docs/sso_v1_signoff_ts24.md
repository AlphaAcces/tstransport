# TS24 SSO v1 Sign-off (TS-side)

## Purpose & Scope

- Dokumenterer hvilke TS24-kontroller der skal være grønne, før SSO v1 erklæres klar fra vores side.
- Supplerer, men ændrer ikke, GUI-teamets kontrakt. Fokus er på API'er, tokenbro og overvågning i TS24 backenden.
- Bliver versioneret sammen med koden, så vi kan matche sign-off med GUI-runbook'en inden endelig godkendelse.

## Checks før "grøn" status

### `/sso-login` happy path

- Gyldigt `?sso=` token (signeret med HS256 og delt hemmelighed) skal:
  1. Blive verificeret i `SsoLoginPage` → `lib/ai.ts` uden konsolfejl.
  2. Redirecte brugeren til hoveddashboardet (`/`) med aktiv session og synkroniseret `case` query-param.
  3. Logge audit-entry via `createAuditEntry` med `caseId`, `subject` og `dataSource` sat.
- `scripts/login-flow-check.mjs` kan køres lokalt for et hurtig-run af broen (`node scripts/login-flow-check.mjs`).

### Fejlhåndtering

- Ugyldigt eller udløbet token skal trigge banneret "Session kunne ikke overføres" på login-siden og logge `[sso-login] Token verification failed (...)` i konsollen.
- Manuel login skal stadig være synligt/tilgængeligt (url `/login`).
- Der må ikke opstå redirect-loops – brugeren skal lande på `/login` med `state.ssoFailed=true`.

### `/api/auth/sso-health`

- Endpoint skal svare succesfuldt (200) når korrekt `X-SSO-Health-Key` er angivet i prod.
- Payload-felter vi validerer mod GUI-siden:
  - `secretConfigured` → `true`, ellers blokerer vi sign-off.
  - `usesHS256` → `true` (hardkodet i v1).
  - `expectedIss` og `expectedAud` → `ts24-intel` (skal matche GUI).
  - `configVersion` → `v1` (kan bruges til fremtidig migrering).
  - `recentErrors` → Ingen uløste fejl de seneste 24 timer; ellers skal der følge en RCA i loggen.

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
