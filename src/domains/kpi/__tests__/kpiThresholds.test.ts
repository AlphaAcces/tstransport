/**
 * KPI Thresholds Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateThreshold,
  FINANCIAL_THRESHOLDS,
  RISK_THRESHOLDS,
  OPERATIONAL_THRESHOLDS,
  getAllThresholds,
} from '../services/kpiThresholds';
import type { KpiThreshold } from '../types';

describe('KPI Thresholds', () => {
  describe('evaluateThreshold - Higher is Better', () => {
    const threshold: KpiThreshold = {
      critical: 10,
      warning: 20,
      good: 50,
      higherIsBetter: true,
    };

    it('returns "critical" for values at or below critical', () => {
      expect(evaluateThreshold(10, threshold)).toBe('critical');
      expect(evaluateThreshold(5, threshold)).toBe('critical');
    });

    it('returns "warning" for values between critical and warning', () => {
      expect(evaluateThreshold(15, threshold)).toBe('warning');
      expect(evaluateThreshold(20, threshold)).toBe('warning');
    });

    it('returns "normal" for values between warning and good', () => {
      expect(evaluateThreshold(30, threshold)).toBe('normal');
      expect(evaluateThreshold(49, threshold)).toBe('normal');
    });

    it('returns "good" for values at or above good', () => {
      expect(evaluateThreshold(50, threshold)).toBe('good');
      expect(evaluateThreshold(100, threshold)).toBe('good');
    });
  });

  describe('evaluateThreshold - Lower is Better', () => {
    const threshold: KpiThreshold = {
      critical: 90,
      warning: 60,
      good: 30,
      higherIsBetter: false,
    };

    it('returns "critical" for values at or above critical', () => {
      expect(evaluateThreshold(90, threshold)).toBe('critical');
      expect(evaluateThreshold(100, threshold)).toBe('critical');
    });

    it('returns "warning" for values between warning and critical', () => {
      expect(evaluateThreshold(75, threshold)).toBe('warning');
      expect(evaluateThreshold(60, threshold)).toBe('warning');
    });

    it('returns "normal" for values between good and warning', () => {
      expect(evaluateThreshold(45, threshold)).toBe('normal');
      expect(evaluateThreshold(31, threshold)).toBe('normal');
    });

    it('returns "good" for values at or below good', () => {
      expect(evaluateThreshold(30, threshold)).toBe('good');
      expect(evaluateThreshold(10, threshold)).toBe('good');
    });
  });

  describe('evaluateThreshold - Edge Cases', () => {
    it('returns "normal" for null value', () => {
      expect(evaluateThreshold(null, FINANCIAL_THRESHOLDS.solidity)).toBe('normal');
    });

    it('returns "normal" for undefined threshold', () => {
      expect(evaluateThreshold(50, undefined)).toBe('normal');
    });

    it('handles partial threshold definitions', () => {
      const partialThreshold: KpiThreshold = {
        warning: 50,
        higherIsBetter: true,
      };
      expect(evaluateThreshold(40, partialThreshold)).toBe('warning');
      expect(evaluateThreshold(60, partialThreshold)).toBe('normal');
    });
  });

  describe('Financial Thresholds', () => {
    it('has correct DSO thresholds (lower is better)', () => {
      const { dso } = FINANCIAL_THRESHOLDS;
      expect(dso.higherIsBetter).toBe(false);
      expect(dso.critical).toBe(90);
      expect(dso.warning).toBe(60);
      expect(dso.good).toBe(30);
    });

    it('evaluates DSO correctly', () => {
      expect(evaluateThreshold(25, FINANCIAL_THRESHOLDS.dso)).toBe('good');
      expect(evaluateThreshold(45, FINANCIAL_THRESHOLDS.dso)).toBe('normal');
      expect(evaluateThreshold(75, FINANCIAL_THRESHOLDS.dso)).toBe('warning');
      expect(evaluateThreshold(100, FINANCIAL_THRESHOLDS.dso)).toBe('critical');
    });

    it('has correct solidity thresholds (higher is better)', () => {
      const { solidity } = FINANCIAL_THRESHOLDS;
      expect(solidity.higherIsBetter).toBe(true);
      expect(solidity.critical).toBe(10);
      expect(solidity.warning).toBe(20);
      expect(solidity.good).toBe(35);
    });

    it('evaluates solidity correctly', () => {
      expect(evaluateThreshold(5, FINANCIAL_THRESHOLDS.solidity)).toBe('critical');
      expect(evaluateThreshold(15, FINANCIAL_THRESHOLDS.solidity)).toBe('warning');
      expect(evaluateThreshold(25, FINANCIAL_THRESHOLDS.solidity)).toBe('normal');
      expect(evaluateThreshold(40, FINANCIAL_THRESHOLDS.solidity)).toBe('good');
    });
  });

  describe('Risk Thresholds', () => {
    it('evaluates total risk percentage correctly', () => {
      const { totalRiskPercent } = RISK_THRESHOLDS;
      expect(totalRiskPercent.higherIsBetter).toBe(false);

      expect(evaluateThreshold(20, totalRiskPercent)).toBe('good');
      expect(evaluateThreshold(40, totalRiskPercent)).toBe('normal');
      expect(evaluateThreshold(60, totalRiskPercent)).toBe('warning');
      expect(evaluateThreshold(80, totalRiskPercent)).toBe('critical');
    });
  });

  describe('getAllThresholds', () => {
    it('combines all threshold categories', () => {
      const all = getAllThresholds();
      expect(all).toHaveProperty('solidity');
      expect(all).toHaveProperty('dso');
      expect(all).toHaveProperty('totalRiskPercent');
      expect(all).toHaveProperty('employeeCount');
    });

    it('contains expected number of thresholds', () => {
      const all = getAllThresholds();
      const expectedCount =
        Object.keys(FINANCIAL_THRESHOLDS).length +
        Object.keys(RISK_THRESHOLDS).length +
        Object.keys(OPERATIONAL_THRESHOLDS).length;
      expect(Object.keys(all)).toHaveLength(expectedCount);
    });
  });
});
