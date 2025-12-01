# TS24 QA Standby Operations Guide

**Version:** 1.0
**Last Updated:** 1 Dec 2025
**Status:** 🟡 QA STANDBY MODE ACTIVE
**Branch:** `feature/qa-release-prep`

---

## 📋 Overblik

Dette dokument beskriver TS24-teamets operationelle procedurer under aktiv QA-fase.

**VIGTIGT:** Indtil vi modtager "ALPHA-QA RUN — ROUND 1 RESULTS", må der IKKE foretages kodeændringer.

---

## 🚦 QA Standby Status

```text
┌─────────────────────────────────────────────────────────────────┐
│                    QA STANDBY STATUS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Current Phase:  🟡 STANDBY - Awaiting QA Results              │
│                                                                 │
│   Code Freeze:    ✅ ACTIVE                                     │
│   Monitoring:     ✅ ACTIVE                                     │
│   Hotfix Ready:   ✅ PREPARED                                   │
│                                                                 │
│   Next Action:    Wait for ALPHA-QA ROUND 1 RESULTS             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔴 P0/P1/P2 Triage Flow

### Severity Definitions

| Priority | Definition | Examples | Response |
|----------|-----------|----------|----------|
| **P0** | Complete SSO failure | Users cannot login, 500 errors on /sso-login | Immediate (≤5 min) |
| **P1** | Partial SSO failure | Some users affected, intermittent failures | Urgent (≤15 min) |
| **P2** | Non-blocking issue | Edge cases, cosmetic, non-critical paths | Normal (≤1 hour) |
| **P3** | Minor/cosmetic | UI text, styling, documentation | Backlog |

### Triage Decision Tree

```text
                    ┌─────────────────┐
                    │  Issue Reported │
                    └────────┬────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │ Can users login at all?│
                └────────────┬───────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
           [NO]                          [YES]
              │                             │
              ▼                             ▼
        ┌─────────┐              ┌─────────────────────┐
        │   P0    │              │ Are >10% users      │
        │ CRITICAL│              │ affected?           │
        └─────────┘              └──────────┬──────────┘
                                            │
                          ┌─────────────────┴─────────────────┐
                          │                                   │
                       [YES]                                [NO]
                          │                                   │
                          ▼                                   ▼
                    ┌─────────┐                    ┌─────────────────────┐
                    │   P1    │                    │ Is core SSO flow    │
                    │ URGENT  │                    │ affected?           │
                    └─────────┘                    └──────────┬──────────┘
                                                              │
                                            ┌─────────────────┴─────────────────┐
                                            │                                   │
                                         [YES]                                [NO]
                                            │                                   │
                                            ▼                                   ▼
                                      ┌─────────┐                         ┌─────────┐
                                      │   P2    │                         │   P3    │
                                      │ NORMAL  │                         │ BACKLOG │
                                      └─────────┘                         └─────────┘
```

### Triage Response Actions

**P0 Response (≤5 min):**
1. Acknowledge in #ts24-qa immediately
2. Start `npm run qa:monitor` if not running
3. Check server logs: `pm2 logs ts24-server --lines 100`
4. Identify root cause category
5. Begin hotfix within 10 minutes

**P1 Response (≤15 min):**
1. Acknowledge in #ts24-qa within 5 minutes
2. Gather reproduction steps
3. Identify affected user segment
4. Prepare hotfix branch
5. Coordinate with ALPHA-GUI if token-related

**P2 Response (≤1 hour):**
1. Acknowledge in #ts24-qa within 30 minutes
2. Document issue in detail
3. Schedule fix for next deployment window
4. No immediate code changes unless P2 escalates

---

## ✅ Accept-kriterier for "QA PASS"

### Mandatory Pass Criteria

For SSO to be considered QA PASS, ALL of the following must be verified:

| # | Criterion | Test Method | Expected Result |
|---|-----------|-------------|-----------------|
| 1 | Valid token login | `/sso-login?sso=<VALID_JWT>` | 302 → / with cookie |
| 2 | Expired token rejection | `/sso-login?sso=<EXPIRED_JWT>` | 302 → /login?ssoFailed=true |
| 3 | Invalid signature rejection | `/sso-login?sso=<TAMPERED_JWT>` | 302 → /login?ssoFailed=true |
| 4 | Session persistence | Refresh page after login | User remains logged in |
| 5 | Logout clears session | Click logout | Cookie cleared, redirect to /login |
| 6 | Health endpoint | `GET /api/health` | 200 OK |
| 7 | Verify endpoint (valid) | `GET /api/auth/verify` + Bearer | 200 OK with user data |
| 8 | Verify endpoint (invalid) | `GET /api/auth/verify` + bad token | 401 Unauthorized |

### Optional Pass Criteria (Nice to Have)

| # | Criterion | Note |
|---|-----------|------|
| 1 | Response time < 500ms | Average latency |
| 2 | No console errors | Browser console clean |
| 3 | Mobile redirect works | SSO on mobile browser |

### QA PASS Declaration

QA PASS can only be declared when:
- ✅ All 8 mandatory criteria pass
- ✅ No P0 or P1 issues open
- ✅ All P2 issues documented with workarounds
- ✅ ALPHA-QA lead signs off

---

## 🔒 Code Change Policy

### When Code Changes ARE Allowed

| Scenario | Allowed? | Approval Required |
|----------|----------|-------------------|
| P0 hotfix | ✅ Yes | Immediate, post-hoc review |
| P1 hotfix | ✅ Yes | Quick review (≤10 min) |
| P2 fix | ⚠️ After QA round | Normal PR review |
| P3 / new features | ❌ No | After QA PASS |
| Documentation only | ✅ Yes | None |
| Test additions | ✅ Yes | None |

### Code Freeze Rules

During QA Standby:

```text
✅ ALLOWED:
  - Reading logs
  - Running monitors
  - Preparing documentation
  - Writing new tests (not merged)
  - Preparing hotfix templates

❌ NOT ALLOWED:
  - Merging to main or feature/qa-release-prep
  - Changing runtime behavior
  - Modifying SSO logic
  - Updating dependencies
  - Refactoring
```

### Breaking Code Freeze (Emergency Only)

To break code freeze for P0/P1:

1. **Announce** in #ts24-qa: "⚠️ CODE FREEZE BREAK: P0 - [description]"
2. **Create** hotfix branch from feature/qa-release-prep
3. **Implement** minimal fix (no refactoring)
4. **Test** locally with `npm test -- --run`
5. **PR** with mandatory review (can be expedited)
6. **Merge** only after reviewer approval
7. **Deploy** to staging first
8. **Notify** QA team for re-verification

---

## 📝 Patch Documentation for ALPHA

### Patch Report Template

When submitting a patch to ALPHA, use this format:

```markdown
## 🔧 TS24 Patch Report

**Patch ID:** PATCH-2025-12-01-001
**Priority:** P0 / P1 / P2
**Status:** Deployed to Staging / Production

### Issue Summary
[One-line description of the bug]

### Root Cause
[Technical explanation of what caused the bug]

### Fix Applied
[Description of the fix]

### Files Changed
- `server/ssoAuth.ts` - [what changed]
- `src/domains/auth/ssoBackend.ts` - [what changed]

### Testing Performed
- [ ] Unit tests pass
- [ ] E2E smoke tests pass
- [ ] Manual verification on staging

### Verification Steps for QA
1. [Step 1]
2. [Step 2]
3. Expected result: [...]

### Rollback Plan
If issues occur:
```bash
git revert <commit-hash>
npm run build
pm2 restart ts24-server
```

### Deployment Details
- Commit: `abc1234`
- Deployed: 2025-12-01 14:32 UTC
- Deployed by: @AlphaGrey
```

---

## 📡 Notifikationsstruktur

### What to Log

| Event | Where | When | Format |
|-------|-------|------|--------|
| QA issue received | #ts24-qa | Immediately | Acknowledgment message |
| Hotfix started | #ts24-qa | When branch created | Branch name + ETA |
| Hotfix ready | #ts24-qa | When PR created | PR link |
| Deployed to staging | #ts24-qa | After deployment | Deployment confirmation |
| Ready for re-test | #ts24-qa | After QA staging deploy | Re-test request |
| QA verified | #ts24-qa | After QA confirmation | Close issue |

### Notification Templates

**Acknowledgment:**
```text
✅ Acknowledged: [Issue Title]
Priority: P[0/1/2]
ETA: [X] minutes
Assigned: @[developer]
```

**Hotfix Started:**
```text
🔧 Hotfix in progress
Branch: hotfix/sso-[issue]-[description]
Issue: [link to issue]
ETA to PR: [X] minutes
```

**Deployed:**
```text
🚀 Deployed to [staging/production]
Commit: [hash]
Time: [timestamp]
Ready for re-test: Yes / No
```

### Escalation Path

```text
0-5 min:    Developer acknowledges
5-15 min:   Hotfix branch + initial fix
15-20 min:  PR review + merge
20-25 min:  Deploy to staging
25-30 min:  QA re-verification

If >30 min without resolution:
  → Escalate to Tech Lead
  → Consider rollback to last known good
```

---

## 📊 Monitoring During Standby

### Active Monitors

```bash
# Terminal 1: QA Monitor
npm run qa:monitor

# Terminal 2: Server logs
pm2 logs ts24-server --lines 50

# Terminal 3: Error watch
pm2 logs ts24-server | grep -E "(error|Error|ERROR|fail)"
```

### Key Metrics to Watch

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| /api/health latency | < 50ms | 50-200ms | > 200ms |
| /sso-login latency | < 100ms | 100-500ms | > 500ms |
| verify success rate | > 99% | 95-99% | < 95% |
| Cookie presence rate | 100% | < 100% | N/A |

---

## 📎 Relaterede Dokumenter

- [QA_SUPPORT.md](QA_SUPPORT.md) – Full QA support guide
- [hotfix/README.md](hotfix/README.md) – Hotfix procedures
- [hotfix/checklist.md](hotfix/checklist.md) – Rapid response checklist
- [OPS_READY.md](OPS_READY.md) – Deployment guide

---

## 🔄 Status Updates

| Date | Time | Status | Note |
|------|------|--------|------|
| 2025-12-01 | 15:40 | 🟡 STANDBY | Awaiting ALPHA-QA Round 1 |
| | | | |
| | | | |

---

**Næste handling:** Vent på "ALPHA-QA RUN — ROUND 1 RESULTS"
