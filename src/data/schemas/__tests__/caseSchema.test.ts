/**
 * Case Schema Tests
 *
 * Unit tests for CaseData validation.
 */

import { describe, it, expect } from 'vitest';
import { validateCaseData, isCaseData, assertCaseData } from '../caseSchema';

describe('caseSchema', () => {
  describe('validateCaseData', () => {
    it('returns valid for complete CaseData', () => {
      const validData = createValidCaseData();
      const result = validateCaseData(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns invalid for non-object input', () => {
      const result = validateCaseData(null);
      expect(result.valid).toBe(false);
      expect(result.errors[0].path).toBe('root');
    });

    it('returns invalid for string input', () => {
      const result = validateCaseData('not an object');
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('must be an object');
    });

    it('reports missing personData.name', () => {
      const data = createValidCaseData();
      delete (data.personData as Record<string, unknown>).name;
      const result = validateCaseData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path === 'personData.name')).toBe(true);
    });

    it('reports invalid personData type', () => {
      const data = { ...createValidCaseData(), personData: 'not an object' };
      const result = validateCaseData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path === 'personData')).toBe(true);
    });

    it('reports missing companiesData fields', () => {
      const data = createValidCaseData();
      data.companiesData = [{ id: '1' } as any]; // Missing required fields
      const result = validateCaseData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path.includes('companiesData[0]'))).toBe(true);
    });

    it('reports invalid risk category', () => {
      const data = createValidCaseData();
      data.riskHeatmapData = [{
        category: 'InvalidCategory' as any,
        maxScore: 25,
        assignedScore: 10,
        justification: 'Test',
        riskLevel: 'MODERAT',
        likelihood: 3,
        impact: 3,
        linkedHypotheses: [],
        linkedViews: [],
        linkedActions: [],
      }];
      const result = validateCaseData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path.includes('category'))).toBe(true);
    });

    it('reports invalid risk level', () => {
      const data = createValidCaseData();
      data.riskHeatmapData = [{
        category: 'Financial',
        maxScore: 25,
        assignedScore: 10,
        justification: 'Test',
        riskLevel: 'INVALID' as any,
        likelihood: 3,
        impact: 3,
        linkedHypotheses: [],
        linkedViews: [],
        linkedActions: [],
      }];
      const result = validateCaseData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path.includes('riskLevel'))).toBe(true);
    });

    it('reports invalid timeline event type', () => {
      const data = createValidCaseData();
      data.timelineData = [{
        date: '2024-01-01',
        type: 'InvalidType' as any,
        title: 'Test',
        description: 'Test',
        source: 'Test',
      }];
      const result = validateCaseData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path.includes('type'))).toBe(true);
    });

    it('reports invalid action category', () => {
      const data = createValidCaseData();
      data.actionsData = [{
        id: '1',
        title: 'Test',
        category: 'InvalidCategory' as any,
        priority: 'Høj',
        description: 'Test',
        evidenceType: 'Test',
        status: 'Ikke startet',
      }];
      const result = validateCaseData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path.includes('category'))).toBe(true);
    });

    it('reports missing totalRiskScore', () => {
      const data = createValidCaseData();
      delete (data as Record<string, unknown>).totalRiskScore;
      const result = validateCaseData(data);
      expect(result.valid).toBe(false);
    });

    it('reports missing executiveSummary fields', () => {
      const data = createValidCaseData();
      data.executiveSummary = {} as any;
      const result = validateCaseData(data);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path.includes('executiveSummary'))).toBe(true);
    });
  });

  describe('isCaseData', () => {
    it('returns true for valid CaseData', () => {
      const data = createValidCaseData();
      expect(isCaseData(data)).toBe(true);
    });

    it('returns false for invalid data', () => {
      expect(isCaseData(null)).toBe(false);
      expect(isCaseData({})).toBe(false);
      expect(isCaseData({ personData: {} })).toBe(false);
    });
  });

  describe('assertCaseData', () => {
    it('does not throw for valid CaseData', () => {
      const data = createValidCaseData();
      expect(() => assertCaseData(data)).not.toThrow();
    });

    it('throws for invalid data', () => {
      expect(() => assertCaseData(null)).toThrow('Invalid CaseData');
    });

    it('includes error details in thrown error', () => {
      try {
        assertCaseData({});
      } catch (e) {
        expect((e as Error).message).toContain('personData');
      }
    });
  });
});

// ============================================================================
// Test Helpers
// ============================================================================

function createValidCaseData() {
  return {
    personData: {
      name: 'Test Person',
      aliases: ['Alias 1'],
      birthYear: '1980',
      currentAddress: 'Test Address',
      addressHistory: [],
      primaryRole: 'Director',
      uboStatus: 'UBO',
      pepStatus: 'Not PEP',
      sanctionsScreening: 'Clear',
      socmintProfile: 'Low',
    },
    companiesData: [{
      id: '1',
      name: 'Test Company',
      cvr: '12345678',
      role: 'Drift (Vognmand)' as const,
      industryCode: '49410',
      established: '2010-01-01',
      owner: 'Test Person',
      director: 'Test Person',
      auditor: 'Test Auditor',
      status: 'Aktiv' as const,
      notes: '',
    }],
    financialData: [{
      year: 2024,
      revenueOrGrossProfit: 1000000,
      profitAfterTax: 100000,
      staffCount: 10,
      equityEndOfYear: 500000,
      currentAssets: 200000,
    }],
    hypothesesData: [{
      id: '1',
      title: 'Test Hypothesis',
      summary: 'Summary',
      description: ['Description'],
      analysisNote: 'Analysis',
      status: 'Åben' as const,
      category: 'Finansiel' as const,
      impact: 'Middel' as const,
      evidenceLevel: 'Indikation' as const,
      relatedViews: ['financials'],
    }],
    riskHeatmapData: [{
      category: 'Financial' as const,
      maxScore: 25,
      assignedScore: 15,
      justification: 'Test',
      riskLevel: 'MODERAT' as const,
      likelihood: 3,
      impact: 4,
      linkedHypotheses: [],
      linkedViews: [],
      linkedActions: [],
    }],
    totalRiskScore: {
      score: 60,
      maxScore: 100,
      level: 'MODERAT' as const,
      summary: 'Moderate risk profile',
    },
    relationRiskData: [],
    timelineData: [{
      date: '2024-01-01',
      type: 'Finansiel' as const,
      title: 'Test Event',
      description: 'Description',
      source: 'Test',
    }],
    actionsData: [{
      id: '1',
      title: 'Test Action',
      category: 'Finansiel' as const,
      priority: 'Høj' as const,
      description: 'Description',
      evidenceType: 'Document',
      status: 'Ikke startet' as const,
    }],
    cashflowYearlyData: [],
    cashflowSummary: {
      cashOnHand: 100000,
      internalReceivables: 50000,
      dsoDays2024: 45,
      potentialTaxClaim: 0,
    },
    sectorBenchmarkYearlyData: [],
    sectorComparisonData: [],
    sectorDriversData: [],
    macroRiskData: [],
    networkNodes: [],
    networkEdges: [],
    counterpartiesData: [],
    scenariosData: [],
    executiveSummary: {
      financial: {
        latestYear: 2024,
        grossProfit: 1000000,
        profitAfterTax: 100000,
        yoyGrossChange: 5,
        yoyProfitChange: 10,
        dso: 45,
        liquidity: 200000,
        intercompanyLoans: 0,
        trendGrossProfit: [],
        trendProfitAfterTax: [],
        alerts: [],
      },
      risk: {
        taxCaseExposure: null,
        complianceIssue: '',
        sectorRiskSummary: '',
        riskScores: [],
        redFlags: [],
      },
      actions: {
        upcomingDeadlines: [],
        boardActionables: [],
        criticalEvents: [],
        upcomingEvents: [],
      },
    },
  };
}
