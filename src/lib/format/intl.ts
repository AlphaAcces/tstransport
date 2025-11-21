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
  const { locale = DEFAULT_LOCALE, currency = DEFAULT_CURRENCY, minimumFractionDigits = 0, maximumFractionDigits = 0, ...rest } = options;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
    ...rest,
  }).format(value);
};

export const formatPercent = (value: number | null | undefined, options: FormatNumberOptions = {}): string => {
  if (!isFiniteNumber(value)) return '–';
  const { locale = DEFAULT_LOCALE, minimumFractionDigits = 1, maximumFractionDigits = 1, ...rest } = options;
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
    ...rest,
  }).format(value);
};

export const formatDate = (value: string | Date | null | undefined, options: FormatDateOptions = {}): string => {
  if (!value) return '–';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '–';
  const { locale = DEFAULT_LOCALE, ...rest } = options;
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...rest,
  }).format(date);
};

export const formatDSO = (value: number | null | undefined, options: FormatDSOOptions = {}): string => {
  if (!isFiniteNumber(value)) return '–';
  const { locale = DEFAULT_LOCALE, unitLabel, maximumFractionDigits = 0 } = options;
  const formatted = formatNumber(value, { locale, maximumFractionDigits });
  return unitLabel ? `${formatted} ${unitLabel}` : formatted;
};
