# TS24 QA Support Guide

**Version:** 1.0
**Last Updated:** 1 Dec 2025
**Status:** ALPHA QA Support Mode Active

---

## 📋 Overblik: SSO Flow (GDI → SSO → TS24)

### Komplet Flow Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SSO AUTHENTICATION FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐        │
│  │   GDI    │      │  ALPHA   │      │   TS24   │      │  TS24    │        │
│  │  Portal  │      │   GUI    │      │  Server  │      │  Client  │        │
│  └────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘        │
│       │                 │                 │                 │              │
│       │ 1. User clicks  │                 │                 │              │
│       │    "TS24"       │                 │                 │              │
│       │────────────────>│                 │                 │              │
│       │                 │                 │                 │              │
│       │                 │ 2. Generate JWT │                 │              │
│       │                 │    (HS256)      │                 │              │
│       │                 │                 │                 │              │
│       │                 │ 3. Redirect     │                 │              │
│       │                 │────────────────>│                 │              │
│       │                 │ GET /sso-login  │                 │              │
│       │                 │ ?sso=<JWT>      │                 │              │
│       │                 │                 │                 │              │
│       │                 │                 │ 4. Verify JWT   │              │
│       │                 │                 │    - HS256 sig  │              │
│       │                 │                 │    - iss/aud    │              │
│       │                 │                 │    - exp/iat    │              │
│       │                 │                 │    - user lookup│              │
│       │                 │                 │                 │              │
│       │                 │                 │ 5. Set cookie   │              │
│       │                 │                 │    ts24_sso_    │              │
│       │                 │                 │    session      │              │
│       │                 │                 │                 │              │
│       │                 │                 │ 6. Redirect /   │              │
│       │                 │                 │────────────────>│              │
│       │                 │                 │                 │              │
│       │                 │                 │                 │ 7. Read      │
│       │                 │                 │                 │    cookie    │
│       │                 │                 │                 │              │
│       │                 │                 │                 │ 8. Build     │
│       │                 │                 │                 │    session   │
│       │                 │                 │                 │              │
│       │                 │                 │                 │ 9. Show      │
│       │                 │                 │<────────────────│    Dashboard │
│       │                 │                 │                 │              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Flow Steps Explained

| Step | Component | Action | Expected Result |
|------|-----------|--------|-----------------|
| 1 | GDI Portal | User initiates TS24 access | Redirect to ALPHA-GUI |
| 2 | ALPHA-GUI | Generate JWT with user claims | Valid HS256-signed token |
| 3 | ALPHA-GUI | HTTP redirect to TS24 | `GET /sso-login?sso=<JWT>` |
| 4 | TS24 Server | Verify token server-side | Claims extracted |
| 5 | TS24 Server | Create session cookie | `ts24_sso_session` set |
| 6 | TS24 Server | Redirect to dashboard | `302 → /` |
| 7 | TS24 Client | Read session cookie | Cookie decoded |
| 8 | TS24 Client | Build AuthUser | User state set |
| 9 | TS24 Client | Render dashboard | Full app loaded |

---

## 🧪 Testscenarier for ALPHA QA

### Scenario 1: Happy Path SSO Login

```bash
# Trigger
GET https://intel24.blackbox.codes/sso-login?sso=<VALID_JWT>

# Expected
HTTP/1.1 302 Found
Location: /
Set-Cookie: ts24_sso_session=<BASE64URL_JSON>; Path=/; Max-Age=28800

# Then
Dashboard loads with user authenticated
```

### Scenario 2: Expired Token

```bash
# Trigger (token with exp in past)
GET https://intel24.blackbox.codes/sso-login?sso=<EXPIRED_JWT>

# Expected
HTTP/1.1 302 Found
Location: /login?ssoFailed=true

# Then
Login page shows error banner: "Session Expired"
```

### Scenario 3: Invalid/Tampered Token

```bash
# Trigger (modified signature)
GET https://intel24.blackbox.codes/sso-login?sso=<TAMPERED_JWT>

# Expected
HTTP/1.1 302 Found
Location: /login?ssoFailed=true

# Server Log
[sso-login] Token verification failed (TOKEN_INVALID) undefined
```

### Scenario 4: Missing Token

```bash
# Trigger
GET https://intel24.blackbox.codes/sso-login

# Expected
HTTP/1.1 302 Found
Location: /login?ssoFailed=true

# Server Log
[sso-login] No SSO token provided. Redirecting to login with ssoFailed=true.
```

### Scenario 5: Wrong Issuer/Audience

```bash
# Trigger (token with wrong iss)
GET https://intel24.blackbox.codes/sso-login?sso=<WRONG_ISS_JWT>

# Expected
HTTP/1.1 302 Found
Location: /login?ssoFailed=true

# Server Log
[sso-login] Token verification failed (TOKEN_ISSUER_MISMATCH) undefined
```

### Scenario 6: Unknown User (Not in Allowlist)

```bash
# Trigger (valid token but unknown subject)
GET https://intel24.blackbox.codes/sso-login?sso=<UNKNOWN_USER_JWT>

# Expected
HTTP/1.1 302 Found
Location: /login?ssoFailed=true

# Server Log
[sso-login] Token verification failed (TOKEN_UNKNOWN_AGENT) { subject: 'unknown-user' }
```

### Scenario 7: Manual Login Fallback

```bash
# Trigger
GET https://intel24.blackbox.codes/login

# Expected
HTTP/1.1 200 OK
Content-Type: text/html

# Then
Login form renders with username/password fields
```

### Scenario 8: Session Persistence (Page Reload)

```bash
# After successful SSO login:
# 1. Refresh browser (F5)
# 2. Close and reopen tab
# 3. Navigate directly to https://intel24.blackbox.codes/

# Expected
Dashboard loads without re-authentication (cookie still valid)
```

### Scenario 9: Logout Flow

```bash
# Trigger: Click logout button in UI

# Expected
1. Cookie ts24_sso_session cleared
2. Redirect to /login
3. Next visit requires fresh authentication
```

### Scenario 10: Mobile SSO Redirect

```bash
# Trigger (mobile browser)
GET https://intel24.blackbox.codes/sso-login?sso=<VALID_JWT>

# Expected
Same as desktop:
- 302 redirect to /
- Cookie set
- Mobile-responsive dashboard loads
```

---

## 📊 Forventede HTTP-responser

### Health Endpoints

| Endpoint | Method | Auth | Success | Failure |
|----------|--------|------|---------|---------|
| `/api/health` | GET | None | `200 { status: "ok" }` | `503` |
| `/api/auth/sso-health` | GET | Header | `200 { secretConfigured: true }` | `403` |
| `/api/auth/verify` | GET | Bearer | `200 { status: "ok", ts24_user_id }` | `401` |

### SSO Endpoints

| Endpoint | Condition | Response |
|----------|-----------|----------|
| `/sso-login?sso=<valid>` | Valid token | `302 → /` + Set-Cookie |
| `/sso-login?sso=<invalid>` | Invalid token | `302 → /login?ssoFailed=true` |
| `/sso-login?sso=<expired>` | Expired token | `302 → /login?ssoFailed=true` |
| `/sso-login` | No token | `302 → /login?ssoFailed=true` |
| `/login` | Any | `200 OK` (SPA) |
| `/login?ssoFailed=true` | After SSO fail | `200 OK` + error banner |

### Cookie Details

```
Name:     ts24_sso_session
Value:    <base64url-encoded JSON>
Path:     /
Max-Age:  28800 (8 hours)
Secure:   true (in production)
SameSite: Lax
HttpOnly: false (client needs read access)
```

### Cookie Payload (Decoded)

```json
{
  "userId": "AlphaGrey",
  "role": "admin",
  "name": "Alpha Grey",
  "tenant": "tsl",
  "ssoAuth": true,
  "authTime": 1733061600000
}
```

---

## 🔍 Verificer Session Cookie Korrekt

### Browser DevTools Method

1. Åbn DevTools (`F12`)
2. Gå til **Application** → **Cookies** → `https://intel24.blackbox.codes`
3. Find `ts24_sso_session`
4. Kopiér værdien

### Decode Cookie (CLI)

```bash
# PowerShell
$cookie = "<COOKIE_VALUE>"
[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($cookie.Replace('-','+').Replace('_','/')))

# Bash
echo "<COOKIE_VALUE>" | base64 -d

# Node.js
Buffer.from('<COOKIE_VALUE>', 'base64url').toString('utf-8')
```

### Expected Decoded Output

```json
{
  "userId": "AlphaGrey",
  "role": "admin",
  "name": "Alpha Grey",
  "tenant": "tsl",
  "ssoAuth": true,
  "authTime": 1733061600000
}
```

### Validation Checklist

- [ ] `userId` matches expected user
- [ ] `role` is valid (`admin`, `user`, `viewer`)
- [ ] `tenant` matches expected tenant ID
- [ ] `ssoAuth` is `true`
- [ ] `authTime` is within last 8 hours

---

## 🔧 Troubleshooting Guide

### Issue 1: "Token verification failed (TOKEN_INVALID)"

**Symptom:** SSO login redirects to `/login?ssoFailed=true`

**Diagnosis:**
```bash
# Check server logs
pm2 logs ts24-intel-console --lines 50 | grep TOKEN_INVALID
```

**Causes:**
1. Token was modified in transit
2. Token signature doesn't match secret
3. Token is malformed (not valid JWT)

**Solution:**
1. Verify `VITE_SSO_JWT_SECRET` matches between ALPHA-GUI and TS24
2. Check for URL encoding issues in token
3. Ensure token is generated with HS256 algorithm

---

### Issue 2: "Token verification failed (TOKEN_EXPIRED)"

**Symptom:** Valid users get redirected to login

**Diagnosis:**
```bash
# Decode token and check exp claim
echo "<JWT_PAYLOAD>" | base64 -d | jq '.exp'
# Compare with current timestamp
date +%s
```

**Causes:**
1. Token TTL too short
2. Clock skew between servers
3. Token generated too far in advance

**Solution:**
1. Increase token TTL (recommend 5 min)
2. Sync server clocks with NTP
3. Generate token just before redirect

---

### Issue 3: "Token verification failed (TOKEN_ISSUER_MISMATCH)"

**Symptom:** All SSO logins fail

**Diagnosis:**
```bash
# Check expected issuer
curl -s https://intel24.blackbox.codes/api/auth/sso-health | jq '.expectedIss'
# Should be: "ts24-intel"
```

**Causes:**
1. ALPHA-GUI using wrong issuer in JWT
2. TS24 config mismatch

**Solution:**
1. Ensure ALPHA-GUI sets `iss: "ts24-intel"`
2. Verify `server/ssoAuth.ts` SSO_EXPECTED_ISS

---

### Issue 4: Cookie Not Set After SSO

**Symptom:** Dashboard shows "Verifying session..." indefinitely

**Diagnosis:**
1. Check DevTools → Network → `/sso-login` response headers
2. Look for `Set-Cookie` header

**Causes:**
1. HTTPS/HTTP mismatch (Secure cookie on HTTP)
2. SameSite policy blocking cookie
3. Browser blocking third-party cookies

**Solution:**
1. Ensure HTTPS in production
2. Check SameSite=Lax allows the redirect
3. Test in incognito without extensions

---

### Issue 5: Session Lost on Page Refresh

**Symptom:** User logged out after refresh

**Diagnosis:**
```javascript
// In browser console
document.cookie.split(';').find(c => c.includes('ts24_sso_session'))
```

**Causes:**
1. Cookie expired
2. Cookie path mismatch
3. Client-side code clearing cookie

**Solution:**
1. Check cookie Max-Age (should be 28800)
2. Verify cookie Path is `/`
3. Check for errant `clearSsoSessionCookie()` calls

---

### Issue 6: Mobile SSO Not Working

**Symptom:** SSO works on desktop but fails on mobile

**Diagnosis:**
1. Check mobile browser cookie settings
2. Test with different mobile browsers

**Causes:**
1. Mobile Safari ITP blocking cookies
2. In-app browser issues
3. Cookie size exceeds mobile limits

**Solution:**
1. Ensure proper SameSite settings
2. Test in native browser, not in-app
3. Reduce cookie payload if needed

---

### Issue 7: NGINX 502 Bad Gateway

**Symptom:** All requests return 502

**Diagnosis:**
```bash
# Check if Node process is running
pm2 status ts24-intel-console

# Check NGINX error log
sudo tail -f /var/log/nginx/error.log
```

**Causes:**
1. Node process crashed
2. Wrong proxy_pass port
3. Node not listening on expected port

**Solution:**
1. `pm2 restart ts24-intel-console`
2. Verify PORT matches nginx config (3001)
3. Check `pm2 logs` for startup errors

---

## 📝 Logging Guide for ALPHA

### What Logs to Check

| Log Source | Location | What to Look For |
|------------|----------|------------------|
| TS24 App | `pm2 logs ts24-intel-console` | SSO success/failure |
| NGINX Access | `/var/log/nginx/access.log` | Request routing |
| NGINX Error | `/var/log/nginx/error.log` | Proxy errors |
| Browser Console | DevTools → Console | Client-side errors |

### Key Log Patterns

**Successful SSO:**
```
[sso-login] SSO login successful for user: AlphaGrey (role: admin, tenant: tsl)
```

**Failed SSO:**
```
[sso-login] Token verification failed (TOKEN_EXPIRED) undefined
[sso-login] Token verification failed (TOKEN_INVALID) { reason: 'Invalid Compact JWS' }
[sso-login] Token verification failed (TOKEN_UNKNOWN_AGENT) { subject: 'unknown-user' }
```

**Missing Token:**
```
[sso-login] No SSO token provided. Redirecting to login with ssoFailed=true.
```

**API Verify:**
```
[auth/verify] Token verification failed: TOKEN_EXPIRED undefined
```

### Real-time Log Monitoring

```bash
# Follow TS24 logs
pm2 logs ts24-intel-console -f

# Filter for SSO only
pm2 logs ts24-intel-console -f | grep -E '\[sso|auth\]'

# Combined with NGINX
tail -f /var/log/nginx/access.log | grep -E 'sso-login|api/auth'
```

### Log Aggregation (Production)

For production monitoring, consider:
- Datadog / New Relic integration
- ELK Stack (Elasticsearch, Logstash, Kibana)
- CloudWatch Logs (AWS)

---

## ✅ QA Chain Checklist

### Pre-Test Setup

- [ ] TS24 server running (`pm2 status`)
- [ ] NGINX configured and reloaded
- [ ] Health endpoint responding (`/api/health`)
- [ ] SSO secret matches ALPHA-GUI
- [ ] Browser cookies cleared

### Token Flow Tests

- [ ] **TC-01:** Valid token → Dashboard loads
- [ ] **TC-02:** Expired token → Login + error banner
- [ ] **TC-03:** Invalid token → Login + error banner
- [ ] **TC-04:** Tampered token → Login + error banner
- [ ] **TC-05:** Wrong issuer → Login + error banner
- [ ] **TC-06:** Wrong audience → Login + error banner
- [ ] **TC-07:** Unknown user → Login + "Access Denied"

### Redirect Flow Tests

- [ ] **TC-08:** `/sso-login?sso=<valid>` → 302 → `/`
- [ ] **TC-09:** `/sso-login` (no token) → 302 → `/login?ssoFailed=true`
- [ ] **TC-10:** `/login?sso=<valid>` → 302 → `/sso-login?sso=<valid>` (canonicalization)

### Fresh Login Flow Tests

- [ ] **TC-11:** Manual login at `/login` works
- [ ] **TC-12:** Demo users authenticate correctly
- [ ] **TC-13:** Login form validates inputs

### Session Persistence Tests

- [ ] **TC-14:** Page refresh keeps session
- [ ] **TC-15:** New tab shares session
- [ ] **TC-16:** Close/reopen browser within 8h keeps session

### Expired Session Fallback Tests

- [ ] **TC-17:** Session cookie expired → Shows login
- [ ] **TC-18:** Cookie manually deleted → Shows login
- [ ] **TC-19:** Logout button clears cookie

### Mobile Tests

- [ ] **TC-20:** iOS Safari SSO login works
- [ ] **TC-21:** Android Chrome SSO login works
- [ ] **TC-22:** Mobile responsive layout correct

### Cookie Sanitation Tests

- [ ] **TC-23:** Cookie only contains expected fields
- [ ] **TC-24:** No sensitive data in cookie (no JWT secret)
- [ ] **TC-25:** Cookie properly encoded (base64url)

### NGINX Passthrough Tests

- [ ] **TC-26:** `/api/*` routes correctly proxied
- [ ] **TC-27:** `/sso-login` route correctly proxied
- [ ] **TC-28:** Static assets served correctly
- [ ] **TC-29:** SPA routes fallback to index.html

---

## 🎯 QA Flow Diagram (ASCII)

```text
╔═══════════════════════════════════════════════════════════════════════════╗
║                        TS24 SSO QA TEST FLOW                              ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║   ┌─────────────────┐                                                     ║
║   │   ALPHA-GUI     │                                                     ║
║   │  Generate JWT   │                                                     ║
║   └────────┬────────┘                                                     ║
║            │                                                              ║
║            ▼                                                              ║
║   ┌─────────────────┐                                                     ║
║   │ GET /sso-login  │                                                     ║
║   │ ?sso=<JWT>      │                                                     ║
║   └────────┬────────┘                                                     ║
║            │                                                              ║
║            ▼                                                              ║
║   ┌─────────────────────────────────────────┐                             ║
║   │     verifySsoTokenServerSide()          │                             ║
║   │                                         │                             ║
║   │  ┌─────────────────────────────────┐    │                             ║
║   │  │ 1. Decode JWT header            │    │                             ║
║   │  │ 2. Verify HS256 signature       │    │                             ║
║   │  │ 3. Check iss = "ts24-intel"     │    │                             ║
║   │  │ 4. Check aud = "ts24-intel"     │    │                             ║
║   │  │ 5. Check exp > now              │    │                             ║
║   │  │ 6. Lookup user in allowlist     │    │                             ║
║   │  └─────────────────────────────────┘    │                             ║
║   └────────┬───────────────────┬────────────┘                             ║
║            │                   │                                          ║
║       [VALID]             [INVALID]                                       ║
║            │                   │                                          ║
║            ▼                   ▼                                          ║
║   ┌─────────────────┐ ┌─────────────────┐                                 ║
║   │ Set Cookie:     │ │ Redirect:       │                                 ║
║   │ ts24_sso_session│ │ /login?ssoFailed│                                 ║
║   │                 │ │ =true           │                                 ║
║   │ Redirect: /     │ └────────┬────────┘                                 ║
║   └────────┬────────┘          │                                          ║
║            │                   │                                          ║
║            ▼                   ▼                                          ║
║   ┌─────────────────┐ ┌─────────────────┐                                 ║
║   │   DASHBOARD     │ │   LOGIN PAGE    │                                 ║
║   │                 │ │ + Error Banner  │                                 ║
║   │ • User auth'd   │ │                 │                                 ║
║   │ • Cases loaded  │ │ "Session expired│                                 ║
║   │ • Full access   │ │  please login"  │                                 ║
║   └─────────────────┘ └─────────────────┘                                 ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 📞 Kontakter

| Role | Contact | Responsibility |
|------|---------|----------------|
| TS24 Tech Lead | @AlphaGrey | SSO implementation, server issues |
| ALPHA-GUI Lead | @GUI-Lead | JWT generation, redirect flow |
| QA Lead | @QA-Lead | Test coordination |
| Ops/Infra | @Ops-Team | DNS, TLS, NGINX |

---

## 📎 Relateret Dokumentation

- [OPS_READY.md](OPS_READY.md) – Deployment guide
- [docs/sso_v1_signoff_ts24.md](docs/sso_v1_signoff_ts24.md) – SSO sign-off checklist
- [docs/ts24_login_flow.md](docs/ts24_login_flow.md) – Login flow details
- [docs/system_overview.md](docs/system_overview.md) – System architecture
