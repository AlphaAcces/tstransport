/**
 * KPI Aggregator Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  getAllKpiDefinitions,
  getKpisByCategory,
  getKpiById,
  calculateKpi,
  calculateKpis,
  aggregateByCategory,
  determineOverallStatus,
} from '../services/kpiAggregator';
import { FINANCIAL_KPIS } from '../registry/financialKpis';
import { RISK_KPIS } from '../registry/riskKpis';
import { OPERATIONAL_KPIS } from '../registry/operationalKpis';
import type { KpiCalculationInput, KpiResult, KpiStatus } from '../types';

// Mock input data
const mockInput: KpiCalculationInput = {
  financialData: [
    {
      year: 2024,
      revenueOrGrossProfit: 10000000,
      profitAfterTax: 500000,
      staffCount: 25,
      equityEndOfYear: 5000000,
      currentAssets: 2000000,
      cash: 800000,
      solidity: 35,
      dso: 45,
    },
  ],
  riskHeatmapData: [
    {
      category: 'Financial',
      maxScore: 20,
      assignedScore: 15,
      justification: 'High financial risk',
      riskLevel: 'HØJ',
      likelihood: 4,
      impact: 4,
      linkedHypotheses: [],
      linkedViews: [],
      linkedActions: [],
    },
  ],
  totalRiskScore: {
    score: 35,
    maxScore: 60,
    level: 'HØJ',
  },
};

describe('KPI Aggregator - Registry Functions', () => {
  describe('getAllKpiDefinitions', () => {
    it('returns all KPI definitions from all categories', () => {
      const definitions = getAllKpiDefinitions();
      const expectedCount = FINANCIAL_KPIS.length + RISK_KPIS.length + OPERATIONAL_KPIS.length;
      expect(definitions).toHaveLength(expectedCount);
    });

    it('includes KPIs from all categories', () => {
      const definitions = getAllKpiDefinitions();
      const categories = new Set(definitions.map(d => d.category));
      expect(categories.has('financial')).toBe(true);
      expect(categories.has('risk')).toBe(true);
      expect(categories.has('operational')).toBe(true);
    });
  });

  describe('getKpisByCategory', () => {
    it('returns only financial KPIs', () => {
      const kpis = getKpisByCategory('financial');
      expect(kpis.every(k => k.category === 'financial')).toBe(true);
      expect(kpis).toHaveLength(FINANCIAL_KPIS.length);
    });

    it('returns only risk KPIs', () => {
      const kpis = getKpisByCategory('risk');
      expect(kpis.every(k => k.category === 'risk')).toBe(true);
      expect(kpis).toHaveLength(RISK_KPIS.length);
    });

    it('returns empty array for unknown category', () => {
      // @ts-expect-error Testing invalid category
      const kpis = getKpisByCategory('unknown');
      expect(kpis).toHaveLength(0);
    });
  });

  describe('getKpiById', () => {
    it('finds KPI by ID', () => {
      const kpi = getKpiById('grossProfit');
      expect(kpi).toBeDefined();
      expect(kpi?.id).toBe('grossProfit');
      expect(kpi?.category).toBe('financial');
    });

    it('returns undefined for unknown ID', () => {
      const kpi = getKpiById('unknownKpi');
      expect(kpi).toBeUndefined();
    });
  });
});

describe('KPI Aggregator - Calculation Functions', () => {
  describe('calculateKpi', () => {
    it('calculates a single KPI', () => {
      const definition = getKpiById('grossProfit')!;
      const result = calculateKpi(definition, mockInput);

      expect(result.definition).toBe(definition);
      expect(result.value).toBe(10000000);
      expect(result.status).toBeDefined();
    });

    it('includes trend data when available', () => {
      const definition = getKpiById('grossProfit')!;
      const result = calculateKpi(definition, mockInput);

      expect(result.trendData).toBeDefined();
      expect(Array.isArray(result.trendData)).toBe(true);
    });
  });

  describe('calculateKpis', () => {
    it('calculates multiple KPIs', () => {
      const definitions = [getKpiById('grossProfit')!, getKpiById('profitAfterTax')!];
      const results = calculateKpis(definitions, mockInput);

      expect(results).toHaveLength(2);
      expect(results[0].definition.id).toBe('grossProfit');
      expect(results[1].definition.id).toBe('profitAfterTax');
    });

    it('handles empty definitions array', () => {
      const results = calculateKpis([], mockInput);
      expect(results).toHaveLength(0);
    });
  });
});

describe('KPI Aggregator - Status Functions', () => {
  describe('determineOverallStatus', () => {
    it('returns "critical" if any status is critical', () => {
      const statuses: KpiStatus[] = ['good', 'normal', 'critical', 'warning'];
      expect(determineOverallStatus(statuses)).toBe('critical');
    });

    it('returns "warning" if any status is warning (no critical)', () => {
      const statuses: KpiStatus[] = ['good', 'normal', 'warning', 'normal'];
      expect(determineOverallStatus(statuses)).toBe('warning');
    });

    it('returns "good" if all statuses are good', () => {
      const statuses: KpiStatus[] = ['good', 'good', 'good'];
      expect(determineOverallStatus(statuses)).toBe('good');
    });

    it('returns "normal" for mixed normal and good', () => {
      const statuses: KpiStatus[] = ['good', 'normal', 'normal'];
      expect(determineOverallStatus(statuses)).toBe('normal');
    });
  });

  describe('aggregateByCategory', () => {
    it('groups results by category', () => {
      const mockResults: KpiResult[] = [
        {
          definition: { id: 'kpi1', category: 'financial' } as any,
          value: 100,
          formattedValue: '100',
          status: 'good',
        },
        {
          definition: { id: 'kpi2', category: 'financial' } as any,
          value: 200,
          formattedValue: '200',
          status: 'warning',
        },
        {
          definition: { id: 'kpi3', category: 'risk' } as any,
          value: 50,
          formattedValue: '50',
          status: 'critical',
        },
      ];

      const aggregations = aggregateByCategory(mockResults);

      expect(aggregations.has('financial')).toBe(true);
      expect(aggregations.has('risk')).toBe(true);

      const financialAgg = aggregations.get('financial')!;
      expect(financialAgg.kpis).toHaveLength(2);
      expect(financialAgg.overallStatus).toBe('warning');
      expect(financialAgg.warningCount).toBe(1);

      const riskAgg = aggregations.get('risk')!;
      expect(riskAgg.kpis).toHaveLength(1);
      expect(riskAgg.overallStatus).toBe('critical');
      expect(riskAgg.criticalCount).toBe(1);
    });
  });
});

describe('KPI Aggregator - Integration', () => {
  it('calculates all KPIs without errors', () => {
    const definitions = getAllKpiDefinitions();

    // Should not throw
    expect(() => {
      calculateKpis(definitions, mockInput);
    }).not.toThrow();
  });

  it('produces valid results for all financial KPIs', () => {
    const results = calculateKpis(FINANCIAL_KPIS, mockInput);

    results.forEach(result => {
      expect(result.definition).toBeDefined();
      expect(['critical', 'warning', 'normal', 'good']).toContain(result.status);
    });
  });
});
