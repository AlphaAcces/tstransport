import { describe, it, expect } from 'vitest';
import { createExecutiveExportPayload } from '../executive';

const sampleSummary = {
  financial: {
    latestYear: 2024,
    grossProfit: 3_000_000,
    profitAfterTax: 1_200_000,
    yoyGrossChange: 5.5,
    yoyProfitChange: -1.2,
    dso: 33,
    liquidity: 500_000,
    intercompanyLoans: 0,
    alerts: [{ id: 'a1', label: 'Alert', value: 1000, unit: 'DKK', description: 'Test' }],
  },
  risk: {
    taxCaseExposure: null,
    complianceIssue: '',
    redFlags: ['Flag 1'],
    riskScores: [{ category: 'Financial', riskLevel: 'MODERAT', justification: 'Justify' }],
  },
  actions: {
    upcomingDeadlines: [{ id: 'd1', title: 'Deadline', priority: 'Påkrævet' }],
    boardActionables: [],
    criticalEvents: [],
    upcomingEvents: [],
  },
};

describe('createExecutiveExportPayload', () => {
  it('creates a well-formed export payload', () => {
    const payload = createExecutiveExportPayload('tsl', sampleSummary as any);

    expect(payload.subject).toBe('tsl');
    expect(typeof payload.generatedAt).toBe('string');
    expect(payload.financial.grossProfit).toBe(3_000_000);
    expect(Array.isArray(payload.financial.alerts)).toBe(true);
    expect(payload.risk.redFlags).toEqual(['Flag 1']);

    // Ensure deep-copies: modifying original shouldn't change payload
    (sampleSummary.financial.alerts[0] as any).label = 'Mutated';
    expect(payload.financial.alerts[0].label).toBe('Alert');
  });
});
