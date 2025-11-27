/**
 * Legacy Types Entry Point
 *
 * This file re-exports all types from the new modular structure.
 * Kept for backward compatibility with existing imports.
 *
 * New code should import from 'types/index' or specific domain files:
 *   import type { Company, FinancialYear } from './types/company';
 *   import type { RiskScore, TotalRiskScore } from './types/risk';
 *   import type { CaseData } from './types';
 */

export * from './types/index';

