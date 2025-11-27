/**
 * KPI Calculator Service
 *
 * Core calculation logic for all KPIs.
 * All business logic for computing KPI values is centralized here.
 */

import type {
  KpiCalculationInput,
  KpiResult,
  KpiTrendPoint,
  KpiTrend,
} from '../types';
import { evaluateThreshold, FINANCIAL_THRESHOLDS, RISK_THRESHOLDS, OPERATIONAL_THRESHOLDS } from './kpiThresholds';
import type { FinancialYear, RiskScore } from '../../../types';

/**
 * Calculate percentage change between two values
 */
export function calculatePercentChange(current: number, previous: number): number | undefined {
  if (previous === 0) return undefined;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Determine trend direction from percentage change
 */
export function determineTrend(changePercent?: number): KpiTrend {
  if (changePercent === undefined) return 'stable';
  if (changePercent > 1) return 'up';
  if (changePercent < -1) return 'down';
  return 'stable';
}

/**
 * Get the latest and previous financial years from data
 */
export function getFinancialYearPair(data: FinancialYear[]): {
  latest: FinancialYear | null;
  previous: FinancialYear | null;
} {
  if (data.length === 0) return { latest: null, previous: null };

  const sorted = [...data].sort((a, b) => b.year - a.year);
  return {
    latest: sorted[0] ?? null,
    previous: sorted[1] ?? null,
  };
}

/**
 * Build trend data from financial years
 */
export function buildTrendData(
  data: FinancialYear[],
  valueExtractor: (year: FinancialYear) => number | null | undefined,
  periods: number = 5
): KpiTrendPoint[] {
  return [...data]
    .sort((a, b) => a.year - b.year)
    .slice(-periods)
    .map(year => ({
      period: year.year,
      value: valueExtractor(year) ?? 0,
    }));
}

// ============================================================================
// Financial KPI Calculators
// ============================================================================

/**
 * Calculate gross profit KPI
 */
export function calculateGrossProfit(input: KpiCalculationInput): Partial<KpiResult> {
  const { latest, previous } = getFinancialYearPair(input.financialData);
  const value = latest?.revenueOrGrossProfit ?? null;
  const previousValue = previous?.revenueOrGrossProfit ?? null;

  const changePercent = value !== null && previousValue !== null
    ? calculatePercentChange(value, previousValue)
    : undefined;

  return {
    value,
    changePercent,
    trend: determineTrend(changePercent),
    trendData: buildTrendData(input.financialData, y => y.revenueOrGrossProfit),
    status: evaluateThreshold(changePercent ?? 0, FINANCIAL_THRESHOLDS.yoyGrowth),
  };
}

/**
 * Calculate profit after tax KPI
 */
export function calculateProfitAfterTax(input: KpiCalculationInput): Partial<KpiResult> {
  const { latest, previous } = getFinancialYearPair(input.financialData);
  const value = latest?.profitAfterTax ?? null;
  const previousValue = previous?.profitAfterTax ?? null;

  const changePercent = value !== null && previousValue !== null
    ? calculatePercentChange(value, previousValue)
    : undefined;

  return {
    value,
    changePercent,
    trend: determineTrend(changePercent),
    trendData: buildTrendData(input.financialData, y => y.profitAfterTax),
    status: evaluateThreshold(changePercent ?? 0, FINANCIAL_THRESHOLDS.yoyGrowth),
  };
}

/**
 * Calculate equity KPI
 */
export function calculateEquity(input: KpiCalculationInput): Partial<KpiResult> {
  const { latest } = getFinancialYearPair(input.financialData);
  const value = latest?.equityEndOfYear ?? null;

  return {
    value,
    trendData: buildTrendData(input.financialData, y => y.equityEndOfYear),
    status: 'normal',
  };
}

/**
 * Calculate solidity (equity ratio) KPI
 */
export function calculateSolidity(input: KpiCalculationInput): Partial<KpiResult> {
  const { latest } = getFinancialYearPair(input.financialData);
  const value = latest?.solidity ?? null;

  return {
    value,
    status: evaluateThreshold(value, FINANCIAL_THRESHOLDS.solidity),
  };
}

/**
 * Calculate liquidity (cash) KPI
 */
export function calculateLiquidity(input: KpiCalculationInput): Partial<KpiResult> {
  const { latest } = getFinancialYearPair(input.financialData);
  const value = latest?.cash ?? input.cashflowSummary?.cashOnHand ?? null;

  return {
    value,
    status: evaluateThreshold(value, FINANCIAL_THRESHOLDS.liquidity),
  };
}

/**
 * Calculate DSO (Days Sales Outstanding) KPI
 */
export function calculateDso(input: KpiCalculationInput): Partial<KpiResult> {
  const { latest } = getFinancialYearPair(input.financialData);
  const value = latest?.dso ?? input.cashflowSummary?.dsoDays2024 ?? null;

  return {
    value,
    status: evaluateThreshold(value, FINANCIAL_THRESHOLDS.dso),
  };
}

/**
 * Calculate current ratio KPI
 */
export function calculateCurrentRatio(input: KpiCalculationInput): Partial<KpiResult> {
  const { latest } = getFinancialYearPair(input.financialData);
  const value = latest?.currentRatio ?? null;

  return {
    value,
    status: evaluateThreshold(value, FINANCIAL_THRESHOLDS.currentRatio),
  };
}

/**
 * Calculate EBIT margin KPI
 */
export function calculateEbitMargin(input: KpiCalculationInput): Partial<KpiResult> {
  const { latest } = getFinancialYearPair(input.financialData);
  const value = latest?.ebitMargin ?? null;

  return {
    value,
    status: evaluateThreshold(value, FINANCIAL_THRESHOLDS.ebitMargin),
  };
}

/**
 * Calculate net margin KPI
 */
export function calculateNetMargin(input: KpiCalculationInput): Partial<KpiResult> {
  const { latest } = getFinancialYearPair(input.financialData);
  const value = latest?.netMargin ?? null;

  return {
    value,
    status: evaluateThreshold(value, FINANCIAL_THRESHOLDS.profitMargin),
  };
}

// ============================================================================
// Risk KPI Calculators
// ============================================================================

/**
 * Calculate total risk score KPI
 */
export function calculateTotalRisk(input: KpiCalculationInput): Partial<KpiResult> {
  const { score, maxScore } = input.totalRiskScore;
  const percentOfMax = maxScore > 0 ? (score / maxScore) * 100 : 0;

  return {
    value: score,
    context: `${score}/${maxScore}`,
    status: evaluateThreshold(percentOfMax, RISK_THRESHOLDS.totalRiskPercent),
  };
}

/**
 * Calculate risk score for a specific category
 */
export function calculateCategoryRisk(
  input: KpiCalculationInput,
  category?: RiskScore['category']
): Partial<KpiResult> {
  if (!category) return { value: null, status: 'normal' };
  const riskData = input.riskHeatmapData.find(r => r.category === category);
  const value = riskData?.assignedScore ?? null;
  const maxScore = riskData?.maxScore ?? 20;

  return {
    value,
    context: value !== null ? `${value}/${maxScore}` : undefined,
    status: evaluateThreshold(value, RISK_THRESHOLDS.categoryRiskScore),
  };
}

/**
 * Get primary risk drivers (top 2 categories by score)
 */
export function getPrimaryRiskDrivers(input: KpiCalculationInput): RiskScore[] {
  return [...input.riskHeatmapData]
    .sort((a, b) => b.assignedScore - a.assignedScore)
    .slice(0, 2);
}

// ============================================================================
// Operational KPI Calculators
// ============================================================================

/**
 * Calculate employee count KPI
 */
export function calculateEmployeeCount(input: KpiCalculationInput): Partial<KpiResult> {
  const { latest } = getFinancialYearPair(input.financialData);
  const value = latest?.staffCount ?? null;

  return {
    value,
    status: evaluateThreshold(value, OPERATIONAL_THRESHOLDS.employeeCount),
  };
}

/**
 * Calculate profit per employee KPI
 */
export function calculateProfitPerEmployee(input: KpiCalculationInput): Partial<KpiResult> {
  const { latest } = getFinancialYearPair(input.financialData);
  const value = latest?.profitPerEmployee ?? null;

  return {
    value,
    status: evaluateThreshold(value, OPERATIONAL_THRESHOLDS.profitPerEmployee),
  };
}

// ============================================================================
// Calculator Registry
// ============================================================================

/**
 * Map of calculator function names to their implementations
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CALCULATOR_REGISTRY: Record<
  string,
  (input: KpiCalculationInput, ...args: any[]) => Partial<KpiResult>
> = {
  calculateGrossProfit,
  calculateProfitAfterTax,
  calculateEquity,
  calculateSolidity,
  calculateLiquidity,
  calculateDso,
  calculateCurrentRatio,
  calculateEbitMargin,
  calculateNetMargin,
  calculateTotalRisk,
  calculateCategoryRisk,
  calculateEmployeeCount,
  calculateProfitPerEmployee,
};

/**
 * Execute a calculator by name
 */
export function executeCalculator(
  calculatorName: string,
  input: KpiCalculationInput,
  ...args: unknown[]
): Partial<KpiResult> {
  const calculator = CALCULATOR_REGISTRY[calculatorName];
  if (!calculator) {
    console.warn(`Unknown KPI calculator: ${calculatorName}`);
    return { value: null, status: 'normal' };
  }
  return calculator(input, ...args);
}
