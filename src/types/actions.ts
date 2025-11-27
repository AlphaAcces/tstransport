/**
 * Actions Types
 *
 * Types related to action items, hypotheses, and scenarios.
 */

import type {
  View,
  Priority,
  ActionCategory,
  ActionStatus,
  ScenarioCategory,
  HypothesisStatus,
  HypothesisCategory,
  ImpactLevel,
  EvidenceLevel,
  OwnerRole,
  TimeHorizon,
  RiskCategory,
} from './core';

// ============================================================================
// Action Item Types
// ============================================================================

/**
 * Individual action item
 */
export interface ActionItem {
  id: string;
  title: string;
  category: ActionCategory;
  priority: Priority;
  description: string;
  evidenceType: string;
  status: ActionStatus;
  owner?: OwnerRole;
  timeHorizon?: TimeHorizon;
  linkedRisks?: RiskCategory[];
  linkedHypotheses?: string[];
  linkedViews?: View[];
  sourceUrl?: string;
  sourceId?: string;
  ownerRole?: OwnerRole;
}

/**
 * Action filter options
 */
export interface ActionFilter {
  categories?: ActionCategory[];
  priorities?: Priority[];
  statuses?: ActionStatus[];
  searchQuery?: string;
}

// ============================================================================
// Hypothesis Types
// ============================================================================

/**
 * Investigation hypothesis
 */
export interface Hypothesis {
  id: string;
  title: string;
  summary: string;
  description: string[];
  analysisNote: string;
  status: HypothesisStatus;
  category: HypothesisCategory;
  impact: ImpactLevel;
  evidenceLevel: EvidenceLevel;
  relatedViews: View[];
  sourceUrl?: string;
  sourceId?: string;
}

/**
 * Hypothesis filter options
 */
export interface HypothesisFilter {
  statuses?: HypothesisStatus[];
  categories?: HypothesisCategory[];
  impacts?: ImpactLevel[];
  searchQuery?: string;
}

// ============================================================================
// Scenario Types
// ============================================================================

/**
 * Investigation scenario
 */
export interface Scenario {
  id: string;
  name: string;
  category: ScenarioCategory;
  description: string;
  assumptions: string[];
  expectedOutcome: string;
  probability: 'Lav' | 'Middel' | 'Høj';
  impact: 'Middel' | 'Høj' | 'Ekstrem';
  linkedActions: string[];
  sourceId?: string;
}

/**
 * Scenario filter options
 */
export interface ScenarioFilter {
  categories?: ScenarioCategory[];
  probabilities?: ('Lav' | 'Middel' | 'Høj')[];
  impacts?: ('Middel' | 'Høj' | 'Ekstrem')[];
  searchQuery?: string;
}
