# Rollback Template

Use this template when a rollback is required.

---

## 🔄 TS24 Rollback Report

**Rollback ID:** ROLLBACK-YYYY-MM-DD-NNN
**Trigger:** P0 Regression / P1 Regression / Deployment Failure / Other
**Status:** ⏳ In Progress / ✅ Completed
**Initiated By:** [name]
**Time Initiated:** YYYY-MM-DD HH:MM UTC

---

### ⚠️ Rollback Reason

**Original Patch:** PATCH-YYYY-MM-DD-NNN

**Why Rolling Back:**

> [Clear explanation of why the patch is being rolled back]

**Symptoms Observed:**

- [ ] Users unable to login
- [ ] Increased error rate
- [ ] Performance degradation
- [ ] Unexpected behavior: [describe]
- [ ] Other: [describe]

**Evidence:**

```text
[Paste relevant error logs, metrics, or screenshots]
```

---

### 📋 Pre-Rollback Checklist

- [ ] Rollback approved by Tech Lead
- [ ] Team notified in #ts24-qa
- [ ] Current state documented (logs, metrics)
- [ ] Known good commit identified
- [ ] Rollback commands prepared

---

### 🔧 Rollback Execution

**Target Commit:** `<commit-hash>`

**Rollback Method:** Git Revert / Git Reset / Manual

#### Option A: Git Revert (Preferred)

```bash
# Create revert commit (preserves history)
git checkout feature/qa-release-prep
git pull origin feature/qa-release-prep
git revert <bad-commit-hash> --no-edit
git push origin feature/qa-release-prep
```

#### Option B: Git Reset (If Revert Fails)

```bash
# WARNING: This rewrites history
git checkout feature/qa-release-prep
git reset --hard <good-commit-hash>
git push --force-with-lease origin feature/qa-release-prep
```

#### Option C: Quick Server Rollback

```bash
# On production server - fastest option
cd /var/www/ts24
git fetch origin
git checkout <good-commit-hash>
npm ci
npm run build
pm2 restart ts24-server
```

---

### 🚀 Deployment After Rollback

```bash
# On production server
cd /var/www/ts24

# Fetch latest (after revert is pushed)
git fetch origin
git checkout feature/qa-release-prep
git pull origin feature/qa-release-prep

# Rebuild
npm ci
npm run build

# Restart with zero downtime
pm2 reload ts24-server

# Verify
curl -s https://intel24.blackbox.codes/api/health | jq
```

---

### ✅ Post-Rollback Verification

**Immediate Checks:**

- [ ] `curl https://intel24.blackbox.codes/api/health` returns 200
- [ ] `npm run qa:monitor` shows all green
- [ ] No new errors in `pm2 logs ts24-server`

**Functional Checks:**

- [ ] SSO login flow works
- [ ] Session persistence works
- [ ] Logout works
- [ ] Original issue no longer present

**Metrics Check:**

- [ ] Error rate returned to baseline
- [ ] Latency returned to normal
- [ ] Success rate > 99%

---

### 📢 Communication

**#ts24-qa Notification:**

```text
🔄 ROLLBACK COMPLETE

Patch: PATCH-YYYY-MM-DD-NNN
Reason: [brief reason]
Rolled back to: <commit-hash>
Time: YYYY-MM-DD HH:MM UTC

Current Status: ✅ System stable
Next Steps: Investigating root cause

Please re-test the original issue.
```

---

### 📝 Post-Rollback Analysis

**Root Cause of Patch Failure:**

> [What went wrong with the original patch]

**Why Testing Didn't Catch It:**

> [Gap in testing that allowed this to slip through]

**Preventive Measures:**

- [ ] Add test case for this scenario
- [ ] Update deployment checklist
- [ ] Improve monitoring for [metric]
- [ ] Other: [describe]

---

### 📊 Timeline

| Time | Action | By |
|------|--------|-----|
| HH:MM | Issue detected | [who] |
| HH:MM | Rollback decision made | [who] |
| HH:MM | Rollback initiated | [who] |
| HH:MM | Rollback completed | [who] |
| HH:MM | Verification complete | [who] |
| HH:MM | All clear announced | [who] |

**Total Incident Duration:** [X] minutes

---

### 📎 Related

- Original Patch: [link]
- Incident Thread: [link to #ts24-qa thread]
- Logs: [link]
