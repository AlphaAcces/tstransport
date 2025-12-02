#!/usr/bin/env npx tsx
import { pathToFileURL } from 'node:url';

/**
 * Intel24 WAR ROOM — P1 Patch Template v2
 *
 * Guides urgent-but-not-critical fixes while keeping scope tight.
 */

export interface P1PatchPlan {
  incidentId: string;
  severity: 'P1';
  owner: string;
  affectedUsers: string;
  focusFlow: 'TOKEN_FLOW' | 'COOKIE_FLOW' | 'ROUTING_FLOW' | 'UI_FLOW';
  componentTouched: string;
  checklist: string[];
  validation: string[];
  commsNotes: string[];
}

const defaultPlan: P1PatchPlan = {
  incidentId: 'P1-XXXX',
  severity: 'P1',
  owner: 'assign-owner',
  affectedUsers: '<10% (estimated)',
  focusFlow: 'ROUTING_FLOW',
  componentTouched: 'server/app.ts',
  checklist: [
    'Confirm reproduction path with ALPHA logs',
    'Draft one-line mitigation (no refactor)',
    'Prepare diff screenshot for Slack approval',
  ],
  validation: [
    'npm run test -- auth --runInBand',
    'curl -I "$QA_BASE_URL/?watch=P1"',
  ],
  commsNotes: [
    'Share ETA + rollback readiness',
    'Post metrics delta after deploy (latency, health)',
  ],
};

export function createP1PatchPlan(overrides: Partial<P1PatchPlan> = {}): P1PatchPlan {
  return {
    ...defaultPlan,
    ...overrides,
    checklist: overrides.checklist ?? defaultPlan.checklist,
    validation: overrides.validation ?? defaultPlan.validation,
    commsNotes: overrides.commsNotes ?? defaultPlan.commsNotes,
  };
}

export function printP1PatchPlan(plan: P1PatchPlan): void {
  console.info('\n[war-room] P1 Patch Checklist');
  console.info(plan);
}

const entryUrl = pathToFileURL(process.argv[1] ?? '').href;
if (import.meta.url === entryUrl) {
  printP1PatchPlan(createP1PatchPlan());
}
