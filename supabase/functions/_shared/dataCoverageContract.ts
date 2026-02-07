/**
 * DATA COVERAGE CONTRACT (Backend Version)
 * 
 * Single source of truth for data availability constraints.
 * MUST be kept in sync with src/config/dataCoverageContract.ts
 * 
 * Current Provider: Yahoo Finance (primary), EODHD (secondary)
 * Last Verified: 2026-02-02
 */

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '8h' | '1d' | '1wk' | '1M';

export interface TimeframeCoverage {
  maxLookbackYears: number;
  maxLookbackDays: number;
  description: string;
  isIntraday: boolean;
  defaultLookbackYears: number;
}

export const DATA_COVERAGE: Record<Timeframe, TimeframeCoverage> = {
  '1m': {
    maxLookbackYears: 0.02,
    maxLookbackDays: 7,
    description: '7 days max',
    isIntraday: true,
    defaultLookbackYears: 0.02,
  },
  '5m': {
    maxLookbackYears: 0.02,
    maxLookbackDays: 7,
    description: '7 days max',
    isIntraday: true,
    defaultLookbackYears: 0.02,
  },
  '15m': {
    maxLookbackYears: 0.16,
    maxLookbackDays: 60,
    description: '60 days max',
    isIntraday: true,
    defaultLookbackYears: 0.08,
  },
  '1h': {
    maxLookbackYears: 2,
    maxLookbackDays: 730,
    description: '2 years max',
    isIntraday: true,
    defaultLookbackYears: 1,
  },
  '4h': {
    maxLookbackYears: 2,
    maxLookbackDays: 730,
    description: '2 years max',
    isIntraday: true,
    defaultLookbackYears: 1,
  },
  '8h': {
    maxLookbackYears: 2,
    maxLookbackDays: 730,
    description: '2 years max (aggregated from 1h)',
    isIntraday: true,
    defaultLookbackYears: 1,
  },
  '1d': {
    maxLookbackYears: 5,
    maxLookbackDays: 1825,
    description: '5 years max',
    isIntraday: false,
    defaultLookbackYears: 3,
  },
  '1wk': {
    maxLookbackYears: 7,
    maxLookbackDays: 2555,
    description: '7 years max',
    isIntraday: false,
    defaultLookbackYears: 5,
  },
  '1M': {
    maxLookbackYears: 10,
    maxLookbackDays: 3650,
    description: '10 years max',
    isIntraday: false,
    defaultLookbackYears: 5,
  },
};

/**
 * Validate that a requested lookback is within data coverage
 */
export function validateLookback(
  timeframe: Timeframe, 
  requestedYears: number
): { valid: boolean; maxAllowed: number; message?: string } {
  const coverage = DATA_COVERAGE[timeframe];
  
  if (!coverage) {
    return { 
      valid: false, 
      maxAllowed: 1, 
      message: `Unknown timeframe: ${timeframe}` 
    };
  }
  
  if (requestedYears <= coverage.maxLookbackYears) {
    return { valid: true, maxAllowed: coverage.maxLookbackYears };
  }
  
  return {
    valid: false,
    maxAllowed: coverage.maxLookbackYears,
    message: `Requested ${requestedYears} year(s) exceeds ${timeframe} data coverage of ${coverage.description}. ` +
             `Maximum allowed: ${coverage.maxLookbackYears} year(s).`,
  };
}

/**
 * Get the effective lookback, clamping to maximum if exceeded
 */
export function clampLookback(timeframe: Timeframe, requestedYears: number): number {
  const coverage = DATA_COVERAGE[timeframe];
  if (!coverage) return Math.min(requestedYears, 1);
  return Math.min(requestedYears, coverage.maxLookbackYears);
}

/**
 * Calculate date range from lookback years
 */
export function calculateDateRange(lookbackYears: number): { fromDate: string; toDate: string } {
  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setFullYear(fromDate.getFullYear() - Math.floor(lookbackYears));
  fromDate.setMonth(fromDate.getMonth() - Math.round((lookbackYears % 1) * 12));
  
  return {
    fromDate: fromDate.toISOString().split('T')[0],
    toDate: today.toISOString().split('T')[0],
  };
}
