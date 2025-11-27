/**
 * Case Data Transformer
 *
 * Transforms raw domain data into a validated CaseData object.
 * Provides utilities for data normalization and enrichment.
 */

import type {
  CaseData,
  PersonData,
  Company,
  FinancialYear,
  Hypothesis,
  RiskScore,
  TotalRiskScore,
  RelationRisk,
  TimelineEvent,
  ActionItem,
  CashflowYear,
  CashflowSummary,
  SectorBenchmarkYear,
  SectorComparisonMetric,
  SectorDriver,
  MacroRisk,
  NetworkNode,
  NetworkEdge,
  Counterparty,
  Scenario,
  ExecutiveSummaryData,
  View,
} from '../../types';
import { validateCaseData, type ValidationResult } from '../schemas/caseSchema';

// ============================================================================
// Transformation Types
// ============================================================================

/**
 * Raw data input that may have partial or unvalidated fields.
 */
export interface RawCaseData {
  personData?: Partial<PersonData>;
  companiesData?: Partial<Company>[];
  financialData?: Partial<FinancialYear>[];
  hypothesesData?: Partial<Hypothesis>[];
  riskHeatmapData?: Partial<RiskScore>[];
  totalRiskScore?: Partial<TotalRiskScore>;
  relationRiskData?: Partial<RelationRisk>[];
  timelineData?: Partial<TimelineEvent>[];
  actionsData?: Partial<ActionItem>[];
  cashflowYearlyData?: Partial<CashflowYear>[];
  cashflowSummary?: Partial<CashflowSummary>;
  sectorBenchmarkYearlyData?: Partial<SectorBenchmarkYear>[];
  sectorComparisonData?: Partial<SectorComparisonMetric>[];
  sectorDriversData?: Partial<SectorDriver>[];
  macroRiskData?: Partial<MacroRisk>[];
  networkNodes?: Partial<NetworkNode>[];
  networkEdges?: Partial<NetworkEdge>[];
  counterpartiesData?: Partial<Counterparty>[];
  scenariosData?: Partial<Scenario>[];
  executiveSummary?: Partial<ExecutiveSummaryData>;
}

/**
 * Transform result with data and any warnings.
 */
export interface TransformResult {
  data: CaseData;
  warnings: string[];
  validation: ValidationResult;
}

// ============================================================================
// Default Values
// ============================================================================

const defaultPersonData: PersonData = {
  id: 'unknown',
  name: 'Unknown',
  aliases: [],
  birthYear: '',
  currentAddress: '',
  addressHistory: [],
  primaryRole: '',
  uboStatus: '',
  pepStatus: '',
  sanctionsScreening: '',
  socmintProfile: '',
};

const defaultTotalRiskScore: TotalRiskScore = {
  score: 0,
  maxScore: 100,
  level: 'N/A',
  summary: 'No risk assessment available',
};

const defaultCashflowSummary: CashflowSummary = {
  cashOnHand: 0,
  internalReceivables: 0,
  dsoDays2024: 0,
  potentialTaxClaim: 0,
};

const defaultExecutiveSummary: ExecutiveSummaryData = {
  financial: {
    latestYear: null,
    grossProfit: null,
    profitAfterTax: null,
    yoyGrossChange: null,
    yoyProfitChange: null,
    dso: null,
    liquidity: null,
    intercompanyLoans: null,
    trendGrossProfit: [],
    trendProfitAfterTax: [],
    alerts: [],
  },
  risk: {
    taxCaseExposure: null,
    complianceIssue: '',
    sectorRiskSummary: '',
    riskScores: [],
    redFlags: [],
  },
  actions: {
    upcomingDeadlines: [],
    boardActionables: [],
    criticalEvents: [],
    upcomingEvents: [],
  },
};

// ============================================================================
// Transformation Functions
// ============================================================================

/**
 * Transforms and validates raw data into a complete CaseData object.
 * Missing fields are filled with defaults and warnings are collected.
 */
export function transformCaseData(raw: RawCaseData): TransformResult {
  const warnings: string[] = [];

  // Transform with defaults
  const data: CaseData = {
    personData: {
      ...defaultPersonData,
      ...raw.personData,
    } as PersonData,
    companiesData: (raw.companiesData || []) as Company[],
    financialData: (raw.financialData || []) as FinancialYear[],
    hypothesesData: (raw.hypothesesData || []) as Hypothesis[],
    riskHeatmapData: (raw.riskHeatmapData || []) as RiskScore[],
    totalRiskScore: {
      ...defaultTotalRiskScore,
      ...raw.totalRiskScore,
    } as TotalRiskScore,
    relationRiskData: (raw.relationRiskData || []) as RelationRisk[],
    timelineData: (raw.timelineData || []) as TimelineEvent[],
    actionsData: (raw.actionsData || []) as ActionItem[],
    cashflowYearlyData: (raw.cashflowYearlyData || []) as CashflowYear[],
    cashflowSummary: {
      ...defaultCashflowSummary,
      ...raw.cashflowSummary,
    } as CashflowSummary,
    sectorBenchmarkYearlyData: (raw.sectorBenchmarkYearlyData || []) as SectorBenchmarkYear[],
    sectorComparisonData: (raw.sectorComparisonData || []) as SectorComparisonMetric[],
    sectorDriversData: (raw.sectorDriversData || []) as SectorDriver[],
    macroRiskData: (raw.macroRiskData || []) as MacroRisk[],
    networkNodes: (raw.networkNodes || []) as NetworkNode[],
    networkEdges: (raw.networkEdges || []) as NetworkEdge[],
    counterpartiesData: (raw.counterpartiesData || []) as Counterparty[],
    scenariosData: (raw.scenariosData || []) as Scenario[],
    executiveSummary: mergeExecutiveSummary(raw.executiveSummary),
  };

  // Collect warnings for missing or empty data
  if (!raw.personData?.name) {
    warnings.push('personData.name is missing or empty');
  }
  if (!raw.companiesData?.length) {
    warnings.push('companiesData is empty');
  }
  if (!raw.financialData?.length) {
    warnings.push('financialData is empty');
  }
  if (!raw.riskHeatmapData?.length) {
    warnings.push('riskHeatmapData is empty');
  }
  if (!raw.actionsData?.length) {
    warnings.push('actionsData is empty');
  }

  // Validate the transformed data
  const validation = validateCaseData(data);

  return {
    data,
    warnings,
    validation,
  };
}

/**
 * Merges partial executive summary with defaults.
 */
function mergeExecutiveSummary(partial?: Partial<ExecutiveSummaryData>): ExecutiveSummaryData {
  if (!partial) {
    return defaultExecutiveSummary;
  }

  return {
    financial: {
      ...defaultExecutiveSummary.financial,
      ...partial.financial,
    },
    risk: {
      ...defaultExecutiveSummary.risk,
      ...partial.risk,
    },
    actions: {
      ...defaultExecutiveSummary.actions,
      ...partial.actions,
    },
  };
}

// ============================================================================
// Data Enrichment Functions
// ============================================================================

export function enrichTimelineWithViews(events: TimelineEvent[]): TimelineEvent[] {
  return events.map(event => {
    const linkedViews: View[] = [];

    // Map event types to related views
    switch (event.type) {
      case 'Finansiel':
      case 'Regnskab':
        linkedViews.push('financials', 'cashflow');
        break;
      case 'Struktur':
        linkedViews.push('companies', 'person');
        break;
      case 'Compliance':
        linkedViews.push('risk', 'actions');
        break;
      case 'Operationel':
        linkedViews.push('business', 'sector');
        break;
    }

    return {
      ...event,
      linkedViews: linkedViews.length > 0 ? linkedViews : event.linkedViews,
    };
  });
}

/**
 * Sorts financial data by year (descending - newest first).
 */
export function sortFinancialsByYear(data: FinancialYear[]): FinancialYear[] {
  return [...data].sort((a, b) => b.year - a.year);
}

/**
 * Sorts timeline events by date (descending - newest first).
 */
export function sortTimelineByDate(events: TimelineEvent[]): TimelineEvent[] {
  return [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Filters actions by status.
 */
export function filterActionsByStatus(
  actions: ActionItem[],
  statuses: ActionItem['status'][]
): ActionItem[] {
  return actions.filter(action => statuses.includes(action.status));
}

/**
 * Groups risk scores by category.
 */
export function groupRisksByCategory(risks: RiskScore[]): Record<RiskScore['category'], RiskScore | undefined> {
  const grouped: Partial<Record<RiskScore['category'], RiskScore>> = {};
  for (const risk of risks) {
    grouped[risk.category] = risk;
  }
  return grouped as Record<RiskScore['category'], RiskScore | undefined>;
}

// ============================================================================
// Export Index
// ============================================================================

export { validateCaseData, type ValidationResult } from '../schemas/caseSchema';
