# Intel24 Cookie Integrity Check

## Goal

Validér at `ts24_sso_session` bliver sat, forseglet og videresendt gennem hele redirect-kæden uden mutation.

## Steps

1. `curl -I "$QA_BASE_URL/sso-login?sso=<JWT>" -v | grep -i set-cookie`
2. Sørg for at `HttpOnly`, `Secure`, `SameSite=None` er til stede.
3. Gentag med `--location-trusted` for at følge redirect og sikre, at cookien ikke overskrives.
4. Åbn browser devtools → Application → Cookies og kontroller TTL samt path.
5. Brug `npm run qa:watchdog` og filtrer `session-cookie` logs for `cookiePresent: true`.
6. Dokumentér afvigelser i WAR ROOM logbogen før nogen kodeændring.

## Red Flags

- Manglende `Secure` flag
- Cookie ændrer længde/algoritme efter redirect
- Flere `Set-Cookie` headere for samme navn i én response
