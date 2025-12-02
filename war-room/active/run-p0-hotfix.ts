#!/usr/bin/env npx tsx
import { pathToFileURL } from 'node:url';

interface HotfixStep {
  label: string;
  command: string;
  notes?: string;
}

const steps: HotfixStep[] = [
  {
    label: 'Snapshot environment',
    command: 'pm2 save && pm2 ls',
    notes: 'Ensure current processes are persisted before making changes.',
  },
  {
    label: 'Create hotfix branch',
    command: 'git checkout -b hotfix/p0-<incident>',
  },
  {
    label: 'Limit scope to affected files',
    command: 'git status --short | grep "server/app.ts"',
    notes: 'Avoid touching non-critical files.',
  },
  {
    label: 'Implement patch',
    command: '# edit minimal code (no refactors)',
  },
  {
    label: 'Self-review diff',
    command: 'git diff --stat',
  },
  {
    label: 'Guided validation',
    command: 'npx tsx war-room/active/validate-hotfix.ts --suite critical',
  },
  {
    label: 'Prepare announcement',
    command: 'cp patch-announcement-template.md war-room/announcements/<incident>.md',
  },
  {
    label: 'Deployment window start',
    command: '# follow Stage 3 patch protocol',
  },
];

function printChecklist(): void {
  console.info('[war-room] P0 Hotfix Execution Template');
  steps.forEach((step, index) => {
    console.info(`\n${index + 1}. ${step.label}`);
    console.info(`   command: ${step.command}`);
    if (step.notes) {
      console.info(`   notes: ${step.notes}`);
    }
  });
}

const entryUrl = pathToFileURL(process.argv[1] ?? '').href;
if (import.meta.url === entryUrl) {
  printChecklist();
}
