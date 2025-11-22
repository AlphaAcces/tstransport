/**
 * Currency Conversion Service
 *
 * Provides exchange rate conversions with DKK as the base currency.
 * Rates are approximate fiscal year 2024 values for demonstration.
 * In production, fetch from an API or financial data service.
 */

import { Currency } from '../types';

/**
 * Exchange rates relative to 1 DKK.
 * Updated: 2024 fiscal year approximate rates.
 */
export const EXCHANGE_RATES: Record<Currency, number> = {
  [Currency.DKK]: 1.0,        // Base currency
  [Currency.EUR]: 0.134,      // 1 DKK ≈ 0.134 EUR
  [Currency.USD]: 0.145,      // 1 DKK ≈ 0.145 USD
  [Currency.GBP]: 0.115,      // 1 DKK ≈ 0.115 GBP
  [Currency.SEK]: 1.52,       // 1 DKK ≈ 1.52 SEK
  [Currency.NOK]: 1.54,       // 1 DKK ≈ 1.54 NOK
  [Currency.USDT]: 0.145,     // 1 DKK ≈ 0.145 USDT (USD parity)
};

/**
 * Convert an amount from DKK to the target currency.
 *
 * @param amountInDKK - The amount in Danish Kroner
 * @param targetCurrency - The target currency code
 * @returns The converted amount, or null if input is null/undefined
 */
export const convertFromDKK = (
  amountInDKK: number | null | undefined,
  targetCurrency: Currency,
): number | null => {
  if (typeof amountInDKK !== 'number' || !Number.isFinite(amountInDKK)) {
    return null;
  }

  const rate = EXCHANGE_RATES[targetCurrency];
  if (typeof rate !== 'number') {
    console.warn(`Unknown currency: ${targetCurrency}, defaulting to DKK`);
    return amountInDKK;
  }

  return amountInDKK * rate;
};

/**
 * Convert an amount from source currency to target currency.
 *
 * @param amount - The amount in source currency
 * @param sourceCurrency - The source currency code
 * @param targetCurrency - The target currency code
 * @returns The converted amount, or null if input is null/undefined
 */
export const convertCurrency = (
  amount: number | null | undefined,
  sourceCurrency: Currency,
  targetCurrency: Currency,
): number | null => {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return null;
  }

  // Same currency = no conversion
  if (sourceCurrency === targetCurrency) {
    return amount;
  }

  // Convert source → DKK → target
  const sourceRate = EXCHANGE_RATES[sourceCurrency];
  const targetRate = EXCHANGE_RATES[targetCurrency];

  if (typeof sourceRate !== 'number' || typeof targetRate !== 'number') {
    console.warn(`Invalid currency pair: ${sourceCurrency} → ${targetCurrency}`);
    return amount;
  }

  const amountInDKK = amount / sourceRate;
  return amountInDKK * targetRate;
};

/**
 * Get the exchange rate from DKK to target currency.
 *
 * @param targetCurrency - The target currency code
 * @returns The exchange rate, or 1.0 if unknown
 */
export const getExchangeRate = (targetCurrency: Currency): number => {
  return EXCHANGE_RATES[targetCurrency] ?? 1.0;
};
