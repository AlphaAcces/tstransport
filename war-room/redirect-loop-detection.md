# Redirect Loop Detection Guide

## Symptoms

- Browser address bar flickers between `/login` and `/sso-login`
- Watchdog `routing-flow` alerts fire repeatedly
- Browser devtools shows >5 sequential 302 responses without landing on `/`

## Steps

1. Capture HAR file during failing login.
2. Run `grep -n "location" har.json` to inspect redirect chain.
3. Confirm that `ts24_sso_session` cookie is present before redirect to `/`.
4. Use `npx tsx war-room/active/pre-patch-diagnose.ts` to log incident.
5. If SPA router is involved, open browser console and run `window.history.length` to detect loops.

## Mitigation Notes

- Check `server/app.ts` for duplicated redirects.
- Ensure React Router does not auto-redirect when already on destination.
- Document findings in incident ledger before touching code.
