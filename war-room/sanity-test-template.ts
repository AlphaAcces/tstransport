#!/usr/bin/env npx tsx
/**
 * Intel24 WAR ROOM — Sanity Test Template
 *
 * Prints a deterministic set of commands to run after a hotfix patch.
 * Does not execute tests automatically (read-only guidance).
 */

interface SanityTestPlan {
  name: string;
  steps: string[];
}

const plans: Record<string, SanityTestPlan> = {
  default: {
    name: 'Default Token/Cookie Sweep',
    steps: [
      'curl -I "$QA_BASE_URL/sso-login?sso=<JWT>"',
      'curl -H "Authorization: Bearer <JWT>" "$QA_BASE_URL/api/auth/verify"',
      'curl -s "$QA_BASE_URL/api/health" | jq',
      'npm run qa:monitor -- --burst 5',
      'npm run qa:watchdog -- --duration 60',
    ],
  },
  routing: {
    name: 'Routing Regression Pass',
    steps: [
      'npm run test -- Cases --runInBand',
      'curl -I "$QA_BASE_URL/" | grep -i location',
      'curl -I "$QA_BASE_URL/dashboard"',
      'npx playwright test e2e/sso-smoke.spec.ts --headed=false',
    ],
  },
};

function printPlan(planKey: string): void {
  const plan = plans[planKey] ?? plans.default;
  console.info(`\n[war-room] Sanity Test Plan → ${plan.name}`);
  plan.steps.forEach((cmd, index) => {
    console.info(`${index + 1}. ${cmd}`);
  });
}

const planArgIndex = process.argv.findIndex((arg) => arg === '--plan');
const planKey = planArgIndex > -1 ? process.argv[planArgIndex + 1] ?? 'default' : 'default';
printPlan(planKey);
