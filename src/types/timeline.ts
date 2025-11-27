/**
 * Timeline Types
 *
 * Types related to timeline events and event categorization.
 */

import type { TimelineCategory, View } from './core';

// ============================================================================
// Timeline Event Types
// ============================================================================

/**
 * Single timeline event with metadata
 */
export interface TimelineEvent {
  date: string;
  type: TimelineCategory;
  title: string;
  description: string;
  source: string;
  sourceUrl?: string;
  sourceId?: string;
  isCritical?: boolean;
  linkedViews?: View[];
  linkedActions?: string[];
  linkedHypotheses?: string[];
}

/**
 * Timeline filter options
 */
export interface TimelineFilter {
  types?: TimelineCategory[];
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  onlyCritical?: boolean;
}

/**
 * Timeline period grouping
 */
export interface TimelinePeriod {
  label: string;
  startDate: string;
  endDate: string;
  events: TimelineEvent[];
}
