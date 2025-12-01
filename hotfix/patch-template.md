# Patch Report Template

Copy this template when documenting a patch for ALPHA.

---

## 🔧 TS24 Patch Report

**Patch ID:** PATCH-YYYY-MM-DD-NNN
**Priority:** P0 / P1 / P2
**Status:** ⏳ In Progress / ✅ Deployed to Staging / 🚀 Deployed to Production
**Reported By:** [QA tester / system]
**Fixed By:** [Developer name]

---

### 📋 Issue Summary

> [One-line description of the bug]

**Original Report:**

> [Quote or link to original QA issue report]

---

### 🔍 Root Cause Analysis

**Category:** SSO / Cookie / Routing / UI / API / Other

**Technical Details:**

> [Detailed technical explanation of what caused the bug]
>
> - What was happening: [...]
> - Why it was happening: [...]
> - How it was discovered: [...]

**Affected Components:**

- [ ] Server-side SSO verification
- [ ] Client-side session handling
- [ ] Cookie management
- [ ] Redirect flow
- [ ] Error handling
- [ ] Other: [specify]

---

### 🔧 Fix Applied

**Approach:**

> [Description of the fix approach]

**Changes Made:**

```text
Files changed:
  M server/ssoAuth.ts        - [what changed]
  M src/domains/auth/sso.ts  - [what changed]
  A tests/newTest.test.ts    - [what was added]
```

**Code Diff Summary:**

```diff
- // Old code
+ // New code
```

---

### ✅ Testing Performed

**Automated Tests:**

- [ ] All unit tests pass (`npm test -- --run`)
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] SSO smoke tests pass (`npm run test:sso-smoke`)
- [ ] Lint passes (`npm run lint`)
- [ ] Build passes (`npm run build`)

**Manual Tests:**

- [ ] Tested affected flow manually
- [ ] Tested on staging environment
- [ ] Tested edge cases:
  - [ ] [Edge case 1]
  - [ ] [Edge case 2]

---

### 📝 QA Verification Steps

Please verify the fix by following these steps:

1. **Setup:**
   - Clear browser cookies for intel24.blackbox.codes
   - Open browser DevTools → Network tab

2. **Test Steps:**
   1. [Step 1: e.g., Navigate to GDI portal]
   2. [Step 2: e.g., Click TS24 link]
   3. [Step 3: e.g., Observe redirect]
   4. [Step 4: e.g., Check dashboard loads]

3. **Expected Results:**
   - [ ] [Expected result 1]
   - [ ] [Expected result 2]
   - [ ] [Expected result 3]

4. **Evidence to Collect:**
   - Screenshot of success state
   - Network trace showing correct status codes
   - Cookie inspection showing `ts24_sso_session`

---

### 🔄 Rollback Plan

If issues occur after deployment:

**Immediate Rollback:**

```bash
# On production server
cd /var/www/ts24
git log --oneline -5                    # Find last good commit
git checkout <last-good-commit>
npm ci
npm run build
pm2 restart ts24-server
```

**Specific Revert:**

```bash
git revert <this-patch-commit> --no-edit
git push origin feature/qa-release-prep
# Then redeploy
```

**Rollback Verification:**

- [ ] Health check passes
- [ ] Original functionality restored
- [ ] QA notified of rollback

---

### 📊 Impact Assessment

**Users Affected:** All / Subset / Single user

**Downtime:** None / [X] minutes

**Data Impact:** None / [describe if any]

---

### 🚀 Deployment Details

| Field | Value |
|-------|-------|
| Commit Hash | `abc1234567890` |
| Branch | `hotfix/sso-XXX-description` |
| PR | #[number] |
| Deployed to Staging | YYYY-MM-DD HH:MM UTC |
| Deployed to Production | YYYY-MM-DD HH:MM UTC |
| Deployed By | @[username] |

---

### 📎 Related Links

- Issue: [link to QA issue]
- PR: [link to PR]
- Logs: [link to relevant logs]
- Monitoring: [link to dashboard]

---

### 📝 Post-Mortem Notes

> [Optional: Lessons learned, process improvements, follow-up tasks]

- [ ] Follow-up task 1
- [ ] Follow-up task 2
