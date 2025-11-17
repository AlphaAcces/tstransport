Environment variables

- `VITE_GEMINI_API_KEY`: Your Google Gemini API key. For production deployments, store secrets on a backend service instead of exposing them in the client.

Local setup options:

- Create a `.env.local` file in the project root and add the key (do NOT commit this file):

  `VITE_GEMINI_API_KEY=AIza...`

- PowerShell one-liner to create `.env.local` (replace the placeholder with the real key):

  ```powershell
  Set-Content -Path .env.local -Value "VITE_GEMINI_API_KEY=your-gemini-key-here" -Encoding UTF8
  ```

Notes:

- `.env.example` is provided as a template. Copy it to `.env.local` and fill in real values.
- Never commit `.env.local` or other files that contain secrets.
