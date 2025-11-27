/**
 * Risk Types
 *
 * Types related to risk assessment, scores, and relations.
 */

import type { View, RiskCategory, RiskLevel } from './core';

// ============================================================================
// Risk Score Types
// ============================================================================

/**
 * Individual risk score for a category
 */
export interface RiskScore {
  category: RiskCategory;
  maxScore: number;
  assignedScore: number;
  justification: string;
  riskLevel: RiskLevel;
  likelihood: number;
  impact: number;
  linkedHypotheses: string[];
  linkedViews: View[];
  linkedActions: string[];
  sourceId?: string;
}

/**
 * Total aggregated risk score
 */
export interface TotalRiskScore {
  score: number;
  maxScore: number;
  level: RiskLevel | 'N/A';
  summary: string;
}

/**
 * Relation-based risk assessment
 */
export interface RelationRisk {
  entity: string;
  type: string;
  role: string;
  riskScore: number;
  reason: string;
  sourceId?: string;
}

// ============================================================================
// Executive Risk Types
// ============================================================================

/**
 * Executive risk score summary
 */
export interface ExecutiveRiskScoreSummary {
  category: RiskCategory;
  riskLevel: RiskLevel;
  justification: string;
}

/**
 * Executive red flag indicator
 */
export interface ExecutiveRedFlag {
  id: 'liquidity' | 'dso' | 'intercompany';
  value: number | null;
  unit: 'DKK' | 'days';
}

/**
 * Executive risk highlights
 */
export interface ExecutiveRiskHighlights {
  taxCaseExposure: number | null;
  complianceIssue: string;
  sectorRiskSummary: string;
  riskScores: ExecutiveRiskScoreSummary[];
  redFlags: ExecutiveRedFlag[];
}
