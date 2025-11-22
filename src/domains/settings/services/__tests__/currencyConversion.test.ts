/**
 * Currency Conversion Service Tests
 */

import { describe, it, expect } from 'vitest';
import { convertFromDKK, convertCurrency, getExchangeRate, EXCHANGE_RATES } from '../currencyConversion';
import { Currency } from '../../types';

describe('Currency Conversion Service', () => {
  describe('convertFromDKK', () => {
    it('converts DKK to EUR correctly', () => {
      const result = convertFromDKK(1000, Currency.EUR);
      expect(result).toBeCloseTo(134, 0);
    });

    it('converts DKK to USD correctly', () => {
      const result = convertFromDKK(1000, Currency.USD);
      expect(result).toBeCloseTo(145, 0);
    });

    it('converts DKK to GBP correctly', () => {
      const result = convertFromDKK(1000, Currency.GBP);
      expect(result).toBeCloseTo(115, 0);
    });

    it('converts DKK to SEK correctly', () => {
      const result = convertFromDKK(1000, Currency.SEK);
      expect(result).toBeCloseTo(1520, 0);
    });

    it('converts DKK to NOK correctly', () => {
      const result = convertFromDKK(1000, Currency.NOK);
      expect(result).toBeCloseTo(1540, 0);
    });

    it('converts DKK to USDT correctly (USD parity)', () => {
      const result = convertFromDKK(1000, Currency.USDT);
      expect(result).toBeCloseTo(145, 0);
    });

    it('verifies USDT has same rate as USD', () => {
      const usdResult = convertFromDKK(1000000, Currency.USD);
      const usdtResult = convertFromDKK(1000000, Currency.USDT);
      expect(usdResult).toBe(usdtResult);
    });

    it('returns same amount for DKK to DKK', () => {
      const result = convertFromDKK(1000, Currency.DKK);
      expect(result).toBe(1000);
    });

    it('returns null for null input', () => {
      expect(convertFromDKK(null, Currency.EUR)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(convertFromDKK(undefined, Currency.EUR)).toBeNull();
    });

    it('handles very large numbers', () => {
      const result = convertFromDKK(1_000_000_000, Currency.EUR);
      expect(result).toBeCloseTo(134_000_000, -6);
    });

    it('handles very small numbers', () => {
      const result = convertFromDKK(0.01, Currency.EUR);
      expect(result).toBeCloseTo(0.00134, 5);
    });

    it('handles negative amounts', () => {
      const result = convertFromDKK(-1000, Currency.USD);
      expect(result).toBeCloseTo(-145, 0);
    });
  });

  describe('convertCurrency', () => {
    it('converts EUR to USD via DKK', () => {
      const eurAmount = 100;
      const result = convertCurrency(eurAmount, Currency.EUR, Currency.USD);
      // 100 EUR → ~746.27 DKK → ~108.21 USD
      expect(result).toBeCloseTo(108.2, 0);
    });

    it('converts SEK to GBP via DKK', () => {
      const sekAmount = 1000;
      const result = convertCurrency(sekAmount, Currency.SEK, Currency.GBP);
      // 1000 SEK → ~657.89 DKK → ~75.66 GBP
      expect(result).toBeCloseTo(75.7, 0);
    });

    it('returns same amount when source equals target', () => {
      const result = convertCurrency(500, Currency.USD, Currency.USD);
      expect(result).toBe(500);
    });

    it('returns null for null input', () => {
      expect(convertCurrency(null, Currency.EUR, Currency.USD)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(convertCurrency(undefined, Currency.EUR, Currency.USD)).toBeNull();
    });

    it('handles round-trip conversions with minimal loss', () => {
      const original = 1000;
      const converted = convertCurrency(original, Currency.DKK, Currency.EUR);
      const backConverted = convertCurrency(converted, Currency.EUR, Currency.DKK);
      expect(backConverted).toBeCloseTo(original, 0);
    });
  });

  describe('getExchangeRate', () => {
    it('returns correct rate for EUR', () => {
      expect(getExchangeRate(Currency.EUR)).toBe(EXCHANGE_RATES[Currency.EUR]);
    });

    it('returns correct rate for USD', () => {
      expect(getExchangeRate(Currency.USD)).toBe(EXCHANGE_RATES[Currency.USD]);
    });

    it('returns 1.0 for DKK', () => {
      expect(getExchangeRate(Currency.DKK)).toBe(1.0);
    });

    it('returns rate for all supported currencies', () => {
      Object.values(Currency).forEach((currency) => {
        const rate = getExchangeRate(currency);
        expect(typeof rate).toBe('number');
        expect(rate).toBeGreaterThan(0);
      });
    });
  });
});
