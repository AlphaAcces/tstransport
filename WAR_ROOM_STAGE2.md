# Intel24 WAR ROOM – STAGE 2 PREP

**Status:** 🟠 PREP MODE (Passive observation active, awaiting ALPHA "QA RUN — ROUND 1 RESULTS")
**Scope:** Planning + tooling only. No runtime mutations.

---

## 1. Hvad Stage 2 betyder

- Stage 2 = "Active Response Mode" aktiveres først efter ALPHA udsender QA-resultater med krævede hotfixes.
- Kun P0/P1 rettelser tillades, og de skal være hyper-fokuserede på login-/routingstakken.
- Alt arbejde foregår i dedikerede hotfix-branches med dokumenteret audit trail.
- Monitorer (`npm run qa:monitor`, `npm run qa:watchdog`) skal fortsætte uforstyrret.

---

## 2. P0 / P1 Response Playbook

| Trin | P0 (≤5 min) | P1 (≤15 min) |
|------|-------------|--------------|
| 1 | Bekræft alarm i #intel24-war-room | Bekræft alarm i #intel24-war-room |
| 2 | Freeze ny trafik (annoncér) | Marker delvis påvirkning |
| 3 | Initial diagnose (token, cookie, nginx) | Initial diagnose (affected cohort) |
| 4 | Spin op hotfix branch `hotfix/p0-<tag>` | Branch `hotfix/p1-<tag>` |
| 5 | Brug relevante filer fra Rapid Patch Kit | Samme |
| 6 | Kør sanity-test-template.ts lokalt | Kør sanity-test-template.ts |
| 7 | Del patch diff med ALPHA for godkendelse | Del patch diff |
| 8 | Deploy staging → prod via patch window | Deploy staging → prod |

Escalation: Hvis P1 eskalerer til P0, opdater Slack og brug P0 playbook.

---

## 3. Patch Execution Window Procedure

1. **Declare vinduet** i #intel24-war-room (start/slut + ansvarlig).
2. **Snapshot miljø**: `pm2 save`, noter build hash, kopiér relevant log-udsnit.
3. **Apply patch** via hurtig branch (ingen rebase midt i vindue).
4. **Sanity tests**: `npx tsx war-room/sanity-test-template.ts --plan current` (just-in-time checkliste).
5. **Sign-off**: Intel24 lead + ALPHA QA lead bekræfter i Slack.
6. **Roll-forward/rollback**: hold `war-room/rollback-quick.ts` klar hvis metrics falder.

---

## 4. Kommunikationstiming TS24 ↔ ALPHA

- **Pre-patch briefing**: 5 min før kodeændring.
- **During patch**: status ping hver 10. min (eller ved milepæle).
- **Post-patch**: straks efter sanity-tests + igen efter 15 min overvågning.
- **Escalations**: brug "ALPHA-PRIORITY" prefix for P0 updates.
- **Evidence sharing**: pastebin logs + `qa-parse` output sammen med notifikation.

---

## 5. Pre-deploy Review Steps

1. Diff-scan kun mod berørte filer (se liste nederst).
2. Kør `npm test -- --runInBand` for targeted suites hvor muligt.
3. Manuelt review af cookie-headers i `server/app.ts` hvis touched.
4. Sikr at `WAR_ROOM_STAGE2.md` trin er fulgt og referencet i PR description.
5. Få ekspres-review fra mindst én Intel24 maintainer (Slack 👍 tæller midlertidigt).

---

## 6. Emergency Test Commands

```bash
# Token og login sanity
curl -I "$QA_BASE_URL/sso-login?sso=<JWT>"
curl -H "Authorization: Bearer <JWT>" "$QA_BASE_URL/api/auth/verify"

# Infrastruktur
curl -s "$QA_BASE_URL/api/health" | jq
curl -I "$QA_BASE_URL/" | grep -i set-cookie

# Network edge
tracert intel24.blackbox.codes
nslookup intel24.blackbox.codes
```

---

## 7. Filer der MÅ ændres (P0/P1)

- `server/app.ts`, `server/index.ts`, `server/monitoring.ts`
- `server/crypto.ts`, `server/accessRequestsStorage.ts` (kun hvis root cause)
- `src/domains/auth/**/*`, `src/components/Auth/**/*`
- `src/config/navigation.ts`, `src/App.tsx`
- `scripts/qa-parse.ts`, `scripts/qa-monitor.ts`, `scripts/war-room-watchdog.ts`
- Nye filer i `war-room/` mappen (tooling/tests)

## 8. Filer der IKKE må røres under QA

- `src/components/*` udenfor Auth/Dashboard critical path
- `shared/`, `theme/`, `docs/` (undtagen dieser Stage docs)
- `package.json` dependencies (ingen bump)
- `vite.config.ts`, `tsconfig*.json`, build chain
- Alle assets/grafik

---

## 9. Quick Reference

- Stage 2 aktiveres først når ALPHA udsender "QA RUN — ROUND 1 RESULTS" med handlinger.
- Indtil da: fortsæt passive monitorer og hold patch kit opdateret.
- Ved spørgsmål: ping @Intel24-WAR-LEAD på Slack.
