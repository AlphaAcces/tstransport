# Environment Variables

## Client-side (Vite)

- `VITE_GEMINI_API_KEY`: Your Google Gemini API key. For production deployments, store secrets on a backend service instead of exposing them in the client.

## Server-side (SSO)

- `SSO_JWT_SECRET`: Shared secret for SSO JWT verification (HS256). Required for SSO integration with ALPHA-Interface-GUI.
  - **Length:** 256-bit (64 hex characters)
  - **Algorithm:** HS256
  - **Source:** Provided by ALPHA Team via secure channel

## Local Setup

Create a `.env.local` file in the project root and add the keys (do NOT commit this file):

```
VITE_GEMINI_API_KEY=AIza...
SSO_JWT_SECRET=<256-bit-hex-secret>
```

PowerShell one-liner to create `.env.local` (replace placeholders with real keys):

```powershell
Set-Content -Path .env.local -Value "VITE_GEMINI_API_KEY=your-gemini-key-here`nSSO_JWT_SECRET=your-sso-secret-here" -Encoding UTF8
```

## Notes

- `.env.example` is provided as a template. Copy it to `.env.local` and fill in real values.
- Never commit `.env.local` or other files that contain secrets.
- For production: Set `SSO_JWT_SECRET` via environment variable or secrets manager.
