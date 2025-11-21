import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate, formatDSO, formatNumber, formatPercent } from '../intl';

describe('format utilities', () => {
  it('formats currency with defaults', () => {
    expect(formatCurrency(1_250_000)).toMatch(/1\.250\.000|1,250,000/);
  });

  it('returns dash for invalid currency input', () => {
    expect(formatCurrency(null)).toBe('–');
  });

  it('formats generic numbers', () => {
    expect(formatNumber(1234.56, { maximumFractionDigits: 1 })).toMatch(/1.234,6|1,234.6/);
  });

  it('formats percentages', () => {
    expect(formatPercent(0.257, { maximumFractionDigits: 0 })).toMatch(/26%|25%/);
  });

  it('formats dates safely', () => {
    expect(formatDate('2024-03-15')).toBeTruthy();
    expect(formatDate('invalid')).toBe('–');
  });

  it('formats DSO with optional unit', () => {
    expect(formatDSO(355, { unitLabel: 'dage' })).toMatch(/355/);
  });
});
