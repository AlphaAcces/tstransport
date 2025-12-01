# P0/P1 Hotfix Checklist

**Purpose:** Rapid response checklist for critical SSO issues during QA.

---

## ⏱️ 20-Minute Window Timeline

```text
Time    Action
─────   ────────────────────────────────────────────────────────
0:00    Issue reported → ACKNOWLEDGE
0:02    Triage: Confirm P0/P1 severity
0:03    Start qa:monitor if not running
0:05    Identify root cause category
0:07    Create hotfix branch
0:10    Implement minimal fix
0:13    Run local tests
0:15    Create PR + request expedited review
0:17    Merge after approval
0:19    Deploy to staging
0:20    Notify QA for re-verification
```

---

## 📋 Pre-Flight Checklist

Before starting hotfix:

- [ ] Issue acknowledged in #ts24-qa
- [ ] Severity confirmed (P0/P1)
- [ ] `npm run qa:monitor` running
- [ ] Server logs accessible: `pm2 logs ts24-server`
- [ ] On correct branch: `feature/qa-release-prep`
- [ ] Local environment up to date: `git pull`

---

## 🔧 Hotfix Creation Checklist

### Step 1: Create Branch

```bash
git checkout feature/qa-release-prep
git pull origin feature/qa-release-prep
git checkout -b hotfix/sso-<issue>-<description>
```

- [ ] Branch created from latest feature/qa-release-prep
- [ ] Branch name follows convention: `hotfix/sso-XXX-description`

### Step 2: Identify Root Cause

Run diagnostics:

```bash
# Check recent errors
pm2 logs ts24-server --lines 100 | grep -i error

# Check SSO metrics
curl -s https://intel24.blackbox.codes/api/health | jq

# Check specific endpoint
curl -v https://intel24.blackbox.codes/api/auth/verify \
  -H "Authorization: Bearer <token>"
```

- [ ] Root cause identified
- [ ] Affected files identified
- [ ] Fix approach determined

### Step 3: Implement Fix

- [ ] Minimal change (no refactoring)
- [ ] No new dependencies
- [ ] No breaking API changes
- [ ] Comments added explaining fix

### Step 4: Test Locally

```bash
# Run all tests
npm test -- --run

# Run SSO-specific tests
npm test -- --run sso

# Run E2E smoke
npm run test:sso-smoke

# Lint check
npm run lint

# Build check
npm run build
```

- [ ] All tests pass
- [ ] No lint errors
- [ ] Build succeeds

### Step 5: Create PR

- [ ] PR title: `fix(sso): [P0/P1] <description>`
- [ ] PR description includes:
  - Root cause
  - Fix applied
  - Testing performed
  - Rollback plan
- [ ] Request expedited review

### Step 6: Merge & Deploy

- [ ] At least 1 approval received
- [ ] CI checks pass
- [ ] Merged to feature/qa-release-prep
- [ ] Deployed to staging:

```bash
# On server
cd /var/www/ts24
git fetch origin
git checkout feature/qa-release-prep
git pull
npm ci
npm run build
pm2 restart ts24-server
```

- [ ] Deployment verified with health check

### Step 7: Notify & Verify

- [ ] Posted deployment confirmation in #ts24-qa
- [ ] QA team notified for re-verification
- [ ] Monitoring active for regression

---

## 🔴 Emergency Debug Commands

### Server-Side Diagnostics

```bash
# Check server status
pm2 status

# View recent logs
pm2 logs ts24-server --lines 200

# Filter for SSO errors
pm2 logs ts24-server | grep -E "(sso|SSO|token|Token|cookie|Cookie)"

# Check process memory/CPU
pm2 monit

# Restart server (if needed)
pm2 restart ts24-server
```

### Endpoint Testing

```bash
# Health check
curl -s https://intel24.blackbox.codes/api/health | jq

# SSO login (expect 302 or 400)
curl -v "https://intel24.blackbox.codes/sso-login?sso=test"

# Verify endpoint (expect 401 without token)
curl -v https://intel24.blackbox.codes/api/auth/verify

# Verify with token
curl -v https://intel24.blackbox.codes/api/auth/verify \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Cookie Inspection

```bash
# Check Set-Cookie header
curl -v "https://intel24.blackbox.codes/sso-login?sso=<token>" 2>&1 | grep -i cookie
```

### Generate Test JWT (Development Only)

```bash
# Use dev mint script
npm run dev:mint-token -- --user AlphaGrey --exp 1h
```

---

## 📁 SSO-Related Files Reference

Files most likely to be involved in SSO issues:

### Server-Side

| File | Purpose | Common Issues |
|------|---------|---------------|
| `server/ssoAuth.ts` | JWT verification | Signature, expiry, claims |
| `server/app.ts` | Express routes | Routing, middleware |
| `server/index.ts` | Server entry | Port, startup |
| `server/qaSignals.ts` | QA logging | Signal hooks |

### Client-Side

| File | Purpose | Common Issues |
|------|---------|---------------|
| `src/domains/auth/ssoBackend.ts` | Backend SSO client | API calls, cookie read |
| `src/domains/auth/qaSignals.ts` | QA logging (client) | Signal hooks |
| `src/components/Auth/SsoLoginPage.tsx` | SSO login UI | Redirect handling |
| `src/components/Auth/SsoErrorDisplay.tsx` | Error display | Error messages |
| `src/components/Auth/LoginPage.tsx` | Login page | Error banner |
| `src/App.tsx` | App root | Session verification |

### Configuration

| File | Purpose |
|------|---------|
| `shared/ssoMetrics.ts` | SSO metrics tracking |
| `.env` / `.env.production` | Environment secrets |

### Tests

| File | Purpose |
|------|---------|
| `server/__tests__/ssoAuthApi.test.ts` | Server SSO tests |
| `src/components/Auth/__tests__/SsoLoginFlow.test.ts` | Client SSO tests |
| `e2e/sso-backend.spec.ts` | E2E SSO tests |
| `e2e/sso-smoke.spec.ts` | Smoke tests |

---

## 🔄 Quick Reference: Error → Fix Location

| Error Pattern | Likely File | Likely Cause |
|---------------|-------------|--------------|
| `TOKEN_INVALID` | `server/ssoAuth.ts` | Signature verification |
| `TOKEN_EXPIRED` | `server/ssoAuth.ts` | Expiry check |
| `TOKEN_MISSING` | `server/app.ts` | Request parsing |
| `TOKEN_UNKNOWN_AGENT` | `server/ssoAuth.ts` | User lookup |
| Cookie not set | `server/app.ts` | Set-Cookie header |
| Cookie not read | `src/domains/auth/ssoBackend.ts` | Cookie parsing |
| Redirect loop | `src/App.tsx` | Session check |
| 500 on /sso-login | `server/app.ts` | Route handler |
| Network error | Client network | CORS, DNS |

---

## ✅ Post-Fix Verification

After deploying fix:

- [ ] `npm run qa:monitor` shows all endpoints green
- [ ] No new errors in `pm2 logs`
- [ ] Manual test of affected flow passes
- [ ] QA team confirms fix
- [ ] Issue closed in #ts24-qa
