/**
 * Intl Formatting Utilities
 *
 * Locale-aware formatting for currency, numbers, percentages, dates, and DSO.
 * Supports dynamic currency and locale selection for multi-jurisdiction use cases.
 */

const DEFAULT_LOCALE = 'da-DK';
const DEFAULT_CURRENCY = 'DKK';

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export interface FormatNumberOptions extends Intl.NumberFormatOptions {
  locale?: string;
}

export interface FormatCurrencyOptions extends Intl.NumberFormatOptions {
  locale?: string;
  currency?: string;
}

export interface FormatDateOptions extends Intl.DateTimeFormatOptions {
  locale?: string;
}

export interface FormatDSOOptions {
  locale?: string;
  /** Optional suffix label (ex: 'dage', 'days'). */
  unitLabel?: string;
  maximumFractionDigits?: number;
}

export const formatNumber = (value: number | null | undefined, options: FormatNumberOptions = {}): string => {
  if (!isFiniteNumber(value)) return '–';
  const { locale = DEFAULT_LOCALE, ...rest } = options;
  return new Intl.NumberFormat(locale, rest).format(value);
};

export const formatCurrency = (value: number | null | undefined, options: FormatCurrencyOptions = {}): string => {
  if (!isFiniteNumber(value)) return '–';
  const {
    locale = DEFAULT_LOCALE,
    currency = DEFAULT_CURRENCY,
    minimumFractionDigits,
    maximumFractionDigits,
    ...rest
  } = options;

  const resolvedMinimum = minimumFractionDigits ?? 0;
  const resolvedMaximum = maximumFractionDigits ?? resolvedMinimum;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: resolvedMinimum,
    maximumFractionDigits: resolvedMaximum,
    ...rest,
  }).format(value);
};

export const formatPercent = (value: number | null | undefined, options: FormatNumberOptions = {}): string => {
  if (!isFiniteNumber(value)) return '–';
  const { locale = DEFAULT_LOCALE, ...intlOptions } = options;
  const requestedMin = intlOptions.minimumFractionDigits;
  const requestedMax = intlOptions.maximumFractionDigits;

  const hasMin = typeof requestedMin === 'number';
  const hasMax = typeof requestedMax === 'number';

  let safeMin: number;
  let safeMax: number;

  if (hasMin && hasMax) {
    safeMin = Math.min(requestedMin!, requestedMax!);
    safeMax = Math.max(requestedMin!, requestedMax!);
  } else if (hasMax) {
    safeMin = 0;
    safeMax = requestedMax!;
  } else if (hasMin) {
    safeMin = requestedMin!;
    safeMax = requestedMin!;
  } else {
    safeMin = 1;
    safeMax = 1;
  }

  const formatted = new Intl.NumberFormat(locale, {
    ...intlOptions,
    style: 'percent',
    minimumFractionDigits: safeMin,
    maximumFractionDigits: safeMax,
  }).format(value);

  // Trim locale-inserted whitespace before the percent sign for consistency across locales.
  return formatted.replace(/\s+(?=%)/g, '');
};

export const formatDate = (value: string | Date | null | undefined, options: FormatDateOptions = {}): string => {
  if (!value) return '–';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '–';

  const { locale = DEFAULT_LOCALE, ...rest } = options;
  const hasDateStyle = typeof rest.dateStyle !== 'undefined';
  const baseOptions: Intl.DateTimeFormatOptions = hasDateStyle
    ? {}
    : { day: '2-digit', month: 'short', year: 'numeric' };

  return new Intl.DateTimeFormat(locale, {
    ...baseOptions,
    ...rest,
  }).format(date);
};

export const formatDateTime = (value: string | Date | null | undefined, options: FormatDateOptions = {}): string => {
  return formatDate(value, {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
};

export const formatDSO = (value: number | null | undefined, options: FormatDSOOptions = {}): string => {
  if (!isFiniteNumber(value)) return '–';
  const { locale = DEFAULT_LOCALE, unitLabel, maximumFractionDigits = 0 } = options;
  const formatted = formatNumber(value, { locale, maximumFractionDigits });
  return unitLabel ? `${formatted} ${unitLabel}` : formatted;
};
