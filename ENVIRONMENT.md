# Environment Configuration

This document describes the environment variables used by TS24 Intel Console for JWT authentication, SSO integration, AI features, and server configuration.

## Quick Start

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Configure the JWT secret for SSO:
   ```bash
   # Generate a strong secret
   openssl rand -base64 32
   
   # Add to .env.local
   VITE_SSO_JWT_SECRET=<generated-secret>
   SSO_JWT_SECRET=<same-secret>
   ```

3. Never commit `.env.local` or files containing real secrets to version control.

---

## JWT / SSO Configuration

### `VITE_SSO_JWT_SECRET` (Required for SSO)

**Purpose:** Shared secret for JWT token verification using HS256 algorithm.

**Requirements:**
- Must match the secret used by ALPHA-Interface-GUI for token generation
- Both client (Vite) and server (Node) need access to this value
- Minimum 32 characters recommended for production

**Generate a secret:**
```bash
openssl rand -base64 32
```

**Usage:**
- Client-side JWT verification in `src/domains/auth/sso.ts`
- SSO health checks in `server/app.ts`
- Token minting in development scripts

**Example:**
```env
VITE_SSO_JWT_SECRET=your-shared-secret-here
```

### `SSO_JWT_SECRET` (Alias)

**Purpose:** Alternative environment variable name for server-side compatibility.

**Requirements:**
- Should have the same value as `VITE_SSO_JWT_SECRET`
- Used by server endpoints for health checks
- Required for E2E tests and token minting scripts

**Example:**
```env
SSO_JWT_SECRET=your-shared-secret-here
```

### `TS24_SSO_HEALTH_PROTECTED`

**Purpose:** Enable protection for the `/api/auth/sso-health` endpoint.

**Values:**
- `true` - Requires `X-SSO-Health-Key` header (production)
- `false` - Open endpoint (development/staging)

**Default:** `false` (or enabled when `NODE_ENV=production`)

**Example:**
```env
TS24_SSO_HEALTH_PROTECTED=true
```

### `TS24_SSO_HEALTH_KEY`

**Purpose:** Secret key for accessing the protected SSO health endpoint.

**Requirements:**
- Required when `TS24_SSO_HEALTH_PROTECTED=true`
- Must be provided in `X-SSO-Health-Key` header
- Generate a unique key for production

**Generate a key:**
```bash
openssl rand -hex 32
```

**Example:**
```env
TS24_SSO_HEALTH_KEY=your-health-check-key-here
```

---

## JWT Implementation Details

### Algorithm: HS256 (Symmetric)

The TS24 Intel Console uses **HS256** (HMAC with SHA-256) for JWT token signing and verification. This is a **symmetric algorithm** that uses a shared secret.

**Key points:**
- **No public/private key pair** - HS256 uses a single shared secret
- Both the token issuer (ALPHA-Interface-GUI) and verifier (TS24) must have the same secret
- The secret is used for both signing and verification
- Simpler than RS256 but requires careful secret management

### Why not RS256?

RS256 (asymmetric) uses public/private key pairs where:
- Private key signs tokens (issuer only)
- Public key verifies tokens (can be distributed)

HS256 was chosen for v1 because:
- Simpler configuration (one secret vs key pair)
- Lower overhead for token operations
- Sufficient security when secrets are properly managed
- Aligns with current ALPHA-Interface-GUI implementation

**Note:** If the problem statement mentions `JWT_PUBLIC_KEY`, this refers to RS256. The current implementation uses HS256 and only requires `VITE_SSO_JWT_SECRET`.

### Token Verification Flow

```text
ALPHA-Interface-GUI                    TS24 Intel Console
─────────────────────                  ──────────────────
1. User logs into GDI
2. Generate JWT with                   
   HS256 + shared secret              
3. Redirect to:                        4. Receive token via URL
   /sso-login?sso=<JWT>               5. Verify JWT signature
                                         using shared secret
                                      6. Check exp, iss, aud
                                      7. Extract user claims
                                      8. Create session
                                      9. Redirect to dashboard
```

### Verify Configuration

**Check JWT secret is configured:**
```bash
# Development
curl http://localhost:4001/api/auth/sso-health | jq

# Production (with health key)
curl -H "X-SSO-Health-Key: your-key" https://intel24.blackbox.codes/api/auth/sso-health | jq
```

**Expected response:**
```json
{
  "expectedIss": "ts24-intel",
  "expectedAud": "ts24-intel",
  "secretConfigured": true,
  "usesHS256": true,
  "configVersion": "v1",
  "recentErrors": {
    "invalidSignature": 0,
    "expired": 0,
    "malformed": 0,
    "unknownAgent": 0
  }
}
```

---

## AI Configuration (Optional)

### `AI_KEY_MASTER`

**Purpose:** Master encryption key for tenant-scoped AI keys stored in the system.

**Requirements:**
- Base64-encoded 32-byte key
- Used for AES-256-GCM encryption/decryption
- Required if tenants will store their own AI API keys

**Generate a key:**
```bash
openssl rand -base64 32
```

**Example:**
```env
AI_KEY_MASTER=your-base64-encoded-32-byte-key
```

### `VITE_GEMINI_API_KEY`

**Purpose:** Google Gemini API key for AI features.

**Requirements:**
- Optional - only needed if using AI analysis features
- Get your key from https://ai.google.dev/

**Security Note:** For production, store AI keys on the backend instead of exposing them in the client.

**Example:**
```env
VITE_GEMINI_API_KEY=AIza...
```

---

## Server Configuration

### `PORT`

**Purpose:** Port number for the Express API server.

**Default:** `4001`

**Example:**
```env
PORT=4001
```

### `NODE_ENV`

**Purpose:** Runtime environment mode.

**Values:**
- `development` - Local development
- `production` - Production deployment
- `test` - Test environment

**Impact:**
- Enables/disables debug logging
- Controls SSO health endpoint protection
- Affects error handling and stack traces

**Example:**
```env
NODE_ENV=production
```

### `DEFAULT_PUBLIC_TENANT_ID`

**Purpose:** Default tenant ID for public access requests (pre-authentication).

**Default:** `tenant-001`

**Example:**
```env
DEFAULT_PUBLIC_TENANT_ID=tenant-001
```

---

## Application Configuration

### `VITE_API_URL`

**Purpose:** Base URL for API endpoints.

**Default:** `/api`

**Example:**
```env
VITE_API_URL=/api
```

---

## Development Setup

### Local Development

```bash
# 1. Copy environment template
cp .env.example .env.local

# 2. Set a test JWT secret
echo "VITE_SSO_JWT_SECRET=dev-shared-secret" >> .env.local
echo "SSO_JWT_SECRET=dev-shared-secret" >> .env.local

# 3. Install dependencies
npm install

# 4. Start development server (client)
npm run dev

# 5. Start API server (in another terminal)
npx tsx server/index.ts
```

### Testing SSO Flow

```bash
# 1. Ensure JWT secret is set
export VITE_SSO_JWT_SECRET=dev-shared-secret
export SSO_JWT_SECRET=dev-shared-secret

# 2. Mint a test token
node scripts/dev-mint-sso-token.mjs AlphaGrey admin "Alpha Grey"

# 3. Copy the token and visit:
# http://localhost:5173/sso-login?sso=<token>

# 4. Run E2E SSO smoke test
npm run test:sso-smoke
```

### Testing with ALPHA-Interface-GUI

Ensure both systems use the **same JWT secret**:

**TS24 (.env.local):**
```env
VITE_SSO_JWT_SECRET=shared-secret-123
SSO_JWT_SECRET=shared-secret-123
```

**ALPHA (env.php):**
```php
$config['sso_jwt_secret'] = 'shared-secret-123';
```

---

## Security Best Practices

1. **Never commit secrets:**
   - Add `.env.local` to `.gitignore`
   - Use `.env.example` as a template only
   - Rotate secrets if accidentally exposed

2. **Generate strong secrets:**
   ```bash
   # For JWT secrets (32+ bytes)
   openssl rand -base64 32
   
   # For health keys (32+ bytes)
   openssl rand -hex 32
   
   # For encryption keys (exactly 32 bytes)
   openssl rand -base64 32
   ```

3. **Use different secrets per environment:**
   - Development: Simple test values
   - Staging: Strong secrets, different from prod
   - Production: Cryptographically strong secrets

4. **Protect health endpoints:**
   - Enable `TS24_SSO_HEALTH_PROTECTED=true` in production
   - Share health key only with ops team
   - Monitor health endpoint access logs

5. **Secure secret storage:**
   - Use environment variables (not hardcoded)
   - Consider secret management services (AWS Secrets Manager, etc.)
   - Limit access to production secrets

---

## Troubleshooting

### SSO Token Verification Fails

**Symptom:** "SSO token signature invalid" error

**Solution:**
1. Verify both systems use the same secret:
   ```bash
   # TS24
   echo $VITE_SSO_JWT_SECRET
   
   # ALPHA
   grep sso_jwt_secret env.php
   ```

2. Check the secret is properly set:
   ```bash
   # Check environment variable
   echo $VITE_SSO_JWT_SECRET
   ```

### Health Endpoint Returns 403

**Symptom:** `/api/auth/sso-health` returns forbidden

**Solution:**
1. Check if protection is enabled:
   ```bash
   echo $TS24_SSO_HEALTH_PROTECTED
   echo $NODE_ENV
   ```

2. Include health key in request:
   ```bash
   curl -H "X-SSO-Health-Key: your-key" http://localhost:4001/api/auth/sso-health
   ```

### Secret Not Configured

**Symptom:** `secretConfigured: false` in health response

**Solution:**
1. Ensure variable is set in environment:
   ```bash
   echo $VITE_SSO_JWT_SECRET
   echo $SSO_JWT_SECRET
   ```

2. For Vite, restart the dev server after changing `.env.local`

3. For server, check environment variables:
   ```bash
   npx tsx server/index.ts
   ```

---

## References

- [JWT Specification (RFC 7519)](https://tools.ietf.org/html/rfc7519)
- [jose Library Documentation](https://github.com/panva/jose)
- [TS24 Login Flow](./docs/ts24_login_flow.md)
- [SSO v1 Sign-off](./docs/sso_v1_signoff_ts24.md)
