# Intel24 WAR ROOM – STAGE 3 PREP

**Status:** 🔴 PRE-ACTIVE RESPONSE MODE (Awaiting ALPHA "QA RUN — ROUND 1 RESULTS" + patch go/no-go)
**Scope:** Tooling + procedural guidance only. Runtime remains untouched until explicit P0/P1 authorization.

---

## 1. Definition af Stage 3 (Active Response Mode)

- Stage 3 aktiveres, når ALPHA udsender QA-resultater med konkrete P0/P1 krav, og Intel24 får grønt lys til at deploye rettelser.
- Under Stage 3 må kun målrettede hotfixes mod login-/routing-/cookie-stakken merges og deployes.
- Alle ændringer foregår i kortlivede `hotfix/<ticket>` branches med fuld audit trail og realtime monitorering.
- Passive monitorer (`npm run qa:monitor`, `npm run qa:watchdog`) SKAL køre før, under og efter patch.

---

## 2. Patch Execution Protocols

1. **Authorize**: Modtag eksplcit "ALPHA PATCH OK" besked (+ severity) før kode berøres.
2. **Freeze**: Bekræft at andre teams stopper deploys (Slack #intel24-deploy).
3. **Branch**: `git checkout -b hotfix/<incident>` fra `main` eller seneste Stage 2 tag.
4. **Implement**: Minimal diff, ingen refaktor eller dependency bump.
5. **Document**: Opdater patch plan (P0/P1 template) og tilføj diff link i WAR ROOM log.
6. **Review**: Hurtig 2-person review hvis tiden tillader; ellers ALPHA verbal ack + post-review.
7. **Deploy Window**: Følg Stage 2 patch window procedure, men log hvert skridt i real time.
8. **Verification**: Kør `war-room/active/validate-hotfix.ts` guidance + sanity plan.

---

## 3. Live QA Hotfix Flow (P0/P1)

| Step | P0 (≤5 min) | P1 (≤15 min) |
|------|-------------|--------------|
| 1 | Trigger `run-p0-hotfix.ts` template for checklist | Trigger `run-p1-hotfix.ts` template |
| 2 | Immediate fix targeting token/cookie root cause | Scoped fix, may defer UI polish |
| 3 | Validate via `validate-hotfix.ts --suite critical` | Validate via `validate-hotfix.ts --suite targeted` |
| 4 | Publish patch announcement template (Slack) | Same, mark "P1" |
| 5 | Monitor logs 15 min + watchdog alerts | Monitor 30 min window |
| 6 | Escalate to rollback if metrics dip >2% | Same but allow one retry first |

---

## 4. TS24 ↔ ALPHA Kommunikationsflow (aktiv patch)

1. **Pre-patch**: Send patch announcement template med ETA og ansvarlig.
2. **During patch**: Update hvert 10. min eller efter milepæle (branch ready, tests pass, deploy start, deploy done).
3. **Post-patch**: Del sanity-test resultater + watchdog snapshots.
4. **Incident closure**: Når ALPHA bekræfter, at P0/P1 er lukket, logges beslutning i QA ledger + `patch-announcement-template.md` arkiveres.

---

## 5. Post-Patch Validering & Sanity Tests

- `npx tsx war-room/active/validate-hotfix.ts --suite critical`
- `npx tsx war-room/sanity-test-template.ts --plan default`
- `npm run qa:monitor -- --burst 5`
- `npm run qa:watchdog -- --duration 120`
- Playwright targeted run: `npx playwright test e2e/sso-smoke.spec.ts`
- Manual browser login using ALPHA-provided JWT (record HAR)

Alle resultater sendes til ALPHA-log med tidsstempel.

---

## 6. Retry / Rollback Procedures

1. **Retry Guardrails**
   - Kun én ekstra deploy forsøg pr. incident før rollback overvejes.
   - Retrys kræver dokumenteret root-cause justering (ikke blind redeploy).
2. **Rollback Trigger**
   - Watchdog alarmer ×2 inden for 60 sek.
   - Health success rate < 98% eller latency spike > 400 ms i 3 målinger.
3. **Rollback Steps**
   - Følg `war-room/rollback-quick.ts` instruktioner.
   - Re-apply tidligere stabile tag (`git checkout release/<tag>` + redeploy).
4. **Post-Rollback**
   - Informér ALPHA, kør sanity tests igen, og planlæg nyt patch window.

---

## 7. Single Source of Truth for QA Output

- **Primary Ledger**: `QA_STANDBY.md` → append Stage 3 decisions + status badge.
- **Parsed Output**: `scripts/qa-parse.ts` genererer `qa-report-<timestamp>.log` (lagres i `test-results/` midlertidigt).
- **Incident Journal**: `war-room/logs/` (create per-incident markdown with timeboxed updates).
- **Announcement Archive**: `patch-announcement-template.md` kopieret per patch og lagt i `war-room/announcements/`.

ALPHA refererer altid til disse kilder for endelig QA-status. Ingen beskeder anses som officielle, før de er registreret i Single Source of Truth.
