#!/usr/bin/env npx tsx
/**
 * Intel24 WAR ROOM — Quick Rollback Script (read-only helper)
 *
 * Outputs the canonical rollback steps for Stage 2 without mutating the system.
 */

const rollbackSteps = [
  'git status --short',
  'git stash push -m "war-room-auto"',
  'git checkout main && git pull',
  'pm2 save && pm2 restart intel24-console',
  'curl -s "$QA_BASE_URL/api/health" | jq',
  'npm run qa:monitor -- --burst 3',
];

console.info('\n[war-room] Quick Rollback Steps');
rollbackSteps.forEach((step, idx) => {
  console.info(`${idx + 1}. ${step}`);
});
