#!/usr/bin/env npx tsx
import { pathToFileURL } from 'node:url';

const diagnostics = [
  '1. Capture watchdog + monitor snapshots (npm run qa:watchdog & qa:monitor --burst 3)',
  '2. Save server health: curl -s "$QA_BASE_URL/api/health" | jq',
  '3. Record failing user journey (HAR export)',
  '4. Classify failure via scripts/qa-parse.ts --stdin < latest.log',
  '5. Map anomaly to patch zone (TOKEN / COOKIE / ROUTING / NGINX / UI)',
  '6. Confirm no unrelated deploys in flight (Slack #intel24-deploy)',
  '7. Update incident ledger entry before touching code',
];

function run(): void {
  console.info('[war-room] Pre-Patch Diagnose Checklist');
  diagnostics.forEach((item) => console.info(item));
}

const entryUrl = pathToFileURL(process.argv[1] ?? '').href;
if (import.meta.url === entryUrl) {
  run();
}
