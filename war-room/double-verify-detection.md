# Double Verify Detection

## What to Watch

- Two `/api/auth/verify` calls triggered per page load
- Mixed 200/401 responses for same JWT in `qa-monitor` logs
- Watchdog `verify-flow` + `verify-error` alerts in the same minute

## Investigation Flow

1. Run `npm run qa:monitor -- --burst 5 --verbose` and export logs.
2. Use `grep -n "SSO Verify" monitor.log` to identify overlapping timestamps.
3. Inspect frontend network tab to ensure single `useEffect` is responsible.
4. Check `src/domains/auth/*` for duplicate `verifySession()` invocations.
5. Validate server logs for rate limiting or header parsing anomalies.

## Documentation

- Record findings in `war-room/logs/<incident>.md`.
- Update P0/P1 patch templates with whether issue is TOKEN_FLOW or COOKIE_FLOW.
