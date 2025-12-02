# TS24 SSO Flow Diagram (Textual)

```text
ALPHA IdP (JWT) --> /sso-login --> server/app.ts verifies token
                                   |
                                   | valid ?
                                   v
                          set-cookie ts24_sso_session
                                   |
                                   v
                           redirect -> /
                                   |
                                   v
                        SPA boot -> verify endpoint
                                   |
                                   v
                         dashboard rendered
```

## Legend

- Tokens signed by ALPHA → validated via `server/crypto.ts` + `server/app.ts`.
- Cookie `ts24_sso_session` issued HttpOnly/Secure/SameSite=None.
- Frontend hits `/api/auth/verify` to fetch profile + roles.
- Errors redirect back to `/login?ssoFailed=true`.
