import { FinancialYear } from '../types';

// Data in DKK where applicable.
// EBIT and Personnel Costs for 2019-2022 are estimated based on industry averages and known figures.
// Ratios are calculated based on these figures.
export const financialData: FinancialYear[] = [
  {
    year: 2019,
    revenueOrGrossProfit: 3905000,
    profitAfterTax: 273000,
    staffCount: 0,
    equityEndOfYear: 581000,
    currentAssets: 2960000,
    personnelCosts: 0, // No employees registered
    ebit: 400000, // Estimated
    ebitMargin: 10.2,
    netMargin: 7.0,
    profitPerEmployee: undefined,
  },
  {
    year: 2020,
    revenueOrGrossProfit: 7341000,
    profitAfterTax: 1050000,
    staffCount: 14,
    equityEndOfYear: 1630000,
    currentAssets: 7480000,
    personnelCosts: 5320000, // Estimated
    ebit: 1500000, // Estimated
    ebitMargin: 20.4,
    netMargin: 14.3,
    profitPerEmployee: 75000,
  },
  {
    year: 2021,
    revenueOrGrossProfit: 16882000,
    profitAfterTax: 3911000,
    staffCount: 18,
    equityEndOfYear: 5489000,
    solidity: 51,
    dso: 133,
    currentAssets: 10715000,
    personnelCosts: 7200000, // Estimated
    ebit: 5000000, // Estimated
    ebitMargin: 29.6,
    netMargin: 23.2,
    profitPerEmployee: 217277,
  },
  {
    year: 2022,
    revenueOrGrossProfit: 25439000,
    profitAfterTax: 6715000,
    staffCount: 31,
    equityEndOfYear: 12147000,
    solidity: 63,
    dso: 192,
    currentAssets: 15758000,
    personnelCosts: 12710000, // Estimated
    ebit: 7715000, // Estimated
    ebitMargin: 30.3,
    netMargin: 26.4,
    profitPerEmployee: 216612,
  },
  {
    year: 2023,
    revenueOrGrossProfit: 22668000,
    profitAfterTax: 5268000,
    staffCount: 31,
    equityEndOfYear: 12415000,
    solidity: 58,
    dso: 358,
    currentAssets: 20637000,
    personnelCosts: 13330000, // From report/analysis
    ebit: 6280000,
    ebitMargin: 27.7,
    netMargin: 23.2,
    profitPerEmployee: 169935,
  },
  {
    year: 2024,
    revenueOrGrossProfit: 21489302,
    profitAfterTax: 2957793,
    staffCount: 35,
    equityEndOfYear: 15372985,
    currentAssets: 23760000,
    currentLiabilities: 9175241,
    receivables: 21077723,
    cash: 31,
    solidity: 62,
    dso: 358,
    personnelCosts: 15750000, // From report/analysis
    ebit: 3520000,
    ebitMargin: 16.4,
    netMargin: 13.8,
    profitPerEmployee: 84508,
    currentRatio: 2.6,
    cashRatio: 0.0,
  },
];
