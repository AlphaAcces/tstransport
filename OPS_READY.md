# TS24 Ops Ready – Deployment Greenlight

**Status:** ✅ READY FOR PRODUCTION  
**Last Updated:** 1 Dec 2025  
**SSO Version:** v1.1 (Backend Bridge)  
**Tests:** 411/411 passing

---

## 🎯 Quick Reference

| Endpoint | URL | Expected |
|----------|-----|----------|
| Health Check | `https://intel24.blackbox.codes/api/health` | 200 OK |
| SSO Login | `https://intel24.blackbox.codes/sso-login?sso=<JWT>` | 302 → `/` |
| Manual Login | `https://intel24.blackbox.codes/login` | 200 OK |
| SSO Health | `https://intel24.blackbox.codes/api/auth/sso-health` | 200 OK (med key) |
| SSO Verify | `https://intel24.blackbox.codes/api/auth/verify` | 200/401 |

---

## 📋 Deployment Krav

### System Requirements

- **Node.js:** ≥16 (18 LTS anbefalet)
- **npm:** ≥8
- **OS:** Ubuntu 22.04 LTS / Debian 12 / RHEL 8+
- **RAM:** ≥512 MB (1 GB anbefalet)
- **Disk:** ≥500 MB (inkl. node_modules + build)

### Network Requirements

- Port 3001 (eller custom `PORT`) åben internt
- Port 80/443 åben eksternt (via nginx)
- Outbound HTTPS til eventuelt AI-API (valgfrit)

---

## 🔐 Miljøvariabler

### Påkrævede (Produktion)

```bash
# SSO shared secret (SKAL matche ALPHA-GUI)
VITE_SSO_JWT_SECRET=<base64-encoded-32-byte-secret>
# Alternativt:
SSO_JWT_SECRET=<base64-encoded-32-byte-secret>

# Node environment
NODE_ENV=production

# Server port
PORT=3001
```

### Valgfrie

```bash
# AI Key encryption master key (for tenant AI keys)
AI_KEY_MASTER=<base64-encoded-32-byte-key>

# SSO Health endpoint protection
TS24_SSO_HEALTH_PROTECTED=true
TS24_SSO_HEALTH_KEY=<random-health-key>

# Custom client build directory
TS24_CLIENT_DIST=./dist

# Default tenant for public access requests
DEFAULT_PUBLIC_TENANT_ID=tenant-001
```

### Environment File Setup

```bash
# Opret .env fil på serveren
cat > /opt/ts24-intel-console/.env << 'EOF'
NODE_ENV=production
PORT=3001
VITE_SSO_JWT_SECRET=<YOUR_SHARED_SECRET>
AI_KEY_MASTER=<YOUR_AI_MASTER_KEY>
TS24_SSO_HEALTH_PROTECTED=true
TS24_SSO_HEALTH_KEY=<YOUR_HEALTH_KEY>
EOF

chmod 600 /opt/ts24-intel-console/.env
```

---

## 🚀 Build Steps

### 1. Clone & Install

```bash
cd /opt
git clone https://github.com/AlphaAcces/ts24-intel-console.git
cd ts24-intel-console
npm ci --production=false  # Include devDependencies for build
```

### 2. Build Client

```bash
npm run build
# Output: ./dist/ (Vite SPA bundle)
```

### 3. Verify Build

```bash
ls -la dist/
# Skal indeholde: index.html, assets/
```

### 4. Run Tests (CI/CD)

```bash
npm test -- --run        # Unit tests (411 tests)
npm run lint             # ESLint check
```

---

## ⚙️ PM2 Setup

### Install PM2

```bash
npm install -g pm2
```

### PM2 Ecosystem File

Brug den medfølgende config:

```bash
pm2 start deploy/pm2.config.cjs
```

Eller opret manuelt:

```bash
cat > /opt/ts24-intel-console/ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'ts24-intel-console',
    script: 'server/index.ts',
    interpreter: 'node_modules/.bin/tsx',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    max_restarts: 5,
    restart_delay: 2000,
    error_file: '/var/log/ts24/error.log',
    out_file: '/var/log/ts24/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],
};
EOF

pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # Følg instruktionerne for auto-start
```

### PM2 Commands

```bash
pm2 status               # Check process status
pm2 logs ts24-intel-console  # View logs
pm2 restart ts24-intel-console  # Restart
pm2 reload ts24-intel-console   # Zero-downtime reload
```

---

## 🌐 NGINX Setup

### Install NGINX

```bash
sudo apt install nginx
```

### Site Configuration

```bash
sudo cp deploy/nginx-intel24.conf /etc/nginx/sites-available/intel24.blackbox.codes
sudo ln -s /etc/nginx/sites-available/intel24.blackbox.codes /etc/nginx/sites-enabled/
```

Eller opret manuelt:

```nginx
# /etc/nginx/sites-available/intel24.blackbox.codes
server {
    listen 80;
    listen [::]:80;
    server_name intel24.blackbox.codes;

    # Redirect HTTP to HTTPS (hvis Cloudflare håndterer TLS)
    # Ellers: certbot --nginx -d intel24.blackbox.codes

    # Trust Cloudflare IP headers
    real_ip_header CF-Connecting-IP;
    
    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_read_timeout 60s;
    }

    # SSO login (server-side handler)
    location /sso-login {
        proxy_pass http://127.0.0.1:3001/sso-login;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Manual login
    location /login {
        proxy_pass http://127.0.0.1:3001/login;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA fallback
    location / {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Test & Reload

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🏥 Health Checks

### 1. Public Health (No Auth)

```bash
curl -s https://intel24.blackbox.codes/api/health | jq
```

**Expected Response:**

```json
{
  "service": "TS24 Intel Console",
  "status": "ok",
  "timestamp": "2025-12-01T14:00:00.000Z",
  "version": "dev"
}
```

### 2. SSO Health (Protected)

```bash
curl -s -H "x-sso-health-key: <YOUR_KEY>" \
  https://intel24.blackbox.codes/api/auth/sso-health | jq
```

**Expected Response:**

```json
{
  "expectedIss": "ts24-intel",
  "expectedAud": "ts24-intel",
  "secretConfigured": true,
  "usesHS256": true,
  "configVersion": "v1"
}
```

### 3. Monitoring Script

```bash
#!/bin/bash
# health-check.sh
HEALTH_URL="https://intel24.blackbox.codes/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$RESPONSE" != "200" ]; then
  echo "ALERT: TS24 health check failed (HTTP $RESPONSE)"
  # Send alert (Slack, email, etc.)
  exit 1
fi
echo "OK: TS24 health check passed"
```

---

## 🔐 SSO Verify Flow i Drift

### Flow Diagram

```text
ALPHA-GUI                    TS24 Server                 TS24 Client
    │                            │                            │
    │ 1. User clicks SSO         │                            │
    │────────────────────────────>                            │
    │                            │                            │
    │ 2. Generate JWT + redirect │                            │
    │ GET /sso-login?sso=<JWT>   │                            │
    │────────────────────────────>                            │
    │                            │                            │
    │                 3. Verify token (HS256)                 │
    │                 4. Check iss/aud/exp                    │
    │                 5. Lookup known user                    │
    │                            │                            │
    │                 ┌──────────┴──────────┐                 │
    │                 │                     │                 │
    │         [Valid Token]          [Invalid Token]          │
    │                 │                     │                 │
    │         6a. Set cookie        6b. Redirect              │
    │         7a. Redirect /        → /login?ssoFailed=true   │
    │                 │                     │                 │
    │                 └──────────┬──────────┘                 │
    │                            │                            │
    │<───────────────────────────│                            │
    │                            │                            │
    │                            │   8. Read cookie           │
    │                            │   9. Show dashboard        │
    │                            │<───────────────────────────│
```

### API Verify (GDI Preflight)

```bash
# Test token verification endpoint
curl -X GET \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  https://intel24.blackbox.codes/api/auth/verify
```

**Success (200):**

```json
{
  "status": "ok",
  "ts": 1733061600000,
  "ts24_user_id": "AlphaGrey",
  "role": "admin",
  "tenant": "tsl"
}
```

**Error (401):**

```json
{
  "status": "error",
  "error": "TOKEN_EXPIRED"
}
```

### Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `TOKEN_MISSING` | No token provided | Redirect to login |
| `TOKEN_INVALID` | Malformed/tampered | Show error, log attempt |
| `TOKEN_EXPIRED` | TTL exceeded | Prompt re-login |
| `TOKEN_ISSUER_MISMATCH` | Wrong `iss` claim | Block, alert ops |
| `TOKEN_AUDIENCE_MISMATCH` | Wrong `aud` claim | Block, alert ops |
| `TOKEN_UNKNOWN_AGENT` | User not in allowlist | Access denied |

---

## 📝 Logging & Fallback-strategi

### Log Locations

```bash
# PM2 logs
/var/log/ts24/out.log    # Application output
/var/log/ts24/error.log  # Errors

# Or via PM2
pm2 logs ts24-intel-console --lines 100
```

### Log Format

```text
[2025-12-01T14:00:00.000Z] [sso-login] SSO login successful for user: AlphaGrey (role: admin, tenant: tsl)
[2025-12-01T14:00:01.000Z] [sso-login] Token verification failed (TOKEN_EXPIRED) undefined
[2025-12-01T14:00:02.000Z] [EXPORT] tsl 2025-12-01T14:00:02.345Z
```

### Log Rotation

```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Fallback Strategy

| Scenario | Fallback |
|----------|----------|
| SSO token invalid | Redirect to `/login?ssoFailed=true` |
| Backend unreachable | Client shows "Verifying session..." then error |
| Database unavailable | Mock data fallback (development only) |
| AI service down | Graceful degradation, disable AI features |

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Health check failures | 2 consecutive | 5 consecutive |
| SSO errors/min | >10 | >50 |
| Response time (p95) | >500ms | >2000ms |
| Memory usage | >80% | >95% |

---

## ✅ Pre-Deploy Checklist

### Infrastructure

- [ ] DNS record for `intel24.blackbox.codes` → origin IP
- [ ] TLS certificate installed (or Cloudflare proxy)
- [ ] NGINX configured and tested
- [ ] PM2 ecosystem file in place
- [ ] Log directory created (`/var/log/ts24/`)

### Environment

- [ ] `.env` file created with all required variables
- [ ] `VITE_SSO_JWT_SECRET` matches ALPHA-GUI secret
- [ ] `NODE_ENV=production`
- [ ] File permissions secured (600 for .env)

### Application

- [ ] `npm ci` completed
- [ ] `npm run build` successful
- [ ] PM2 process started and healthy
- [ ] Health endpoint returns 200

### Verification

- [ ] `curl -I /api/health` → 200 OK
- [ ] `curl -I /login` → 200 OK
- [ ] `curl -I /sso-login` → 302 (no token) or 302 (with valid token → /)
- [ ] SSO health shows `secretConfigured: true`

---

## 🚦 GO/NO-GO Criteria

### GO Criteria (alle skal være opfyldt)

1. ✅ All health endpoints return 200
2. ✅ SSO health shows `secretConfigured: true`
3. ✅ Test SSO login with valid token → dashboard
4. ✅ Test SSO login with invalid token → `/login?ssoFailed=true`
5. ✅ No TLS/SSL warnings
6. ✅ PM2 process stable for >10 min

### NO-GO Blockers

- ❌ SSO secret mismatch
- ❌ TLS certificate errors
- ❌ Health endpoint 5xx
- ❌ PM2 crash loop

---

## 📞 Kontakter

| Role | Contact |
|------|---------|
| TS24 Tech Lead | @AlphaGrey |
| ALPHA-GUI Team | @GUI-Lead |
| Ops/Infra | @Ops-Team |

---

## 🎉 Deployment Greenlight Signal

Når alle checks er grønne, send besked til ALPHA-teamet:

```
✅ TS24 → OPS READY – Deployment greenlight

Health:    https://intel24.blackbox.codes/api/health → 200 OK
SSO:       https://intel24.blackbox.codes/sso-login → Ready
Login:     https://intel24.blackbox.codes/login → 200 OK
Tests:     411/411 ✔
Build:     ✔ Pass
Lint:      ✔ Pass

Ready for:
- End-to-end chain test
- Final QA (mobile + desktop)
- Production deploy

Set TS24_CONSOLE_URL=https://intel24.blackbox.codes/sso-login
```

---

**Dokumentation:**
- [Deployment Guide](docs/deployment_guide.md)
- [SSO Sign-off](docs/sso_v1_signoff_ts24.md)
- [System Overview](docs/system_overview.md)
- [DNS & Cert Ops](docs/ts24_dns_and_cert_ops.md)
