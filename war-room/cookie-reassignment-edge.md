# Cookie Reassignment Edge Cases

## Indicators

- `cookie-integrity` alerts from watchdog
- Session cookie value changes length mid-redirect
- Users kicked back to `/login` after first dashboard paint

## Checklist

1. Run `bash war-room/active/refresh-session-cookie.sh` with ALPHA JWT.
2. Compare `Set-Cookie` header between initial `/sso-login` and final `/`.
3. Verify `SameSite=None` persists throughout chain.
4. Inspect NGINX config for `proxy_cookie_path` or rewrite rules.
5. Ensure no client-side script writes to `document.cookie` for `ts24_sso_session`.

## Notes

- Cookie reassignment often signals conflicting domains or path scoping.
- Document exact header differences before planning a patch.
