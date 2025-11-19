// FIX: import ReactElement to resolve JSX namespace issue and correct the type.
import type { ReactElement } from 'react';

export type View = 'dashboard' | 'executive' | 'person' | 'companies' | 'financials' | 'hypotheses' | 'cashflow' | 'sector' | 'timeline' | 'risk' | 'actions' | 'counterparties' | 'scenarios';

export type Subject = 'tsl' | 'umit';

export interface NavItemConfig {
  id: View;
  label: string;
  // FIX: Changed type from a function returning JSX.Element to ReactElement to match usage.
  icon: ReactElement;
  showFor: Subject[];
}

export interface NavigationState {
  activeView: View;
  previousView: View | null;
  lastCameFromDashboard: boolean;
}

export interface Company {
  id: string;
  name: string;
  cvr: string;
  role: 'Drift (Vognmand)' | 'Holding' | 'Ejendom' | 'Bilsalg' | 'Historisk';
  industryCode: string;
  established: string;
  owner: string;
  director: string;
  auditor: string;
  status: 'Aktiv' | 'Historisk' | 'Ophørt';
  notes: string;
  riskLevel?: 'High' | 'Medium' | 'Low';
}

export interface FinancialYear {
  year: number;
  revenueOrGrossProfit: number; // in DKK
  profitAfterTax: number; // in DKK
  staffCount: number;
  equityEndOfYear: number; // in DKK
  currentAssets: number; // in DKK
  currentLiabilities?: number; // in DKK
  receivables?: number; // in DKK
  cash?: number; // in DKK
  solidity?: number; // percentage
  dso?: number; // days
  ebit?: number; // in DKK
  ebitMargin?: number; // percentage
  netMargin?: number; // percentage
  profitPerEmployee?: number; // in DKK
  currentRatio?: number;
  cashRatio?: number;
  personnelCosts?: number; // in DKK
}

export interface Hypothesis {
  id: string;
  title: string;
  summary: string;
  description: string[];
  analysisNote: string;
  status: 'Bekræftet' | 'Åben' | 'Afkræftet';
  category: 'Finansiel' | 'Likviditet' | 'Skat/Compliance' | 'Operationel' | 'Strategisk';
  impact: 'Lav' | 'Middel' | 'Høj';
  evidenceLevel: 'Indikation' | 'Stærk Evidens';
  relatedViews: View[];
  sourceUrl?: string;
  sourceId?: string;
}

export interface RiskScore {
  category: 'Financial' | 'Legal/Compliance' | 'Governance' | 'SOCMINT/Reputation' | 'Sector/Operations';
  maxScore: number;
  assignedScore: number;
  justification: string;
  riskLevel: 'KRITISK' | 'HØJ' | 'MODERAT' | 'LAV';
  likelihood: number; // 1-5 scale
  impact: number; // 1-5 scale
  linkedHypotheses: string[];
  linkedViews: View[];
  linkedActions: string[];
  // FIX: Add optional `sourceId` property to allow it in risk score data.
  sourceId?: string;
}

export interface TotalRiskScore {
    score: number;
    maxScore: number;
    level: 'KRITISK' | 'HØJ' | 'MODERAT' | 'LAV' | 'N/A';
    summary: string;
}

export interface RelationRisk {
  entity: string;
  type: string;
  role: string;
  riskScore: number;
  reason: string;
  sourceId?: string;
}

export interface TimelineEvent {
  date: string;
  type: 'Etablering' | 'Regnskab' | 'Struktur' | 'Adresse' | 'Finansiel' | 'Operationel' | 'Compliance';
  title: string;
  description: string;
  source: string;
  sourceUrl?: string;
  sourceId?: string;
  isCritical?: boolean;
}

export interface ActionItem {
  id: string;
  title: string;
  // FIX: Add 'Governance' and 'Strategisk' to the category union type.
  category: 'Juridisk' | 'Efterretning' | 'Finansiel' | 'Kommerciel' | 'Regulatorisk' | 'Governance' | 'Strategisk';
  priority: 'Påkrævet' | 'Høj' | 'Middel';
  description: string;
  evidenceType: string;
  status: 'Ikke startet' | 'I gang' | 'Afsluttet';
  // FIX: Add missing owner types to support data from actions.ts files.
  owner?: 'Direktion' | 'Advokat' | 'Revisor' | 'Administration' | 'Finansiel rådgiver' | 'Ledelse' | 'Advokat / Revisor' | 'Advokat / Forsikringsmægler' | 'Direktion / Revisor' | 'Revisor / Advokat';
  timeHorizon?: '0-30 dage' | '1-3 mdr' | '3-12 mdr';
  linkedRisks?: ('Financial' | 'Legal/Compliance' | 'Governance' | 'SOCMINT/Reputation' | 'Sector/Operations')[];
  linkedHypotheses?: string[];
  linkedViews?: View[];
  sourceUrl?: string;
  sourceId?: string;
  // FIX: Add missing ownerRole types to support data from actions.ts files.
  ownerRole?: 'Direktion' | 'Advokat' | 'Revisor' | 'Administration' | 'Finansiel rådgiver' | 'Ledelse' | 'Advokat / Revisor' | 'Advokat / Forsikringsmægler' | 'Direktion / Revisor' | 'Revisor / Advokat';
}

export interface SectorDriver {
  driver: string;
  industrySituation: string;
  impactOnTSL: string;
  risk: 'Høj' | 'Middel' | 'Lav';
}

export interface MacroRisk {
    id: string;
    title: string;
    level: 'Høj' | 'Middel' | 'Lav';
    description: string;
    linkedSubjects: ('tsl')[];
    sourceId: string;
}

export interface SectorBenchmarkYear {
    year: number;
    ebitMarginTSL?: number;
    equityRatioTSL?: number;
    resultPerEmployeeTSL?: number;
    ebitMarginSector: number;
    equityRatioSector: number;
    resultPerEmployeeSector: number;
}

export interface SectorComparisonMetric {
    metric: string;
    tslValue?: number;
    sectorValue: number;
    highPerformerValue?: number;
    unit: string;
    higherIsBetter: boolean;
}

export type NodeType = 'person' | 'company' | 'historical';

export interface NetworkNode {
  id: string;
  label: string;
  sublabel: string;
  type: NodeType;
  x: number;
  y: number;
  riskLevel: 'High' | 'Medium' | 'Low' | 'None';
  cvr?: string;
  notes?: string;
}

export interface NetworkEdge {
  from: string;
  to: string;
  type: 'ownership' | 'historical' | 'transaction';
}

export interface CashflowYear {
  year: number;
  grossProfit: number;
  receivablesTotal: number;
  receivablesRelated: number;
  receivablesExternal: number;
  cashAndBank: number;
  shortTermDebt: number;
  dsoDays: number;
  potentialTaxClaim?: number;
}

export interface CashflowSummary {
  cashOnHand: number;
  internalReceivables: number;
  dsoDays2024: number;
  potentialTaxClaim: number;
}

export interface PersonData {
  name: string;
  aliases: string[];
  birthYear: string;
  currentAddress: string;
  addressHistory: string[];
  primaryRole: string;
  uboStatus: string;
  pepStatus: string;
  sanctionsScreening: string;
  socmintProfile: string;
}

export interface Counterparty {
    id: string;
    name: string;
    type: 'Regulatorisk' | 'Rådgiver' | 'Kunde' | 'Finansiel' | 'Partner';
    riskLevel: 'Høj' | 'Middel' | 'Lav';
    relationType: string;
    description: string;
    linkedRisks: RiskScore['category'][];
    linkedHypotheses: string[];
}

export interface Scenario {
  id: string;
  name: string;
  category: 'Best' | 'Base' | 'Worst' | 'Exit';
  description: string;
  assumptions: string[];
  expectedOutcome: string;
  probability: 'Lav' | 'Middel' | 'Høj';
  impact: 'Middel' | 'Høj' | 'Ekstrem';
  linkedActions: string[];
  sourceId?: string;
}

export interface ExecutiveFinancialTrendPoint {
  year: number;
  value: number;
}

export interface ExecutiveFinancialAlert {
  id: 'liquidity' | 'dso' | 'intercompany';
  label: string;
  value: number;
  unit: 'DKK' | 'days';
  description: string;
}

export interface ExecutiveFinancialHighlights {
  latestYear: number | null;
  grossProfit: number | null;
  profitAfterTax: number | null;
  yoyGrossChange: number | null;
  yoyProfitChange: number | null;
  dso: number | null;
  liquidity: number | null;
  intercompanyLoans: number | null;
  trendGrossProfit: ExecutiveFinancialTrendPoint[];
  trendProfitAfterTax: ExecutiveFinancialTrendPoint[];
  alerts: ExecutiveFinancialAlert[];
}

export interface ExecutiveRiskScoreSummary {
  category: RiskScore['category'];
  riskLevel: RiskScore['riskLevel'];
  justification: string;
}

export interface ExecutiveRiskHighlights {
  taxCaseExposure: number | null;
  complianceIssue: string;
  sectorRiskSummary: string;
  riskScores: ExecutiveRiskScoreSummary[];
  redFlags: string[];
}

export interface ExecutiveActionItemSummary {
  id: string;
  title: string;
  priority: ActionItem['priority'];
  ownerRole?: ActionItem['ownerRole'];
  timeHorizon?: ActionItem['timeHorizon'];
  description?: string;
}

export interface ExecutiveTimelineHighlight {
  date: string;
  title: string;
  description: string;
  isCritical?: boolean;
}

export interface ExecutiveActionHighlights {
  upcomingDeadlines: ExecutiveActionItemSummary[];
  boardActionables: ExecutiveActionItemSummary[];
  criticalEvents: ExecutiveTimelineHighlight[];
  upcomingEvents: ExecutiveTimelineHighlight[];
}

export interface ExecutiveSummaryData {
  financial: ExecutiveFinancialHighlights;
  risk: ExecutiveRiskHighlights;
  actions: ExecutiveActionHighlights;
}

export interface ExecutiveExportPayload {
  subject: Subject;
  generatedAt: string;
  financial: {
    latestYear: number | null;
    grossProfit: number | null;
    profitAfterTax: number | null;
    yoyGrossChange: number | null;
    yoyProfitChange: number | null;
    dso: number | null;
    liquidity: number | null;
    intercompanyLoans: number | null;
    alerts: ExecutiveFinancialAlert[];
  };
  risk: ExecutiveRiskHighlights;
  actions: ExecutiveActionHighlights;
}

// A single, unified type for all data related to a specific case/subject.
export interface CaseData {
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
    executiveSummary: ExecutiveSummaryData;
}