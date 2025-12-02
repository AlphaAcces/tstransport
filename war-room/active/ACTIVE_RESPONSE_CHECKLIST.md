# Intel24 Active Response Checklist (Stage 3 Standby)

## P0 Hotfix Flow (≤5 min)

1. Receive "ALPHA PATCH OK" with P0 tag.
2. Freeze external deploys (announce in #intel24-deploy).
3. Run `npx tsx war-room/active/pre-patch-diagnose.ts` and capture monitor/watchdog snapshots.
4. Branch: `git checkout -b hotfix/p0-<incident>` from `main`.
5. Apply minimal patch (token/cookie/routing only) and self-review diff.
6. Execute `npx tsx war-room/active/validate-hotfix.ts --suite critical` (read-only guidance).
7. Fill `war-room/patch-announcement-template.md` and post to ALPHA.
8. Deploy via PM2 reload (see redeploy steps) and monitor 15 min.

## P1 Hotfix Flow (≤15 min)

1. Confirm ALPHA severity = P1.
2. Analyze logs via `war-room/active/commands/diagnose.sh`.
3. Branch `git checkout -b hotfix/p1-<ticket>`.
4. Limit scope to single module; run targeted tests per checklist.
5. Use `run-p1-hotfix.ts` template for remaining steps.
6. Announce patch plan and proceed with redeploy + monitoring window (30 min).

## Pre-Patch Validation

- Monitor snapshot: `npm run qa:monitor -- --burst 3`.
- Watchdog snapshot: `npm run qa:watchdog -- --duration 60`.
- QA input: `npx tsx scripts/qa-parse.ts --stdin < alpha-report.json`.
- Confirm no outstanding incidents logged in `war-room/logs/`.

## Post-Patch Sanity Test

- `npx tsx war-room/active/validate-hotfix.ts --suite critical`.
- `npx tsx war-room/sanity-test-template.ts --plan default`.
- Manual login with ALPHA JWT (record HAR + cookie state).
- Ensure watchdog reports no new anomalies for 15 min.

## Redeploy Steps (Zero-Downtime via PM2 reload)

1. `pm2 list` (verify process id).
2. `pm2 reload intel24-console` (keeps existing connections alive).
3. `pm2 logs intel24-console --lines 50` to confirm healthy boot.
4. If frontend assets touched, run `npm run build` before reload.

## Confirmation Signals to ALPHA

- Pre-patch: share announcement template with ETA + owner.
- Deploy start: "Deploying now" + expected duration.
- Post-patch: send sanity test summary + watchdog snippet.
- Closure: confirm SLA met and reference log entry.

## Rollback (<30s Strategy)

1. `pm2 save` snapshot before patch.
2. Keep previous build artifacts zipped.
3. To rollback: `git checkout <previous-tag>`, redeploy, `pm2 reload intel24-console`.
4. Rerun sanity tests; notify ALPHA with rollback confirmation.
