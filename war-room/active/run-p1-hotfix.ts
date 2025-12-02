#!/usr/bin/env npx tsx
import { pathToFileURL } from 'node:url';

const checklist = [
  'Confirm ALPHA issued P1 authorization',
  'Clone latest logs for correlation (scripts/qa-monitor.ts output)',
  'git checkout -b hotfix/p1-<ticket>',
  'Limit scope to single module (auth/routing/ui)',
  'Run targeted unit tests (npm run test -- auth --runInBand)',
  'Prepare diff snippet for Slack review',
  'Execute validate-hotfix.ts --suite targeted',
  'Stage deploy window + announcement',
];

function printChecklist(): void {
  console.info('[war-room] P1 Hotfix Execution Template');
  checklist.forEach((item, index) => {
    console.info(`${index + 1}. ${item}`);
  });
}

const entryUrl = pathToFileURL(process.argv[1] ?? '').href;
if (import.meta.url === entryUrl) {
  printChecklist();
}
