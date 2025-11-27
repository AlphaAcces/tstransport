/**
 * KPI Calculator Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculatePercentChange,
  determineTrend,
  getFinancialYearPair,
  buildTrendData,
  calculateGrossProfit,
  calculateProfitAfterTax,
  calculateEquity,
  calculateLiquidity,
  calculateDso,
  calculateTotalRisk,
  getPrimaryRiskDrivers,
} from '../services/kpiCalculator';
import type { KpiCalculationInput } from '../types';
import type { FinancialYear, RiskScore } from '../../../types';

// Test data
const mockFinancialData: FinancialYear[] = [
  {
    year: 2022,
    revenueOrGrossProfit: 10000000,
    profitAfterTax: 500000,
    staffCount: 25,
    equityEndOfYear: 5000000,
    currentAssets: 2000000,
    cash: 800000,
    solidity: 35,
    dso: 45,
  },
  {
    year: 2023,
    revenueOrGrossProfit: 12000000,
    profitAfterTax: 750000,
    staffCount: 30,
    equityEndOfYear: 5750000,
    currentAssets: 2500000,
    cash: 600000,
    solidity: 38,
    dso: 52,
  },
  {
    year: 2024,
    revenueOrGrossProfit: 11500000,
    profitAfterTax: 400000,
    staffCount: 28,
    equityEndOfYear: 6150000,
    currentAssets: 2200000,
    cash: 350000,
    solidity: 40,
    dso: 65,
  },
];

const mockRiskData: RiskScore[] = [
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
  {
    category: 'Legal/Compliance',
    maxScore: 20,
    assignedScore: 12,
    justification: 'Moderate legal risk',
    riskLevel: 'MODERAT',
    likelihood: 3,
    impact: 4,
    linkedHypotheses: [],
    linkedViews: [],
    linkedActions: [],
  },
  {
    category: 'Governance',
    maxScore: 20,
    assignedScore: 8,
    justification: 'Low governance risk',
    riskLevel: 'LAV',
    likelihood: 2,
    impact: 3,
    linkedHypotheses: [],
    linkedViews: [],
    linkedActions: [],
  },
];

const mockInput: KpiCalculationInput = {
  financialData: mockFinancialData,
  riskHeatmapData: mockRiskData,
  totalRiskScore: {
    score: 35,
    maxScore: 60,
    level: 'HØJ',
  },
  cashflowSummary: {
    cashOnHand: 350000,
    internalReceivables: 1200000,
    dsoDays2024: 65,
    potentialTaxClaim: 500000,
  },
};

describe('KPI Calculator - Utility Functions', () => {
  describe('calculatePercentChange', () => {
    it('calculates positive percentage change correctly', () => {
      expect(calculatePercentChange(150, 100)).toBe(50);
    });

    it('calculates negative percentage change correctly', () => {
      expect(calculatePercentChange(50, 100)).toBe(-50);
    });

    it('handles zero previous value', () => {
      expect(calculatePercentChange(100, 0)).toBeUndefined();
    });

    it('handles negative to positive change', () => {
      // Going from -50 to 100 is a 300% increase (using absolute value of previous)
      expect(calculatePercentChange(100, -50)).toBe(300);
    });
  });

  describe('determineTrend', () => {
    it('returns "up" for positive change > 1%', () => {
      expect(determineTrend(5)).toBe('up');
    });

    it('returns "down" for negative change < -1%', () => {
      expect(determineTrend(-5)).toBe('down');
    });

    it('returns "stable" for small changes', () => {
      expect(determineTrend(0.5)).toBe('stable');
      expect(determineTrend(-0.5)).toBe('stable');
    });

    it('returns "stable" for undefined', () => {
      expect(determineTrend(undefined)).toBe('stable');
    });
  });

  describe('getFinancialYearPair', () => {
    it('returns latest and previous years sorted correctly', () => {
      const result = getFinancialYearPair(mockFinancialData);
      expect(result.latest?.year).toBe(2024);
      expect(result.previous?.year).toBe(2023);
    });

    it('handles empty array', () => {
      const result = getFinancialYearPair([]);
      expect(result.latest).toBeNull();
      expect(result.previous).toBeNull();
    });

    it('handles single year', () => {
      const result = getFinancialYearPair([mockFinancialData[0]]);
      expect(result.latest?.year).toBe(2022);
      expect(result.previous).toBeNull();
    });
  });

  describe('buildTrendData', () => {
    it('builds trend data with correct values', () => {
      const result = buildTrendData(mockFinancialData, y => y.profitAfterTax);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ period: 2022, value: 500000 });
      expect(result[2]).toEqual({ period: 2024, value: 400000 });
    });

    it('respects periods limit', () => {
      const result = buildTrendData(mockFinancialData, y => y.profitAfterTax, 2);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ period: 2023, value: 750000 });
    });

    it('handles null values', () => {
      const dataWithNull = [{ ...mockFinancialData[0], cash: undefined }];
      const result = buildTrendData(dataWithNull, y => y.cash);
      expect(result[0].value).toBe(0);
    });
  });
});

describe('KPI Calculator - Financial KPIs', () => {
  describe('calculateGrossProfit', () => {
    it('calculates gross profit from latest year', () => {
      const result = calculateGrossProfit(mockInput);
      expect(result.value).toBe(11500000);
    });

    it('calculates YoY change correctly', () => {
      const result = calculateGrossProfit(mockInput);
      // 11500000 vs 12000000 = -4.17%
      expect(result.changePercent).toBeCloseTo(-4.17, 1);
      expect(result.trend).toBe('down');
    });

    it('includes trend data', () => {
      const result = calculateGrossProfit(mockInput);
      expect(result.trendData).toHaveLength(3);
    });
  });

  describe('calculateProfitAfterTax', () => {
    it('calculates profit from latest year', () => {
      const result = calculateProfitAfterTax(mockInput);
      expect(result.value).toBe(400000);
    });

    it('calculates significant YoY decline', () => {
      const result = calculateProfitAfterTax(mockInput);
      // 400000 vs 750000 = -46.67%
      expect(result.changePercent).toBeCloseTo(-46.67, 1);
      expect(result.trend).toBe('down');
    });
  });

  describe('calculateEquity', () => {
    it('returns equity value from latest year', () => {
      const result = calculateEquity(mockInput);
      expect(result.value).toBe(6150000);
    });
  });

  describe('calculateLiquidity', () => {
    it('returns cash value from latest year', () => {
      const result = calculateLiquidity(mockInput);
      expect(result.value).toBe(350000);
    });

    it('falls back to cashflowSummary if no cash data', () => {
      const inputWithoutCash: KpiCalculationInput = {
        ...mockInput,
        financialData: mockFinancialData.map(y => ({ ...y, cash: undefined })),
      };
      const result = calculateLiquidity(inputWithoutCash);
      expect(result.value).toBe(350000); // From cashflowSummary
    });
  });

  describe('calculateDso', () => {
    it('returns DSO value from latest year', () => {
      const result = calculateDso(mockInput);
      expect(result.value).toBe(65);
    });

    it('evaluates threshold correctly for high DSO', () => {
      const result = calculateDso(mockInput);
      // 65 days > 60 (warning threshold) but < 90 (critical)
      expect(result.status).toBe('warning');
    });
  });
});

describe('KPI Calculator - Risk KPIs', () => {
  describe('calculateTotalRisk', () => {
    it('returns total risk score', () => {
      const result = calculateTotalRisk(mockInput);
      expect(result.value).toBe(35);
      expect(result.context).toBe('35/60');
    });

    it('evaluates status based on percentage of max', () => {
      const result = calculateTotalRisk(mockInput);
      // 35/60 = 58.3% > 50% (warning threshold)
      expect(result.status).toBe('warning');
    });
  });

  describe('getPrimaryRiskDrivers', () => {
    it('returns top 2 risk categories by score', () => {
      const result = getPrimaryRiskDrivers(mockInput);
      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('Financial');
      expect(result[1].category).toBe('Legal/Compliance');
    });
  });
});

describe('KPI Calculator - Edge Cases', () => {
  it('handles empty financial data', () => {
    const emptyInput: KpiCalculationInput = {
      ...mockInput,
      financialData: [],
    };
    const result = calculateGrossProfit(emptyInput);
    expect(result.value).toBeNull();
    expect(result.changePercent).toBeUndefined();
  });

  it('handles single year of data', () => {
    const singleYearInput: KpiCalculationInput = {
      ...mockInput,
      financialData: [mockFinancialData[0]],
    };
    const result = calculateProfitAfterTax(singleYearInput);
    expect(result.value).toBe(500000);
    expect(result.changePercent).toBeUndefined();
  });
});
