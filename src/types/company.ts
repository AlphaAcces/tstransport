/**
 * Company Types
 *
 * Types related to companies and financial data.
 */

import type { CompanyRole, CompanyStatus, SimpleRiskLevel, RiskCategory, CounterpartyType } from './core';

// ============================================================================
// Company Types
// ============================================================================

/**
 * Company entity
 */
export interface Company {
  id: string;
  name: string;
  cvr: string;
  role: CompanyRole;
  industryCode: string;
  established: string;
  owner: string;
  director: string;
  auditor: string;
  status: CompanyStatus;
  notes: string;
  riskLevel?: SimpleRiskLevel;
}

// ============================================================================
// Financial Types
// ============================================================================

/**
 * Financial data for a single year
 */
export interface FinancialYear {
  year: number;
  revenueOrGrossProfit: number;
  profitAfterTax: number;
  staffCount: number;
  equityEndOfYear: number;
  currentAssets: number;
  currentLiabilities?: number;
  receivables?: number;
  cash?: number;
  solidity?: number;
  dso?: number;
  ebit?: number;
  ebitMargin?: number;
  netMargin?: number;
  profitPerEmployee?: number;
  currentRatio?: number;
  cashRatio?: number;
  personnelCosts?: number;
}

// ============================================================================
// Cashflow Types
// ============================================================================

/**
 * Cashflow data for a single year
 */
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

/**
 * Cashflow summary
 */
export interface CashflowSummary {
  cashOnHand: number;
  internalReceivables: number;
  dsoDays2024: number;
  potentialTaxClaim: number;
}

// ============================================================================
// Sector Types
// ============================================================================

/**
 * Sector driver analysis
 */
export interface SectorDriver {
  driver: string;
  industrySituation: string;
  impactOnTSL: string;
  risk: 'Høj' | 'Middel' | 'Lav';
}

/**
 * Macro-level risk
 */
export interface MacroRisk {
  id: string;
  title: string;
  level: 'Høj' | 'Middel' | 'Lav';
  description: string;
  linkedSubjects: ('tsl')[];
  sourceId: string;
}

/**
 * Sector benchmark year data
 */
export interface SectorBenchmarkYear {
  year: number;
  ebitMarginTSL?: number;
  equityRatioTSL?: number;
  resultPerEmployeeTSL?: number;
  ebitMarginSector: number;
  equityRatioSector: number;
  resultPerEmployeeSector: number;
}

/**
 * Sector comparison metric
 */
export interface SectorComparisonMetric {
  metric: string;
  tslValue?: number;
  sectorValue: number;
  highPerformerValue?: number;
  unit: string;
  higherIsBetter: boolean;
}

// ============================================================================
// Counterparty Types
// ============================================================================

/**
 * Counterparty entity
 */
export interface Counterparty {
  id: string;
  name: string;
  type: CounterpartyType;
  riskLevel: 'Høj' | 'Middel' | 'Lav';
  relationType: string;
  description: string;
  linkedRisks: RiskCategory[];
  linkedHypotheses: string[];
}

// ============================================================================
// Person Types
// ============================================================================

/**
 * Person data for the investigation subject
 */
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
