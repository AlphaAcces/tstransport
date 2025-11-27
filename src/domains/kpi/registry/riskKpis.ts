/**
 * Risk KPI Definitions
 *
 * Registry of all risk-related KPIs with their configurations.
 */

import type { KpiDefinition } from '../types';
import { RISK_THRESHOLDS } from '../services/kpiThresholds';

/**
 * All risk KPI definitions
 */
export const RISK_KPIS: KpiDefinition[] = [
  {
    id: 'totalRisk',
    nameKey: 'kpi.risk.totalRisk.name',
    descriptionKey: 'kpi.risk.totalRisk.description',
    category: 'risk',
    unit: 'score',
    thresholds: RISK_THRESHOLDS.totalRiskPercent,
    calculatorFn: 'calculateTotalRisk',
    linkedViews: ['risk', 'dashboard', 'executive'],
  },
  {
    id: 'legalComplianceRisk',
    nameKey: 'kpi.risk.legalCompliance.name',
    descriptionKey: 'kpi.risk.legalCompliance.description',
    category: 'risk',
    unit: 'score',
    thresholds: RISK_THRESHOLDS.categoryRiskScore,
    calculatorFn: 'calculateCategoryRisk',
    linkedViews: ['risk'],
  },
  {
    id: 'financialRisk',
    nameKey: 'kpi.risk.financial.name',
    descriptionKey: 'kpi.risk.financial.description',
    category: 'risk',
    unit: 'score',
    thresholds: RISK_THRESHOLDS.categoryRiskScore,
    calculatorFn: 'calculateCategoryRisk',
    linkedViews: ['risk'],
  },
  {
    id: 'governanceRisk',
    nameKey: 'kpi.risk.governance.name',
    descriptionKey: 'kpi.risk.governance.description',
    category: 'risk',
    unit: 'score',
    thresholds: RISK_THRESHOLDS.categoryRiskScore,
    calculatorFn: 'calculateCategoryRisk',
    linkedViews: ['risk'],
  },
  {
    id: 'sectorOperationsRisk',
    nameKey: 'kpi.risk.sectorOperations.name',
    descriptionKey: 'kpi.risk.sectorOperations.description',
    category: 'risk',
    unit: 'score',
    thresholds: RISK_THRESHOLDS.categoryRiskScore,
    calculatorFn: 'calculateCategoryRisk',
    linkedViews: ['risk', 'sector'],
  },
  {
    id: 'reputationRisk',
    nameKey: 'kpi.risk.reputation.name',
    descriptionKey: 'kpi.risk.reputation.description',
    category: 'risk',
    unit: 'score',
    thresholds: RISK_THRESHOLDS.categoryRiskScore,
    calculatorFn: 'calculateCategoryRisk',
    linkedViews: ['risk'],
  },
];

/**
 * Get risk KPI by ID
 */
export function getRiskKpi(id: string): KpiDefinition | undefined {
  return RISK_KPIS.find(kpi => kpi.id === id);
}

/**
 * Mapping from KPI ID to risk category for calculator
 */
export const RISK_KPI_CATEGORY_MAP: Record<string, string> = {
  legalComplianceRisk: 'Legal/Compliance',
  financialRisk: 'Financial',
  governanceRisk: 'Governance',
  sectorOperationsRisk: 'Sector/Operations',
  reputationRisk: 'SOCMINT/Reputation',
};

/**
 * IDs of KPIs to show on dashboard for personal cases
 */
export const DASHBOARD_PERSONAL_RISK_KPIS = [
  'totalRisk',
  'legalComplianceRisk',
  'financialRisk',
  'governanceRisk',
];
