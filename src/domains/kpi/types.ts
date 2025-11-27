/**
 * KPI Module Types
 *
 * Central type definitions for the KPI system.
 * Supports financial, risk, and operational KPIs with thresholds and alerts.
 */

import type { RiskScore, FinancialYear, CashflowSummary } from '../../types';

/**
 * Supported KPI categories
 */
export type KpiCategory = 'financial' | 'risk' | 'operational' | 'compliance';

/**
 * KPI trend direction
 */
export type KpiTrend = 'up' | 'down' | 'stable';

/**
 * KPI status based on thresholds
 */
export type KpiStatus = 'critical' | 'warning' | 'normal' | 'good';

/**
 * Unit types for KPI values
 */
export type KpiUnit = 'currency' | 'percent' | 'days' | 'count' | 'ratio' | 'score';

/**
 * Threshold configuration for a KPI
 */
export interface KpiThreshold {
  /** Value that triggers critical status */
  critical?: number;
  /** Value that triggers warning status */
  warning?: number;
  /** Value that triggers good status */
  good?: number;
  /** Whether higher values are better (default: true) */
  higherIsBetter?: boolean;
}

/**
 * Definition of a KPI metric
 */
export interface KpiDefinition {
  /** Unique identifier for the KPI */
  id: string;
  /** i18n key for the KPI name */
  nameKey: string;
  /** i18n key for the KPI description */
  descriptionKey?: string;
  /** Category of the KPI */
  category: KpiCategory;
  /** Unit of measurement */
  unit: KpiUnit;
  /** Threshold configuration */
  thresholds?: KpiThreshold;
  /** Calculator function name in kpiCalculator */
  calculatorFn: string;
  /** Related views for navigation */
  linkedViews?: string[];
  /** Whether this KPI supports trend calculation */
  supportsTrend?: boolean;
  /** Whether to show sparkline chart */
  showSparkline?: boolean;
}

/**
 * A single data point in a KPI trend
 */
export interface KpiTrendPoint {
  /** Year or period identifier */
  period: number;
  /** Value at this point */
  value: number;
}

/**
 * Computed KPI result
 */
export interface KpiResult {
  /** KPI definition reference */
  definition: KpiDefinition;
  /** Current computed value */
  value: number | null;
  /** Formatted display value */
  formattedValue: string;
  /** Optional unit suffix for display */
  unitSuffix?: string;
  /** Current status based on thresholds */
  status: KpiStatus;
  /** Trend direction compared to previous period */
  trend?: KpiTrend;
  /** Percentage change from previous period */
  changePercent?: number;
  /** Historical trend data for sparklines */
  trendData?: KpiTrendPoint[];
  /** Additional context or notes */
  context?: string;
}

/**
 * Aggregated KPI results by category
 */
export interface KpiAggregation {
  category: KpiCategory;
  kpis: KpiResult[];
  overallStatus: KpiStatus;
  criticalCount: number;
  warningCount: number;
}

/**
 * Input data for KPI calculations
 */
export interface KpiCalculationInput {
  financialData: FinancialYear[];
  riskHeatmapData: RiskScore[];
  totalRiskScore: {
    score: number;
    maxScore: number;
    level: 'KRITISK' | 'HØJ' | 'MODERAT' | 'LAV' | 'N/A';
  };
  cashflowSummary?: CashflowSummary;
}

/**
 * Options for KPI calculation
 */
export interface KpiCalculationOptions {
  /** Include trend data in results */
  includeTrend?: boolean;
  /** Number of periods to include in trend */
  trendPeriods?: number;
  /** Locale for formatting */
  locale?: string;
}

/**
 * Color mapping for KPI status
 */
export const KPI_STATUS_COLORS: Record<KpiStatus, string> = {
  critical: 'red',
  warning: 'orange',
  normal: 'yellow',
  good: 'green',
} as const;

/**
 * Risk level to KPI status mapping
 */
export const RISK_LEVEL_TO_STATUS: Record<string, KpiStatus> = {
  KRITISK: 'critical',
  HØJ: 'warning',
  MODERAT: 'normal',
  LAV: 'good',
  'N/A': 'normal',
} as const;
