/**
 * KPI Module
 *
 * Central module for Key Performance Indicator calculations,
 * aggregations, and React hooks.
 */

// Types
export type {
  KpiCategory,
  KpiTrend,
  KpiStatus,
  KpiUnit,
  KpiThreshold,
  KpiDefinition,
  KpiTrendPoint,
  KpiResult,
  KpiAggregation,
  KpiCalculationInput,
  KpiCalculationOptions,
} from './types';

export type {
  CaseKpiMetric,
  CaseKpiSummary,
  KpiSeverity,
  KpiTrend as CaseKpiTrend,
} from './caseKpis';

export { KPI_STATUS_COLORS, RISK_LEVEL_TO_STATUS } from './types';
export { deriveKpisFromCaseData } from './caseKpis';

// Services
export {
  evaluateThreshold,
  getAllThresholds,
  FINANCIAL_THRESHOLDS,
  RISK_THRESHOLDS,
  OPERATIONAL_THRESHOLDS,
} from './services/kpiThresholds';

export {
  calculatePercentChange,
  determineTrend,
  getFinancialYearPair,
  buildTrendData,
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
  getPrimaryRiskDrivers,
  executeCalculator,
} from './services/kpiCalculator';

export {
  getAllKpiDefinitions,
  getKpisByCategory,
  getKpiById,
  calculateKpi,
  calculateKpis,
  calculateAllKpis,
  aggregateByCategory,
  getDashboardKpis,
  determineOverallStatus,
} from './services/kpiAggregator';

// Registry
export {
  FINANCIAL_KPIS,
  getFinancialKpi,
  DASHBOARD_CORPORATE_KPIS,
  EXECUTIVE_SUMMARY_KPIS,
} from './registry/financialKpis';

export {
  RISK_KPIS,
  getRiskKpi,
  RISK_KPI_CATEGORY_MAP,
  DASHBOARD_PERSONAL_RISK_KPIS,
} from './registry/riskKpis';

export {
  OPERATIONAL_KPIS,
  getOperationalKpi,
} from './registry/operationalKpis';

// Hooks
export {
  useKpi,
  useDashboardKpis,
  useExecutiveKpis,
} from './hooks/useKpi';
