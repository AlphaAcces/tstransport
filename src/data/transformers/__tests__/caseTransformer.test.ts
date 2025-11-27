/**
 * Case Transformer Tests
 *
 * Unit tests for data transformation and enrichment.
 */

import { describe, it, expect } from 'vitest';
import {
  transformCaseData,
  enrichTimelineWithViews,
  sortFinancialsByYear,
  sortTimelineByDate,
  filterActionsByStatus,
  groupRisksByCategory,
  type RawCaseData,
} from '../caseTransformer';
import type { ActionItem, FinancialYear, RiskScore, TimelineEvent } from '../../../types';

describe('caseTransformer', () => {
  describe('transformCaseData', () => {
    it('transforms empty raw data to CaseData with defaults', () => {
      const result = transformCaseData({});
      expect(result.data.personData.name).toBe('Unknown');
      expect(result.data.totalRiskScore.level).toBe('N/A');
      expect(result.data.companiesData).toEqual([]);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('preserves provided data', () => {
      const raw: RawCaseData = {
        personData: { name: 'Test Person', aliases: ['Alias'] },
        companiesData: [{ id: '1', name: 'Test Co' } as any],
      };
      const result = transformCaseData(raw);
      expect(result.data.personData.name).toBe('Test Person');
      expect(result.data.companiesData[0].name).toBe('Test Co');
    });

    it('merges defaults with partial data', () => {
      const raw: RawCaseData = {
        personData: { name: 'Test' },
        totalRiskScore: { score: 50 },
      };
      const result = transformCaseData(raw);
      expect(result.data.personData.name).toBe('Test');
      expect(result.data.personData.aliases).toEqual([]);
      expect(result.data.totalRiskScore.score).toBe(50);
      expect(result.data.totalRiskScore.maxScore).toBe(100);
    });

    it('generates warnings for missing data', () => {
      const result = transformCaseData({});
      expect(result.warnings).toContain('personData.name is missing or empty');
      expect(result.warnings).toContain('companiesData is empty');
      expect(result.warnings).toContain('financialData is empty');
    });

    it('validates the transformed data', () => {
      const result = transformCaseData({});
      expect(result.validation).toBeDefined();
      expect(typeof result.validation.valid).toBe('boolean');
    });

    it('transforms executive summary with partial data', () => {
      const raw: RawCaseData = {
        executiveSummary: {
          financial: { latestYear: 2024 } as any,
        },
      };
      const result = transformCaseData(raw);
      expect(result.data.executiveSummary.financial.latestYear).toBe(2024);
      expect(result.data.executiveSummary.risk.riskScores).toEqual([]);
    });
  });

  describe('enrichTimelineWithViews', () => {
    it('adds linked views for Finansiel events', () => {
      const events: TimelineEvent[] = [{
        date: '2024-01-01',
        type: 'Finansiel',
        title: 'Test',
        description: 'Test',
        source: 'Test',
      }];
      const enriched = enrichTimelineWithViews(events);
      expect(enriched[0].linkedViews).toContain('financials');
      expect(enriched[0].linkedViews).toContain('cashflow');
    });

    it('adds linked views for Struktur events', () => {
      const events: TimelineEvent[] = [{
        date: '2024-01-01',
        type: 'Struktur',
        title: 'Test',
        description: 'Test',
        source: 'Test',
      }];
      const enriched = enrichTimelineWithViews(events);
      expect(enriched[0].linkedViews).toContain('companies');
      expect(enriched[0].linkedViews).toContain('person');
    });

    it('adds linked views for Compliance events', () => {
      const events: TimelineEvent[] = [{
        date: '2024-01-01',
        type: 'Compliance',
        title: 'Test',
        description: 'Test',
        source: 'Test',
      }];
      const enriched = enrichTimelineWithViews(events);
      expect(enriched[0].linkedViews).toContain('risk');
      expect(enriched[0].linkedViews).toContain('actions');
    });

    it('preserves existing linkedViews for unknown types', () => {
      const events: TimelineEvent[] = [{
        date: '2024-01-01',
        type: 'Etablering',
        title: 'Test',
        description: 'Test',
        source: 'Test',
        linkedViews: ['dashboard'],
      }];
      const enriched = enrichTimelineWithViews(events);
      expect(enriched[0].linkedViews).toEqual(['dashboard']);
    });
  });

  describe('sortFinancialsByYear', () => {
    it('sorts financial data by year descending', () => {
      const data: FinancialYear[] = [
        { year: 2022, revenueOrGrossProfit: 100, profitAfterTax: 10, staffCount: 5, equityEndOfYear: 50, currentAssets: 20 },
        { year: 2024, revenueOrGrossProfit: 120, profitAfterTax: 15, staffCount: 6, equityEndOfYear: 60, currentAssets: 25 },
        { year: 2023, revenueOrGrossProfit: 110, profitAfterTax: 12, staffCount: 5, equityEndOfYear: 55, currentAssets: 22 },
      ];
      const sorted = sortFinancialsByYear(data);
      expect(sorted[0].year).toBe(2024);
      expect(sorted[1].year).toBe(2023);
      expect(sorted[2].year).toBe(2022);
    });

    it('does not mutate original array', () => {
      const data: FinancialYear[] = [
        { year: 2022, revenueOrGrossProfit: 100, profitAfterTax: 10, staffCount: 5, equityEndOfYear: 50, currentAssets: 20 },
        { year: 2024, revenueOrGrossProfit: 120, profitAfterTax: 15, staffCount: 6, equityEndOfYear: 60, currentAssets: 25 },
      ];
      const sorted = sortFinancialsByYear(data);
      expect(data[0].year).toBe(2022);
      expect(sorted[0].year).toBe(2024);
    });
  });

  describe('sortTimelineByDate', () => {
    it('sorts timeline events by date descending', () => {
      const events: TimelineEvent[] = [
        { date: '2024-01-01', type: 'Finansiel', title: 'A', description: '', source: '' },
        { date: '2024-03-01', type: 'Finansiel', title: 'C', description: '', source: '' },
        { date: '2024-02-01', type: 'Finansiel', title: 'B', description: '', source: '' },
      ];
      const sorted = sortTimelineByDate(events);
      expect(sorted[0].title).toBe('C');
      expect(sorted[1].title).toBe('B');
      expect(sorted[2].title).toBe('A');
    });

    it('does not mutate original array', () => {
      const events: TimelineEvent[] = [
        { date: '2024-01-01', type: 'Finansiel', title: 'A', description: '', source: '' },
        { date: '2024-03-01', type: 'Finansiel', title: 'C', description: '', source: '' },
      ];
      const sorted = sortTimelineByDate(events);
      expect(events[0].title).toBe('A');
      expect(sorted[0].title).toBe('C');
    });
  });

  describe('filterActionsByStatus', () => {
    const actions: ActionItem[] = [
      { id: '1', title: 'A', category: 'Finansiel', priority: 'Høj', description: '', evidenceType: '', status: 'Ikke startet' },
      { id: '2', title: 'B', category: 'Finansiel', priority: 'Høj', description: '', evidenceType: '', status: 'I gang' },
      { id: '3', title: 'C', category: 'Finansiel', priority: 'Høj', description: '', evidenceType: '', status: 'Afsluttet' },
    ];

    it('filters by single status', () => {
      const filtered = filterActionsByStatus(actions, ['I gang']);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('B');
    });

    it('filters by multiple statuses', () => {
      const filtered = filterActionsByStatus(actions, ['Ikke startet', 'I gang']);
      expect(filtered).toHaveLength(2);
    });

    it('returns empty array for no matches', () => {
      const filtered = filterActionsByStatus([], ['I gang']);
      expect(filtered).toHaveLength(0);
    });
  });

  describe('groupRisksByCategory', () => {
    it('groups risks by category', () => {
      const risks: RiskScore[] = [
        { category: 'Financial', maxScore: 25, assignedScore: 15, justification: '', riskLevel: 'MODERAT', likelihood: 3, impact: 3, linkedHypotheses: [], linkedViews: [], linkedActions: [] },
        { category: 'Governance', maxScore: 25, assignedScore: 10, justification: '', riskLevel: 'LAV', likelihood: 2, impact: 2, linkedHypotheses: [], linkedViews: [], linkedActions: [] },
      ];
      const grouped = groupRisksByCategory(risks);
      expect(grouped['Financial']?.assignedScore).toBe(15);
      expect(grouped['Governance']?.assignedScore).toBe(10);
      expect(grouped['Legal/Compliance']).toBeUndefined();
    });

    it('handles empty array', () => {
      const grouped = groupRisksByCategory([]);
      expect(Object.keys(grouped)).toHaveLength(0);
    });
  });
});
