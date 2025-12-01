# TS24 Hotfix Procedures

**Version:** 1.0
**Last Updated:** 1 Dec 2025
**Branch:** `feature/qa-release-prep`

---

## 📋 Hotfix Overview

This document outlines procedures for rapid patch deployment during QA and production.

---

## 🔀 Branch Naming Standard

```text
hotfix/sso-<issue-number>-<short-description>

Examples:
  hotfix/sso-001-token-validation
  hotfix/sso-002-cookie-expiry
  hotfix/sso-003-redirect-loop
```

### Branch Workflow

```text
main
  │
  ├── feature/qa-release-prep  (QA staging)
  │     │
  │     └── hotfix/sso-<issue>  (rapid fix)
  │           │
  │           └── PR → feature/qa-release-prep
  │
  └── (after QA approval) → merge to main
```

---

## 🔧 Patch Procedures

### 1. Create Hotfix Branch

```bash
# From feature/qa-release-prep
git checkout feature/qa-release-prep
git pull origin feature/qa-release-prep
git checkout -b hotfix/sso-<issue>-<description>
```

### 2. Implement Fix

```bash
# Make changes
# Run tests
npm test -- --run

# Run E2E if SSO-related
npm run test:sso-smoke

# Lint check
npm run lint
```

### 3. Commit with Conventional Format

```bash
git add .
git commit -m "fix(sso): <description>

- Root cause: <what caused the bug>
- Solution: <how it was fixed>
- Tested: <what was verified>

Fixes #<issue-number>"
```

### 4. Create PR to feature/qa-release-prep

```bash
git push -u origin hotfix/sso-<issue>-<description>
# Create PR on GitHub
```

### 5. Deploy After PR Merge

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

---

## 🔄 Safe Revert Procedure

### Quick Revert (Last Commit)

```bash
# Identify commit to revert
git log --oneline -5

# Revert specific commit
git revert <commit-hash> --no-edit

# Push revert
git push origin feature/qa-release-prep
```

### Full Rollback (Multiple Commits)

```bash
# Find last known good commit
git log --oneline -20

# Create rollback branch
git checkout -b rollback/pre-<feature>

# Reset to good state
git reset --hard <good-commit-hash>

# Force push (DANGEROUS - coordinate with team)
git push --force-with-lease origin feature/qa-release-prep
```

### Server Rollback

```bash
# On production server
cd /var/www/ts24

# Check current state
git log --oneline -3

# Revert to previous deployment
git checkout <previous-commit-hash>
npm ci
npm run build
pm2 restart ts24-server

# Verify
curl -s https://intel24.blackbox.codes/api/health | jq
```

---

## 🍪 Emergency Cookie Clear Procedure

When users are stuck with invalid/corrupted SSO cookies.

### Client-Side (User Instructions)

```text
1. Open browser DevTools (F12)
2. Go to Application tab → Cookies
3. Find: ts24_sso_session
4. Right-click → Delete
5. Refresh page
6. Log in again through GDI
```

### Programmatic Clear (JavaScript Console)

```javascript
// Run in browser console at intel24.blackbox.codes
document.cookie = 'ts24_sso_session=; Path=/; Max-Age=0; Secure; SameSite=Strict';
location.reload();
```

### Server-Side Force Clear

Add temporary endpoint (remove after QA):

```typescript
// server/app.ts - TEMPORARY
app.get('/api/debug/clear-session', (req, res) => {
  res.clearCookie('ts24_sso_session', {
    path: '/',
    secure: true,
    sameSite: 'strict',
  });
  res.json({ status: 'cleared', redirect: '/login' });
});
```

### Bulk Cookie Reset (All Users)

If widespread cookie corruption occurs:

1. **Change SSO_JWT_SECRET** in environment
2. All existing sessions become invalid
3. Users redirected to login on next request
4. Coordinate with ALPHA-GUI team for new JWT signing

---

## 🚀 Deploy Without Blackout

### Blue-Green Deployment

```bash
# 1. Build new version
npm run build

# 2. Start new PM2 instance on different port
PORT=3002 pm2 start deploy/pm2.config.cjs --name ts24-server-new

# 3. Verify new instance
curl -s http://localhost:3002/api/health

# 4. Update NGINX upstream
sudo vim /etc/nginx/conf.d/intel24.conf
# Change: proxy_pass http://127.0.0.1:3002

# 5. Reload NGINX (zero downtime)
sudo nginx -t && sudo nginx -s reload

# 6. Stop old instance
pm2 stop ts24-server
pm2 delete ts24-server

# 7. Rename new instance
pm2 restart ts24-server-new --name ts24-server
```

### Rolling Restart

```bash
# Graceful restart with PM2
pm2 reload ts24-server --update-env

# This waits for current requests to complete
# before switching to new instance
```

### Instant Hotfix (No Build)

For critical JavaScript-only fixes:

```bash
# 1. Apply fix to source
# 2. Build only changed files
npm run build

# 3. Copy static assets
cp -r dist/* /var/www/ts24/dist/

# 4. Clear CDN cache if applicable
# curl -X PURGE https://intel24.blackbox.codes/...

# 5. PM2 restart not needed for static files
```

---

## ⏱️ Response Time SLAs

| Severity | Description | Response Time | Resolution Time |
|----------|-------------|---------------|-----------------|
| **P0** | SSO completely broken | < 5 min | < 20 min |
| **P1** | SSO degraded (some users) | < 15 min | < 1 hour |
| **P2** | Non-blocking SSO issue | < 1 hour | < 4 hours |
| **P3** | Cosmetic/minor | < 4 hours | Next sprint |

---

## 📞 Escalation Path

```text
1. QA Team detects issue
   ↓
2. Post in #ts24-qa channel
   ↓
3. TS24 Tech Lead acknowledges (< 5 min)
   ↓
4. Hotfix branch created
   ↓
5. Fix implemented & tested
   ↓
6. PR created → reviewed → merged
   ↓
7. Deploy to staging
   ↓
8. QA verifies fix
   ↓
9. (If approved) Deploy to production
```

---

## 📝 Hotfix Checklist

Before merging any hotfix:

- [ ] Root cause identified and documented
- [ ] Fix tested locally with `npm test -- --run`
- [ ] E2E smoke test passed: `npm run test:sso-smoke`
- [ ] Lint passed: `npm run lint`
- [ ] PR reviewed by at least 1 team member
- [ ] QA verified on staging
- [ ] Rollback plan documented
- [ ] No breaking changes to API contract

---

## 📎 Related Documents

- [QA_SUPPORT.md](../QA_SUPPORT.md) – QA guide
- [OPS_READY.md](../OPS_READY.md) – Deployment guide
- [deploy/pm2.config.cjs](pm2.config.cjs) – PM2 configuration
- [deploy/nginx-intel24.conf](nginx-intel24.conf) – NGINX configuration
