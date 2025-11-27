/**
 * useKpi Hook
 *
 * React hook for consuming KPI data in components.
 * Handles calculation, formatting, and memoization.
 */

import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCaseData, useEnrichedCaseData } from '../../../context/DataContext';
import { useFormatters } from '../../settings/hooks';
import type {
  KpiResult,
  KpiCalculationInput,
  KpiCategory,
  KpiStatus,
  KpiAggregation,
} from '../types';
import {
  calculateKpi,
  calculateKpis,
  calculateAllKpis,
  getKpiById,
  getKpisByCategory,
} from '../services/kpiAggregator';
import { DASHBOARD_CORPORATE_KPIS, EXECUTIVE_SUMMARY_KPIS } from '../registry/financialKpis';
import { DASHBOARD_PERSONAL_RISK_KPIS } from '../registry/riskKpis';
import { getPrimaryRiskDrivers } from '../services/kpiCalculator';

/**
 * Format a KPI value based on its unit type
 */
function useKpiFormatter() {
  const { t } = useTranslation();
  const { formatCurrency, formatPercent, formatNumber } = useFormatters();

  return useCallback(
    (value: number | null, unit: string, options?: { compact?: boolean }) => {
      if (value === null) {
        return t('common.naShort');
      }

      switch (unit) {
        case 'currency':
          return formatCurrency(value, {
            notation: options?.compact ? 'compact' : 'standard',
            minimumFractionDigits: 0,
            maximumFractionDigits: options?.compact ? 1 : 0,
          });
        case 'percent':
          return formatPercent(value / 100, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
          });
        case 'days':
          return t('common.units.days', { count: Math.round(value) });
        case 'ratio':
          return formatNumber(value, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 2,
          });
        case 'score':
          return value.toString();
        case 'count':
          return formatNumber(value, { maximumFractionDigits: 0 });
        default:
          return formatNumber(value);
      }
    },
    [formatCurrency, formatPercent, formatNumber, t]
  );
}

/**
 * Build calculation input from case data
 */
function useKpiCalculationInput(): KpiCalculationInput {
  const { financialData, riskHeatmapData, totalRiskScore, cashflowSummary } = useCaseData();

  return useMemo(
    () => ({
      financialData,
      riskHeatmapData,
      totalRiskScore,
      cashflowSummary,
    }),
    [financialData, riskHeatmapData, totalRiskScore, cashflowSummary]
  );
}

/**
 * Main hook for accessing KPI data
 */
export function useKpi() {
  const input = useKpiCalculationInput();
  const formatValue = useKpiFormatter();

  /**
   * Get a single KPI by ID
   */
  const getKpi = useCallback(
    (kpiId: string): KpiResult | null => {
      const definition = getKpiById(kpiId);
      if (!definition) return null;

      const result = calculateKpi(definition, input);
      return {
        ...result,
        formattedValue: formatValue(result.value, definition.unit),
      };
    },
    [input, formatValue]
  );

  /**
   * Get multiple KPIs by IDs
   */
  const getKpis = useCallback(
    (kpiIds: string[]): KpiResult[] => {
      const definitions = kpiIds
        .map(id => getKpiById(id))
        .filter((def): def is NonNullable<typeof def> => def !== undefined);

      return calculateKpis(definitions, input).map(result => ({
        ...result,
        formattedValue: formatValue(result.value, result.definition.unit),
      }));
    },
    [input, formatValue]
  );

  /**
   * Get all KPIs for a category
   */
  const getKpisByGroup = useCallback(
    (category: KpiCategory): KpiResult[] => {
      const definitions = getKpisByCategory(category);
      return calculateKpis(definitions, input).map(result => ({
        ...result,
        formattedValue: formatValue(result.value, result.definition.unit),
      }));
    },
    [input, formatValue]
  );

  /**
   * Get all KPIs with aggregations
   */
  const getAllKpis = useCallback(() => {
    const { results, aggregations, overallStatus, criticalCount, warningCount } =
      calculateAllKpis(input);

    const formattedResults = results.map(result => ({
      ...result,
      formattedValue: formatValue(result.value, result.definition.unit),
    }));

    return {
      results: formattedResults,
      aggregations,
      overallStatus,
      criticalCount,
      warningCount,
    };
  }, [input, formatValue]);

  return {
    getKpi,
    getKpis,
    getKpisByGroup,
    getAllKpis,
    formatValue,
    input,
  };
}

/**
 * Specialized hook for dashboard KPIs
 */
export function useDashboardKpis(subjectType: 'corporate' | 'personal') {
  const input = useKpiCalculationInput();
  const formatValue = useKpiFormatter();
  const { t } = useTranslation();
  const { formatPercent } = useFormatters();
  const { riskBreakdown: enrichedRiskBreakdown } = useEnrichedCaseData();

  // Get primary risk drivers for descriptions
  const primaryDrivers = useMemo(() => {
    const drivers = getPrimaryRiskDrivers(input);
    const driverLabels: Record<string, string> = {
      'Legal/Compliance': t('dashboard.common.drivers.legalCompliance'),
      Governance: t('dashboard.common.drivers.governance'),
      Financial: t('dashboard.common.drivers.financial'),
      'Sector/Operations': t('dashboard.common.drivers.sector'),
      'SOCMINT/Reputation': t('dashboard.common.drivers.reputation'),
    };
    return drivers
      .map(d => driverLabels[d.category] ?? d.category)
      .join(t('common.delimiters.and'));
  }, [input, t]);

  // Risk level labels
  const riskLevelLabels = useMemo(
    () => ({
      KRITISK: t('common.riskLevel.critical'),
      HØJ: t('common.riskLevel.high'),
      MODERAT: t('common.riskLevel.medium'),
      LAV: t('common.riskLevel.low'),
      'N/A': t('common.riskLevel.na'),
    }),
    [t]
  );

  // Get the latest financial year
  const latestYear = useMemo(() => {
    if (input.financialData.length === 0) return null;
    return [...input.financialData].sort((a, b) => b.year - a.year)[0];
  }, [input.financialData]);

  // Corporate dashboard KPIs
  const corporateKpis = useMemo(() => {
    if (subjectType !== 'corporate') return null;

    const kpiIds = DASHBOARD_CORPORATE_KPIS;
    const definitions = kpiIds
      .map(id => getKpiById(id))
      .filter((def): def is NonNullable<typeof def> => def !== undefined);

    return calculateKpis(definitions, input, { includeTrend: true }).map(result => ({
      ...result,
      formattedValue: formatValue(result.value, result.definition.unit, { compact: true }),
    }));
  }, [subjectType, input, formatValue]);

  // Personal (umit) dashboard KPIs
  const personalKpis = useMemo(() => {
    if (subjectType !== 'personal') return null;

    const kpiIds = DASHBOARD_PERSONAL_RISK_KPIS;
    const definitions = kpiIds
      .map(id => getKpiById(id))
      .filter((def): def is NonNullable<typeof def> => def !== undefined);

    return calculateKpis(definitions, input).map(result => ({
      ...result,
      formattedValue: formatValue(result.value, result.definition.unit),
    }));
  }, [subjectType, input, formatValue]);

  // Total risk formatted display
  const totalRiskDisplay = useMemo(() => {
    const { score, maxScore, level } = input.totalRiskScore;
    return {
      value: `${score}/${maxScore}`,
      level,
      levelLabel: riskLevelLabels[level] ?? level,
      primaryDrivers: primaryDrivers || t('dashboard.common.noDrivers'),
    };
  }, [input.totalRiskScore, riskLevelLabels, primaryDrivers, t]);

  // Financial summary for corporate dashboard
  const financialSummary = useMemo(() => {
    if (!latestYear) return null;

    const prevYear = input.financialData.length > 1
      ? [...input.financialData].sort((a, b) => b.year - a.year)[1]
      : null;

    const netResultChange = prevYear && prevYear.profitAfterTax !== 0
      ? ((latestYear.profitAfterTax - prevYear.profitAfterTax) / Math.abs(prevYear.profitAfterTax)) * 100
      : 0;

    const solidityFormatted = typeof latestYear.solidity === 'number'
      ? formatPercent(latestYear.solidity / 100, { maximumFractionDigits: 0 })
      : t('common.naShort');

    const dsoFormatted = typeof latestYear.dso === 'number'
      ? t('common.units.days', { count: Math.round(latestYear.dso) })
      : t('common.naShort');

    return {
      year: latestYear.year,
      netResult: latestYear.profitAfterTax,
      netResultFormatted: formatValue(latestYear.profitAfterTax, 'currency', { compact: true }),
      netResultChange,
      equity: latestYear.equityEndOfYear,
      equityFormatted: formatValue(latestYear.equityEndOfYear, 'currency', { compact: true }),
      liquidity: latestYear.cash ?? null,
      liquidityFormatted: formatValue(latestYear.cash ?? null, 'currency'),
      solidity: latestYear.solidity ?? null,
      solidityFormatted,
      dso: latestYear.dso ?? null,
      dsoFormatted,
      resultSparkline: input.financialData.map(d => ({ year: d.year, value: d.profitAfterTax })),
      equitySparkline: input.financialData.map(d => ({ year: d.year, value: d.equityEndOfYear })),
    };
  }, [latestYear, input.financialData, formatValue, formatPercent, t]);

  // Risk breakdown for personal dashboard
  const riskBreakdown = useMemo(() => {
    const categories = ['Legal/Compliance', 'Financial', 'Governance'] as const;
    return categories.map(category => {
      const risk = enrichedRiskBreakdown[category];
      return {
        category,
        score: risk?.assignedScore ?? null,
        maxScore: risk?.maxScore ?? null,
        scoreFormatted: risk ? risk.assignedScore.toString() : t('common.naShort'),
        unitFormatted: risk ? `/ ${risk.maxScore ?? t('common.naShort')}` : undefined,
      };
    });
  }, [enrichedRiskBreakdown, t]);

  return {
    corporateKpis,
    personalKpis,
    totalRiskDisplay,
    financialSummary,
    riskBreakdown,
    riskLevelLabels,
  };
}

/**
 * Hook for executive summary KPIs
 */
export function useExecutiveKpis() {
  const input = useKpiCalculationInput();
  const formatValue = useKpiFormatter();
  const { t } = useTranslation();
  const { formatNumber, formatPercent, formatCurrency, formatDate } = useFormatters();

  // Get executive summary financial KPIs
  const financialKpis = useMemo(() => {
    const kpiIds = EXECUTIVE_SUMMARY_KPIS;
    const definitions = kpiIds
      .map(id => getKpiById(id))
      .filter((def): def is NonNullable<typeof def> => def !== undefined);

    return calculateKpis(definitions, input, { includeTrend: true }).map(result => ({
      ...result,
      formattedValue: formatValue(result.value, result.definition.unit),
    }));
  }, [input, formatValue]);

  // Formatted millions for display
  const formatMillions = useCallback(
    (value: number | null) => {
      if (typeof value !== 'number') {
        return t('executive.placeholder.unavailable');
      }
      const millions = value / 1_000_000;
      return t('executive.units.million', {
        value: formatNumber(millions, { maximumFractionDigits: 1, minimumFractionDigits: 1 }),
      });
    },
    [formatNumber, t]
  );

  // Format YoY change label
  const formatChangeLabel = useCallback(
    (value: number) => {
      const formattedPercent = formatPercent(value / 100, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
        signDisplay: 'exceptZero',
      });
      return `${formattedPercent} ${t('executive.vsLastYear')}`;
    },
    [formatPercent, t]
  );

  // Format trend chart value (millions)
  const formatTrendValue = useCallback(
    (value: number | null) =>
      typeof value === 'number'
        ? t('executive.units.million', {
            value: formatNumber(value, { maximumFractionDigits: 1, minimumFractionDigits: 1 }),
          })
        : t('executive.placeholder.unavailable'),
    [formatNumber, t]
  );

  // Format financial alert value (DKK or days)
  const formatAlertValue = useCallback(
    (alertValue: number, unit: 'DKK' | 'days') =>
      unit === 'DKK'
        ? formatCurrency(alertValue, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
        : t('executive.units.days', { count: alertValue }),
    [formatCurrency, t]
  );

  // Format red flag value (DKK or days)
  const formatRedFlagValue = useCallback(
    (value: number | null, unit: 'DKK' | 'days') => {
      if (value === null) {
        return t('executive.placeholder.unavailable');
      }
      return unit === 'DKK'
        ? formatCurrency(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
        : t('executive.units.days', { count: value });
    },
    [formatCurrency, t]
  );

  // Format currency value (simple wrapper)
  const formatCurrencyValue = useCallback(
    (value: number) => formatCurrency(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    [formatCurrency]
  );

  // Format date value
  const formatDateValue = useCallback((iso: string) => formatDate(iso), [formatDate]);

  // Risk category labels
  const riskCategoryLabels = useMemo(
    () => ({
      'Legal/Compliance': t('executive.risk.category.legalCompliance'),
      Governance: t('executive.risk.category.governance'),
      'Sector/Operations': t('executive.risk.category.sectorOperations'),
      Financial: t('executive.risk.category.financial'),
      'SOCMINT/Reputation': t('executive.risk.category.reputation'),
    }),
    [t]
  );

  // Risk level labels
  const riskLevelLabels = useMemo(
    () => ({
      KRITISK: t('executive.risk.level.critical'),
      HØJ: t('executive.risk.level.high'),
      MODERAT: t('executive.risk.level.medium'),
      LAV: t('executive.risk.level.low'),
      'N/A': t('executive.risk.level.na'),
    }),
    [t]
  );

  // Priority labels
  const priorityLabels = useMemo(
    () => ({
      Påkrævet: t('executive.priority.required'),
      Høj: t('executive.priority.high'),
      Middel: t('executive.priority.medium'),
    }),
    [t]
  );

  // Horizon labels
  const horizonLabels = useMemo(
    () => ({
      '0-30 dage': t('executive.horizon.0_30'),
      '1-3 mdr': t('executive.horizon.1_3'),
      '3-12 mdr': t('executive.horizon.3_12'),
    }),
    [t]
  );

  // Get the KPI data we need
  const grossProfitKpi = useMemo(
    () => financialKpis.find(k => k.definition.id === 'grossProfit'),
    [financialKpis]
  );

  const profitAfterTaxKpi = useMemo(
    () => financialKpis.find(k => k.definition.id === 'profitAfterTax'),
    [financialKpis]
  );

  const dsoKpi = useMemo(
    () => financialKpis.find(k => k.definition.id === 'dso'),
    [financialKpis]
  );

  return {
    financialKpis,
    grossProfitKpi,
    profitAfterTaxKpi,
    dsoKpi,
    formatMillions,
    formatChangeLabel,
    formatTrendValue,
    formatAlertValue,
    formatRedFlagValue,
    formatCurrencyValue,
    formatDateValue,
    formatValue,
    // Label maps
    riskCategoryLabels,
    riskLevelLabels,
    priorityLabels,
    horizonLabels,
  };
}

export type { KpiResult, KpiStatus, KpiCategory, KpiAggregation };
