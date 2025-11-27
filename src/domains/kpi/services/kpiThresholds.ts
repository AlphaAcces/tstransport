/**
 * KPI Thresholds Configuration
 *
 * Centralized threshold definitions for all KPIs.
 * These determine when a KPI is critical, warning, normal, or good.
 */

import type { KpiThreshold, KpiStatus } from '../types';

/**
 * Financial KPI thresholds
 */
export const FINANCIAL_THRESHOLDS: Record<string, KpiThreshold> = {
  // Profit margin thresholds (percentage)
  profitMargin: {
    critical: 0,
    warning: 5,
    good: 10,
    higherIsBetter: true,
  },

  // EBIT margin thresholds (percentage)
  ebitMargin: {
    critical: 0,
    warning: 3,
    good: 8,
    higherIsBetter: true,
  },

  // Solidity/equity ratio thresholds (percentage)
  solidity: {
    critical: 10,
    warning: 20,
    good: 35,
    higherIsBetter: true,
  },

  // Current ratio thresholds
  currentRatio: {
    critical: 0.8,
    warning: 1.0,
    good: 1.5,
    higherIsBetter: true,
  },

  // Cash ratio thresholds
  cashRatio: {
    critical: 0.1,
    warning: 0.2,
    good: 0.5,
    higherIsBetter: true,
  },

  // Days Sales Outstanding thresholds (days)
  dso: {
    critical: 90,
    warning: 60,
    good: 30,
    higherIsBetter: false,
  },

  // Liquidity thresholds (absolute DKK)
  liquidity: {
    critical: 100000,
    warning: 500000,
    good: 2000000,
    higherIsBetter: true,
  },

  // Year-over-year growth thresholds (percentage)
  yoyGrowth: {
    critical: -20,
    warning: -5,
    good: 10,
    higherIsBetter: true,
  },
};

/**
 * Risk KPI thresholds
 */
export const RISK_THRESHOLDS: Record<string, KpiThreshold> = {
  // Total risk score thresholds (percentage of max)
  totalRiskPercent: {
    critical: 75,
    warning: 50,
    good: 25,
    higherIsBetter: false,
  },

  // Individual risk category score
  categoryRiskScore: {
    critical: 18,
    warning: 12,
    good: 6,
    higherIsBetter: false,
  },
};

/**
 * Operational KPI thresholds
 */
export const OPERATIONAL_THRESHOLDS: Record<string, KpiThreshold> = {
  // Employee count thresholds
  employeeCount: {
    warning: 5,
    good: 20,
    higherIsBetter: true,
  },

  // Profit per employee thresholds (DKK)
  profitPerEmployee: {
    critical: 0,
    warning: 100000,
    good: 300000,
    higherIsBetter: true,
  },
};

/**
 * Evaluate a value against thresholds to determine status
 */
export function evaluateThreshold(
  value: number | null,
  threshold?: KpiThreshold
): KpiStatus {
  if (value === null || threshold === undefined) {
    return 'normal';
  }

  const { critical, warning, good, higherIsBetter = true } = threshold;

  if (higherIsBetter) {
    // Higher is better: critical < warning < good
    if (critical !== undefined && value <= critical) return 'critical';
    if (warning !== undefined && value <= warning) return 'warning';
    if (good !== undefined && value >= good) return 'good';
    return 'normal';
  } else {
    // Lower is better: critical > warning > good
    if (critical !== undefined && value >= critical) return 'critical';
    if (warning !== undefined && value >= warning) return 'warning';
    if (good !== undefined && value <= good) return 'good';
    return 'normal';
  }
}

/**
 * Get all thresholds merged
 */
export function getAllThresholds(): Record<string, KpiThreshold> {
  return {
    ...FINANCIAL_THRESHOLDS,
    ...RISK_THRESHOLDS,
    ...OPERATIONAL_THRESHOLDS,
  };
}
