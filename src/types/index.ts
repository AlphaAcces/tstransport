/**
 * Types Index - Barrel Export
 *
 * Central export point for all type definitions.
 * Maintains backward compatibility with existing imports from 'types.ts'.
 */

// ============================================================================
// Shared Base Types
// ============================================================================
export type {
  Identifiable,
  NamedEntity,
  DescribedEntity,
  Address,
  Addressable,
  TemporalMetadata,
} from './shared';

// ============================================================================
// Core Types (Views, Navigation, Categories, Statuses)
// ============================================================================
export type {
  View,
  Subject,
  NavItemConfig,
  NavigationState,
  Priority,
  RiskLevel,
  SimpleRiskLevel,
  ImpactLevel,
  HypothesisStatus,
  ActionStatus,
  CompanyStatus,
  RiskCategory,
  ActionCategory,
  HypothesisCategory,
  TimelineCategory,
  CompanyRole,
  CounterpartyType,
  ScenarioCategory,
  OwnerRole,
  TimeHorizon,
  EvidenceLevel,
} from './core';

// ============================================================================
// Company & Financial Types
// ============================================================================
export type {
  Company,
  FinancialYear,
  CashflowYear,
  CashflowSummary,
  SectorDriver,
  MacroRisk,
  SectorBenchmarkYear,
  SectorComparisonMetric,
  Counterparty,
  PersonData,
} from './company';

// ============================================================================
// Risk Types
// ============================================================================
export type {
  RiskScore,
  TotalRiskScore,
  RelationRisk,
  ExecutiveRiskScoreSummary,
  ExecutiveRedFlag,
  ExecutiveRiskHighlights,
} from './risk';

// ============================================================================
// Timeline Types
// ============================================================================
export type {
  TimelineEvent,
  TimelineFilter,
  TimelinePeriod,
} from './timeline';

// ============================================================================
// Actions Types (Actions, Hypotheses, Scenarios)
// ============================================================================
export type {
  ActionItem,
  ActionFilter,
  Hypothesis,
  HypothesisFilter,
  Scenario,
  ScenarioFilter,
} from './actions';

// ============================================================================
// Executive Types
// ============================================================================
export type {
  ExecutiveFinancialTrendPoint,
  ExecutiveFinancialAlert,
  ExecutiveFinancialHighlights,
  ExecutiveActionItemSummary,
  ExecutiveTimelineHighlight,
  ExecutiveActionHighlights,
  ExecutiveSummaryData,
  ExecutiveExportPayload,
  ExecutiveHeroKpi,
  ExecutiveQuickInsight,
  ExecutiveKeyTakeaway,
  ExecutivePriorityAction,
  TrendDirection,
  ExecutiveTrendPoint,
  ExecutiveTrendSeries,
  ExecutiveFilter,
} from './executive';

// ============================================================================
// Network Types
// ============================================================================
export type {
  NetworkNodeType,
  NetworkNode,
  NetworkEdgeType,
  NetworkEdge,
  NetworkGraph,
  NetworkLayout,
  NetworkOptions,
  NetworkFilter,
  NetworkCluster,
  ViewportBounds,
  NetworkLoadingState,
} from './network';

// ============================================================================
// CaseData Type (combines all domain types)
// ============================================================================
import type { PersonData, Company, FinancialYear, CashflowYear, CashflowSummary, SectorBenchmarkYear, SectorComparisonMetric, SectorDriver, MacroRisk, Counterparty } from './company';
import type { RiskScore, TotalRiskScore, RelationRisk } from './risk';
import type { TimelineEvent } from './timeline';
import type { ActionItem, Hypothesis, Scenario } from './actions';
import type { ExecutiveSummaryData as ExecutiveSummaryDataImport } from './executive';
import type { NetworkNode, NetworkEdge } from './network';

/**
 * Complete case data for an investigation subject.
 * Contains all domain data in a unified structure.
 */
export interface CaseData {
  tenantId: string;
  personData: PersonData;
  companiesData: Company[];
  financialData: FinancialYear[];
  hypothesesData: Hypothesis[];
  riskHeatmapData: RiskScore[];
  totalRiskScore: TotalRiskScore;
  relationRiskData: RelationRisk[];
  timelineData: TimelineEvent[];
  actionsData: ActionItem[];
  cashflowYearlyData: CashflowYear[];
  cashflowSummary: CashflowSummary;
  sectorBenchmarkYearlyData: SectorBenchmarkYear[];
  sectorComparisonData: SectorComparisonMetric[];
  sectorDriversData: SectorDriver[];
  macroRiskData: MacroRisk[];
  networkNodes: NetworkNode[];
  networkEdges: NetworkEdge[];
  counterpartiesData: Counterparty[];
  scenariosData: Scenario[];
  executiveSummary: ExecutiveSummaryDataImport;
}

// ============================================================================
// Legacy Type Aliases (for backward compatibility)
// ============================================================================
export type { NodeType } from './network';
