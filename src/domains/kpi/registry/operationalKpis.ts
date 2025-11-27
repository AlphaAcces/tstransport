/**
 * Operational KPI Definitions
 *
 * Registry of all operational KPIs with their configurations.
 */

import type { KpiDefinition } from '../types';
import { OPERATIONAL_THRESHOLDS } from '../services/kpiThresholds';

/**
 * All operational KPI definitions
 */
export const OPERATIONAL_KPIS: KpiDefinition[] = [
  {
    id: 'employeeCount',
    nameKey: 'kpi.operational.employeeCount.name',
    descriptionKey: 'kpi.operational.employeeCount.description',
    category: 'operational',
    unit: 'count',
    thresholds: OPERATIONAL_THRESHOLDS.employeeCount,
    calculatorFn: 'calculateEmployeeCount',
    linkedViews: ['financials'],
  },
  {
    id: 'profitPerEmployee',
    nameKey: 'kpi.operational.profitPerEmployee.name',
    descriptionKey: 'kpi.operational.profitPerEmployee.description',
    category: 'operational',
    unit: 'currency',
    thresholds: OPERATIONAL_THRESHOLDS.profitPerEmployee,
    calculatorFn: 'calculateProfitPerEmployee',
    linkedViews: ['financials', 'sector'],
  },
];

/**
 * Get operational KPI by ID
 */
export function getOperationalKpi(id: string): KpiDefinition | undefined {
  return OPERATIONAL_KPIS.find(kpi => kpi.id === id);
}
