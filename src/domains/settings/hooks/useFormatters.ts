/**
 * Dynamic Formatting Hook
 *
 * Provides formatters that automatically use the active user settings
 * (currency, locale, timezone, date format).
 */

import { useCallback, useMemo } from 'react';
import { useUserSettings } from './useUserSettings';
import {
  formatCurrency as baseFormatCurrency,
  formatNumber as baseFormatNumber,
  formatDate as baseFormatDate,
  formatDateTime as baseFormatDateTime,
  formatPercent as baseFormatPercent,
  formatDSO as baseFormatDSO,
  FormatCurrencyOptions,
  FormatNumberOptions,
  FormatDateOptions,
  FormatDSOOptions,
} from '../../../lib/format';
import { CURRENCY_CONFIGS, LOCALE_CONFIGS } from '../types';

const DATE_STYLE_MAP: Record<'short' | 'medium' | 'long', Intl.DateTimeFormatOptions['dateStyle']> = {
  short: 'short',
  medium: 'medium',
  long: 'long',
};

export const useFormatters = () => {
  const { currency, locale, timezone, dateFormat } = useUserSettings();

  const currencyDigits = useMemo(() => CURRENCY_CONFIGS[currency]?.decimalPlaces ?? 2, [currency]);
  const hour12 = useMemo(() => LOCALE_CONFIGS[locale]?.timeFormat === '12h', [locale]);
  const dateStyle = useMemo(() => DATE_STYLE_MAP[dateFormat] ?? 'medium', [dateFormat]);

  const baseCurrencyOptions = useMemo<Pick<FormatCurrencyOptions, 'currency' | 'locale' | 'minimumFractionDigits' | 'maximumFractionDigits'>>(
    () => ({
      currency,
      locale,
      minimumFractionDigits: currencyDigits,
      maximumFractionDigits: currencyDigits,
    }),
    [currency, currencyDigits, locale],
  );

  const baseNumberOptions = useMemo<Pick<FormatNumberOptions, 'locale'>>(
    () => ({ locale }),
    [locale],
  );

  const baseDateOptions = useMemo<Pick<FormatDateOptions, 'locale' | 'timeZone' | 'dateStyle' | 'hour12'> >(
    () => ({
      locale,
      timeZone: timezone,
      dateStyle,
      hour12,
    }),
    [locale, timezone, dateStyle, hour12],
  );

  const formatCurrency = useCallback(
    (value: number | null | undefined, options: Omit<FormatCurrencyOptions, 'currency' | 'locale'> = {}) =>
      baseFormatCurrency(value, { ...baseCurrencyOptions, ...options }),
    [baseCurrencyOptions],
  );

  const formatNumber = useCallback(
    (value: number | null | undefined, options: Omit<FormatNumberOptions, 'locale'> = {}) =>
      baseFormatNumber(value, { ...baseNumberOptions, ...options }),
    [baseNumberOptions],
  );

  const formatPercent = useCallback(
    (value: number | null | undefined, options: Omit<FormatNumberOptions, 'locale'> = {}) =>
      baseFormatPercent(value, { ...baseNumberOptions, ...options }),
    [baseNumberOptions],
  );

  const formatDate = useCallback(
    (value: string | Date | null | undefined, options: Omit<FormatDateOptions, 'locale'> = {}) =>
      baseFormatDate(value, { ...baseDateOptions, ...options }),
    [baseDateOptions],
  );

  const formatDateTime = useCallback(
    (value: string | Date | null | undefined, options: Omit<FormatDateOptions, 'locale'> = {}) =>
      baseFormatDateTime(value, { ...baseDateOptions, timeStyle: 'short', ...options }),
    [baseDateOptions],
  );

  const formatDSO = useCallback(
    (value: number | null | undefined, options: Omit<FormatDSOOptions, 'locale'> = {}) =>
      baseFormatDSO(value, { locale, ...options }),
    [locale],
  );

  const formatCompactNumber = useCallback(
    (value: number | null | undefined, options: Omit<FormatNumberOptions, 'locale'> = {}) =>
      baseFormatNumber(value, { notation: 'compact', maximumFractionDigits: 1, ...baseNumberOptions, ...options }),
    [baseNumberOptions],
  );

  return {
    formatCurrency,
    formatNumber,
    formatPercent,
    formatDate,
    formatDateTime,
    formatDSO,
    formatCompactNumber,
    currency,
    locale,
    timezone,
    dateFormat,
    hour12,
  };
};
