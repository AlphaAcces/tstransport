/**
 * KPI Aggregator Service
 *
 * Aggregates and groups KPI results by category.
 * Provides summary statistics and overall status calculations.
 */

import type {
  KpiDefinition,
  KpiResult,
  KpiAggregation,
  KpiCalculationInput,
  KpiCalculationOptions,
  KpiCategory,
  KpiStatus,
} from '../types';
import { executeCalculator } from './kpiCalculator';
import { FINANCIAL_KPIS } from '../registry/financialKpis';
import { RISK_KPIS } from '../registry/riskKpis';
import { OPERATIONAL_KPIS } from '../registry/operationalKpis';

/**
 * Get all registered KPI definitions
 */
export function getAllKpiDefinitions(): KpiDefinition[] {
  return [...FINANCIAL_KPIS, ...RISK_KPIS, ...OPERATIONAL_KPIS];
}

/**
 * Get KPI definitions by category
 */
export function getKpisByCategory(category: KpiCategory): KpiDefinition[] {
  return getAllKpiDefinitions().filter(kpi => kpi.category === category);
}

/**
 * Get a specific KPI definition by ID
 */
export function getKpiById(id: string): KpiDefinition | undefined {
  return getAllKpiDefinitions().find(kpi => kpi.id === id);
}

/**
 * Calculate a single KPI result
 */
export function calculateKpi(
  definition: KpiDefinition,
  input: KpiCalculationInput,
  options?: KpiCalculationOptions
): KpiResult {
  const calculated = executeCalculator(definition.calculatorFn, input);

  return {
    definition,
    value: calculated.value ?? null,
    formattedValue: '', // Will be formatted by the hook using i18n
    unitSuffix: calculated.context,
    status: calculated.status ?? 'normal',
    trend: calculated.trend,
    changePercent: calculated.changePercent,
    trendData: options?.includeTrend !== false ? calculated.trendData : undefined,
    context: calculated.context,
  };
}

/**
 * Calculate multiple KPIs
 */
export function calculateKpis(
  definitions: KpiDefinition[],
  input: KpiCalculationInput,
  options?: KpiCalculationOptions
): KpiResult[] {
  return definitions.map(def => calculateKpi(def, input, options));
}

/**
 * Determine overall status from multiple KPI statuses
 */
export function determineOverallStatus(statuses: KpiStatus[]): KpiStatus {
  if (statuses.includes('critical')) return 'critical';
  if (statuses.includes('warning')) return 'warning';
  if (statuses.every(s => s === 'good')) return 'good';
  return 'normal';
}

/**
 * Aggregate KPI results by category
 */
export function aggregateByCategory(
  results: KpiResult[]
): Map<KpiCategory, KpiAggregation> {
  const aggregations = new Map<KpiCategory, KpiAggregation>();

  // Group results by category
  const grouped = new Map<KpiCategory, KpiResult[]>();
  for (const result of results) {
    const category = result.definition.category;
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(result);
  }

  // Create aggregations
  for (const [category, kpis] of grouped) {
    const statuses = kpis.map(k => k.status);
    aggregations.set(category, {
      category,
      kpis,
      overallStatus: determineOverallStatus(statuses),
      criticalCount: statuses.filter(s => s === 'critical').length,
      warningCount: statuses.filter(s => s === 'warning').length,
    });
  }

  return aggregations;
}

/**
 * Calculate all KPIs and return aggregated results
 */
export function calculateAllKpis(
  input: KpiCalculationInput,
  options?: KpiCalculationOptions
): {
  results: KpiResult[];
  aggregations: Map<KpiCategory, KpiAggregation>;
  overallStatus: KpiStatus;
  criticalCount: number;
  warningCount: number;
} {
  const definitions = getAllKpiDefinitions();
  const results = calculateKpis(definitions, input, options);
  const aggregations = aggregateByCategory(results);

  const allStatuses = results.map(r => r.status);

  return {
    results,
    aggregations,
    overallStatus: determineOverallStatus(allStatuses),
    criticalCount: allStatuses.filter(s => s === 'critical').length,
    warningCount: allStatuses.filter(s => s === 'warning').length,
  };
}

/**
 * Get a subset of KPIs for dashboard display
 */
export function getDashboardKpis(
  input: KpiCalculationInput,
  kpiIds: string[]
): KpiResult[] {
  const definitions = kpiIds
    .map(id => getKpiById(id))
    .filter((def): def is KpiDefinition => def !== undefined);

  return calculateKpis(definitions, input, { includeTrend: true });
}
