/**
 * Financial KPI Definitions
 *
 * Registry of all financial KPIs with their configurations.
 */

import type { KpiDefinition } from '../types';
import { FINANCIAL_THRESHOLDS } from '../services/kpiThresholds';

/**
 * All financial KPI definitions
 */
export const FINANCIAL_KPIS: KpiDefinition[] = [
  {
    id: 'grossProfit',
    nameKey: 'kpi.financial.grossProfit.name',
    descriptionKey: 'kpi.financial.grossProfit.description',
    category: 'financial',
    unit: 'currency',
    thresholds: FINANCIAL_THRESHOLDS.yoyGrowth,
    calculatorFn: 'calculateGrossProfit',
    linkedViews: ['financials', 'executive'],
    supportsTrend: true,
    showSparkline: true,
  },
  {
    id: 'profitAfterTax',
    nameKey: 'kpi.financial.profitAfterTax.name',
    descriptionKey: 'kpi.financial.profitAfterTax.description',
    category: 'financial',
    unit: 'currency',
    thresholds: FINANCIAL_THRESHOLDS.yoyGrowth,
    calculatorFn: 'calculateProfitAfterTax',
    linkedViews: ['financials', 'executive', 'dashboard'],
    supportsTrend: true,
    showSparkline: true,
  },
  {
    id: 'equity',
    nameKey: 'kpi.financial.equity.name',
    descriptionKey: 'kpi.financial.equity.description',
    category: 'financial',
    unit: 'currency',
    calculatorFn: 'calculateEquity',
    linkedViews: ['financials', 'dashboard'],
    supportsTrend: true,
    showSparkline: true,
  },
  {
    id: 'solidity',
    nameKey: 'kpi.financial.solidity.name',
    descriptionKey: 'kpi.financial.solidity.description',
    category: 'financial',
    unit: 'percent',
    thresholds: FINANCIAL_THRESHOLDS.solidity,
    calculatorFn: 'calculateSolidity',
    linkedViews: ['financials'],
  },
  {
    id: 'liquidity',
    nameKey: 'kpi.financial.liquidity.name',
    descriptionKey: 'kpi.financial.liquidity.description',
    category: 'financial',
    unit: 'currency',
    thresholds: FINANCIAL_THRESHOLDS.liquidity,
    calculatorFn: 'calculateLiquidity',
    linkedViews: ['cashflow', 'dashboard'],
  },
  {
    id: 'dso',
    nameKey: 'kpi.financial.dso.name',
    descriptionKey: 'kpi.financial.dso.description',
    category: 'financial',
    unit: 'days',
    thresholds: FINANCIAL_THRESHOLDS.dso,
    calculatorFn: 'calculateDso',
    linkedViews: ['cashflow', 'executive'],
  },
  {
    id: 'currentRatio',
    nameKey: 'kpi.financial.currentRatio.name',
    descriptionKey: 'kpi.financial.currentRatio.description',
    category: 'financial',
    unit: 'ratio',
    thresholds: FINANCIAL_THRESHOLDS.currentRatio,
    calculatorFn: 'calculateCurrentRatio',
    linkedViews: ['financials'],
  },
  {
    id: 'ebitMargin',
    nameKey: 'kpi.financial.ebitMargin.name',
    descriptionKey: 'kpi.financial.ebitMargin.description',
    category: 'financial',
    unit: 'percent',
    thresholds: FINANCIAL_THRESHOLDS.ebitMargin,
    calculatorFn: 'calculateEbitMargin',
    linkedViews: ['financials', 'sector'],
  },
  {
    id: 'netMargin',
    nameKey: 'kpi.financial.netMargin.name',
    descriptionKey: 'kpi.financial.netMargin.description',
    category: 'financial',
    unit: 'percent',
    thresholds: FINANCIAL_THRESHOLDS.profitMargin,
    calculatorFn: 'calculateNetMargin',
    linkedViews: ['financials'],
  },
];

/**
 * Get financial KPI by ID
 */
export function getFinancialKpi(id: string): KpiDefinition | undefined {
  return FINANCIAL_KPIS.find(kpi => kpi.id === id);
}

/**
 * IDs of KPIs to show on dashboard for corporate cases
 */
export const DASHBOARD_CORPORATE_KPIS = [
  'profitAfterTax',
  'equity',
  'liquidity',
];

/**
 * IDs of KPIs to show in executive summary
 */
export const EXECUTIVE_SUMMARY_KPIS = [
  'grossProfit',
  'profitAfterTax',
  'dso',
  'liquidity',
];
