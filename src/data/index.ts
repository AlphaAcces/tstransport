/**
 * Data Module Index
 *
 * Central entry point for data access, schemas, and transformers.
 */

import { Subject, CaseData } from '../types';

// ============================================================================
// Data Loaders
// ============================================================================

/**
 * Loads case data for a specific subject.
 * Uses dynamic imports to enable code splitting.
 */
export const getDataForSubject = async (subject: Subject): Promise<CaseData> => {
  switch (subject) {
    case 'tsl': {
      const module = await import('./tsl');
      return module.tslData;
    }
    case 'umit': {
      const module = await import('./umit');
      return module.umitData;
    }
    default: {
      const module = await import('./tsl');
      return module.tslData;
    }
  }
};

// ============================================================================
// Re-exports
// ============================================================================

// Schema validation
export {
  validateCaseData,
  isCaseData,
  assertCaseData,
  type ValidationResult,
  type ValidationError,
} from './schemas';

// Data transformation
export {
  transformCaseData,
  enrichTimelineWithViews,
  sortFinancialsByYear,
  sortTimelineByDate,
  filterActionsByStatus,
  groupRisksByCategory,
  type RawCaseData,
  type TransformResult,
} from './transformers';
