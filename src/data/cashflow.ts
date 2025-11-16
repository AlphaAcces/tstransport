import { CashflowYear, CashflowSummary } from '../types';

// Data sourced from 2024 annual report and analysis. All figures in DKK.
export const cashflowYearlyData: CashflowYear[] = [
  {
    year: 2022,
    grossProfit: 25439000,
    receivablesTotal: 12217000, // From balance sheet
    receivablesRelated: 5000000, // Estimated
    receivablesExternal: 7217000,
    cashAndBank: 57000, // From balance sheet
    shortTermDebt: 7111000, // From balance sheet
    dsoDays: 192,
  },
  {
    year: 2023,
    grossProfit: 22668000,
    receivablesTotal: 20237000, // From balance sheet
    receivablesRelated: 10000000, // Estimated
    receivablesExternal: 10237000,
    cashAndBank: 42000, // From balance sheet
    shortTermDebt: 8222000, // From balance sheet
    dsoDays: 358,
  },
  {
    year: 2024,
    grossProfit: 21489302,
    receivablesTotal: 21077723,
    receivablesRelated: 12400000,
    receivablesExternal: 8677723,
    cashAndBank: 31,
    shortTermDebt: 9175241,
    potentialTaxClaim: 4000000,
    dsoDays: 358,
  }
];

export const cashflowSummary: CashflowSummary = {
  cashOnHand: 31,
  internalReceivables: 12400000,
  dsoDays2024: 358,
  potentialTaxClaim: 4000000,
};
