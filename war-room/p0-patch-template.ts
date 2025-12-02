#!/usr/bin/env npx tsx
import { pathToFileURL } from 'node:url';

/**
 * Intel24 WAR ROOM — P0 Patch Template v2
 *
 * Read-only helper for structuring critical fixes without touching runtime logic.
 * Duplicate this template in a scratch area before applying real patches.
 */

export type FlowClassifier =
  | 'TOKEN_FLOW'
  | 'COOKIE_FLOW'
  | 'ROUTING_FLOW'
  | 'NGINX_FLOW'
  | 'UI_FLOW';

export interface P0PatchPlan {
  incidentId: string;
  severity: 'P0';
  detectedAt: string;
  commander: string;
  suspectedFlows: FlowClassifier[];
  hypothesis: string[];
  mitigationSteps: string[];
  validationCommands: string[];
  rollbackSteps: string[];
  communications: string[];
}

const defaultPlan: P0PatchPlan = {
  incidentId: 'P0-XXXX',
  severity: 'P0',
  detectedAt: new Date().toISOString(),
  commander: 'assign-owner',
  suspectedFlows: ['TOKEN_FLOW', 'COOKIE_FLOW'],
  hypothesis: [
    'Token rejection at /sso-login after ALPHA QA report',
    'Session cookie not persisting past first redirect',
  ],
  mitigationSteps: [
    'Audit latest commit touching server/app.ts',
    'Add targeted guard in ssoAuth verifier (keep diff minimal)',
    'Instrument additional console.info telemetry if absolutely needed',
  ],
  validationCommands: [
    'curl -I "$QA_BASE_URL/sso-login?sso=<JWT>"',
    'curl -H "Authorization: Bearer <JWT>" "$QA_BASE_URL/api/auth/verify"',
    'npm run qa:monitor -- --burst 3',
  ],
  rollbackSteps: [
    'git checkout main -- server/app.ts',
    'pm2 restart intel24-console',
    'Rerun sanity tests to confirm rollback success',
  ],
  communications: [
    'Notify #intel24-war-room that P0 plan is armed',
    'Share diff + expected blast radius with ALPHA',
    'Post-deploy metrics screenshot after 10 min',
  ],
};

export function createP0PatchPlan(overrides: Partial<P0PatchPlan> = {}): P0PatchPlan {
  return {
    ...defaultPlan,
    ...overrides,
    suspectedFlows: overrides.suspectedFlows ?? defaultPlan.suspectedFlows,
    hypothesis: overrides.hypothesis ?? defaultPlan.hypothesis,
    mitigationSteps: overrides.mitigationSteps ?? defaultPlan.mitigationSteps,
    validationCommands: overrides.validationCommands ?? defaultPlan.validationCommands,
    rollbackSteps: overrides.rollbackSteps ?? defaultPlan.rollbackSteps,
    communications: overrides.communications ?? defaultPlan.communications,
  };
}

export function printP0PatchPlan(plan: P0PatchPlan): void {
  console.info('\n[war-room] P0 Patch Checklist');
  console.info(plan);
}

const entryUrl = pathToFileURL(process.argv[1] ?? '').href;
if (import.meta.url === entryUrl) {
  printP0PatchPlan(createP0PatchPlan());
}
