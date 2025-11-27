/**
 * Executive Types
 *
 * Types related to executive summaries, trends, and KPIs.
 */

import type { View, Priority, ActionCategory } from './core';
import type { ExecutiveRiskHighlights } from './risk';
import type { ActionItem } from './actions';

// ============================================================================
// Executive Financial Types
// ============================================================================

/**
 * Executive financial trend point
 */
export interface ExecutiveFinancialTrendPoint {
  year: number;
  value: number;
}

/**
 * Executive financial alert
 */
export interface ExecutiveFinancialAlert {
  id: 'liquidity' | 'dso' | 'intercompany';
  label: string;
  value: number;
  unit: 'DKK' | 'days';
  description: string;
}

/**
 * Executive financial highlights
 */
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

// ============================================================================
// Executive Action Types
// ============================================================================

/**
 * Executive action item summary
 */
export interface ExecutiveActionItemSummary {
  id: string;
  title: string;
  priority: ActionItem['priority'];
  ownerRole?: ActionItem['ownerRole'];
  timeHorizon?: ActionItem['timeHorizon'];
  description?: string;
}

/**
 * Executive timeline highlight
 */
export interface ExecutiveTimelineHighlight {
  date: string;
  title: string;
  description: string;
  isCritical?: boolean;
}

/**
 * Executive action highlights
 */
export interface ExecutiveActionHighlights {
  upcomingDeadlines: ExecutiveActionItemSummary[];
  boardActionables: ExecutiveActionItemSummary[];
  criticalEvents: ExecutiveTimelineHighlight[];
  upcomingEvents: ExecutiveTimelineHighlight[];
}

// ============================================================================
// Executive Summary Data
// ============================================================================

/**
 * Complete executive summary data
 */
export interface ExecutiveSummaryData {
  financial: ExecutiveFinancialHighlights;
  risk: ExecutiveRiskHighlights;
  actions: ExecutiveActionHighlights;
}

/**
 * Executive export payload
 */
export interface ExecutiveExportPayload {
  subject: import('./core').Subject;
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

// ============================================================================
// Executive Hero KPI Types (for new UI patterns)
// ============================================================================

/**
 * Executive hero KPI card
 */
export interface ExecutiveHeroKpi {
  label: string;
  value: string | number;
  delta?: number;
  trend?: 'up' | 'down' | 'stable';
}

/**
 * Executive quick insight
 */
export interface ExecutiveQuickInsight {
  id: string;
  text: string;
  category: ActionCategory;
  severity: Priority;
  linkedView?: View;
}

/**
 * Key takeaway for executive summary
 */
export interface ExecutiveKeyTakeaway {
  title: string;
  description: string;
  importance: Priority;
}

/**
 * Executive priority action
 */
export interface ExecutivePriorityAction {
  id: string;
  title: string;
  category: ActionCategory;
  priority: Priority;
  deadline: string;
  owner: string;
}

// ============================================================================
// Executive Trend Types
// ============================================================================

/**
 * Trend direction
 */
export type TrendDirection = 'up' | 'down' | 'stable';

/**
 * Executive trend data point
 */
export interface ExecutiveTrendPoint {
  period: string;
  value: number;
}

/**
 * Executive trend series
 */
export interface ExecutiveTrendSeries {
  id: string;
  label: string;
  data: ExecutiveTrendPoint[];
  direction: TrendDirection;
  percentChange: number;
}

// ============================================================================
// Executive Filter Types
// ============================================================================

/**
 * Executive view filter
 */
export interface ExecutiveFilter {
  timeRange?: 'ytd' | '1y' | '3y' | '5y' | 'all';
  categories?: ActionCategory[];
  priorities?: Priority[];
}
