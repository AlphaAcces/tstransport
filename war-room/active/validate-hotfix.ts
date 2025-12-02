#!/usr/bin/env npx tsx
import { pathToFileURL } from 'node:url';

interface SuitePlan {
  title: string;
  commands: string[];
}

const plans: Record<string, SuitePlan> = {
  critical: {
    title: 'Critical Token/Cookie Validation',
    commands: [
      'curl -I "$QA_BASE_URL/sso-login?sso=<JWT>"',
      'curl -H "Authorization: Bearer <JWT>" "$QA_BASE_URL/api/auth/verify"',
      'npm run qa:monitor -- --burst 5',
      'npm run qa:watchdog -- --duration 120',
    ],
  },
  targeted: {
    title: 'Targeted Regression Set',
    commands: [
      'npm run test -- auth --runInBand',
      'npx playwright test e2e/sso-smoke.spec.ts',
      'curl -s "$QA_BASE_URL/api/health" | jq',
    ],
  },
  ui: {
    title: 'UI Flow Confirmation',
    commands: [
      'npm run dev (local) and manual login check',
      'Capture HAR of dashboard load',
    ],
  },
};

function printPlan(planKey: string): void {
  const plan = plans[planKey] ?? plans.critical;
  console.info(`[war-room] Validate Hotfix Plan → ${plan.title}`);
  plan.commands.forEach((command, idx) => {
    console.info(`${idx + 1}. ${command}`);
  });
}

function main(): void {
  const suiteFlagIdx = process.argv.findIndex((arg) => arg === '--suite');
  const suiteKey = suiteFlagIdx > -1 ? process.argv[suiteFlagIdx + 1] ?? 'critical' : 'critical';
  printPlan(suiteKey);
}

const entryUrl = pathToFileURL(process.argv[1] ?? '').href;
if (import.meta.url === entryUrl) {
  main();
}
