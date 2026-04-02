/**
 * DATA COVERAGE CONTRACT
 * 
 * Single source of truth for data availability constraints.
 * This contract MUST be referenced by:
 * - All wizard UIs (PatternLab, SetupFinder, PortfolioCheckup, etc.)
 * - Backend executors (projects-run, scan functions)
 * - Validation layers before execution
 * 
 * IMPORTANT: These limits are set by actual data provider capabilities,
 * not arbitrary business decisions. Any changes require data infrastructure updates.
 * 
 * Current Provider: Yahoo Finance (primary), EODHD (secondary)
 * Last Verified: 2026-02-02
 */

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '8h' | '1d' | '1wk' | '1M';

export interface TimeframeCoverage {
  /** Maximum historical lookback in years */
  maxLookbackYears: number;
  /** Maximum lookback in days (for intraday precision) */
  maxLookbackDays: number;
  /** Human-readable description */
  description: string;
  /** Whether this is an intraday timeframe */
  isIntraday: boolean;
  /** Recommended default lookback */
  defaultLookbackYears: number;
}

/**
 * DATA COVERAGE LIMITS BY TIMEFRAME
 * 
 * These values are derived from Yahoo Finance API limits:
 * - 1m/5m: 7 days max
 * - 15m: 60 days max
 * - 1h: 730 days (2 years) max
 * - 4h: Derived from 1h, same limit
 * - 1d: 5 years reliable, up to 10 years for some instruments
 * - 1wk: 7 years reliable
 * - 1M: 10+ years
 */
export const DATA_COVERAGE: Record<Timeframe, TimeframeCoverage> = {
  '1m': {
    maxLookbackYears: 0.02, // ~7 days
    maxLookbackDays: 7,
    description: '7 days max',
    isIntraday: true,
    defaultLookbackYears: 0.02,
  },
  '5m': {
    maxLookbackYears: 0.02, // ~7 days
    maxLookbackDays: 7,
    description: '7 days max',
    isIntraday: true,
    defaultLookbackYears: 0.02,
  },
  '15m': {
    maxLookbackYears: 0.16, // ~60 days
    maxLookbackDays: 60,
    description: '60 days max',
    isIntraday: true,
    defaultLookbackYears: 0.08, // 30 days default
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
 * Get valid lookback options for a given timeframe
 * Used by all wizard UIs to ensure options match data availability
 */
export function getValidLookbackOptions(timeframe: Timeframe): Array<{ value: number; label: string; disabled?: boolean }> {
  const coverage = DATA_COVERAGE[timeframe];
  
  // For very short timeframes, return days-based options
  if (coverage.maxLookbackDays <= 60) {
    const dayOptions = [7, 14, 30, 60].filter(d => d <= coverage.maxLookbackDays);
    return dayOptions.map(d => ({
      value: d / 365, // Convert to years for consistency
      label: `${d} Days`,
    }));
  }
  
  // For longer timeframes, return year-based options
  const yearOptions = [1, 2, 3, 5, 7, 10];
  return yearOptions.map(y => ({
    value: y,
    label: `${y} Year${y > 1 ? 's' : ''}`,
    disabled: y > coverage.maxLookbackYears,
  })).filter(opt => !opt.disabled);
}

/**
 * Validate that a requested lookback is within data coverage
 * Used by backend executors before running jobs
 */
export function validateLookback(
  timeframe: Timeframe, 
  requestedYears: number
): { valid: boolean; maxAllowed: number; message?: string } {
  const coverage = DATA_COVERAGE[timeframe];
  
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
 * Useful for graceful degradation in backend
 */
export function clampLookback(timeframe: Timeframe, requestedYears: number): number {
  const coverage = DATA_COVERAGE[timeframe];
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

/**
 * Get human-readable coverage info for UI display
 */
export function getCoverageInfo(timeframe: Timeframe): string {
  const coverage = DATA_COVERAGE[timeframe];
  return coverage.description;
}

/**
 * Check if timeframe is intraday (has tighter constraints)
 */
export function isIntradayTimeframe(timeframe: Timeframe): boolean {
  return DATA_COVERAGE[timeframe]?.isIntraday ?? false;
}

/**
 * Get default lookback for a timeframe
 */
export function getDefaultLookback(timeframe: Timeframe): number {
  return DATA_COVERAGE[timeframe]?.defaultLookbackYears ?? 1;
}

/**
 * Get chart data limits for a timeframe
 * Used by all chart components to ensure consistent data fetching
 */
export function getChartDataLimits(timeframe: Timeframe): {
  barLimit: number;
  minBarsRequired: number;
  daysBack: number;
} {
  switch (timeframe) {
    case '1m':
    case '5m':
      return { barLimit: 500, minBarsRequired: 50, daysBack: 7 };
    case '15m':
      return { barLimit: 500, minBarsRequired: 50, daysBack: 30 }; // 30 days (Yahoo 422s at 60d)
    case '1h':
      return { barLimit: 730, minBarsRequired: 50, daysBack: 365 }; // 1 year
    case '4h':
      return { barLimit: 500, minBarsRequired: 20, daysBack: 730 }; // 2 years max (aggregated from 1h, fewer bars expected)
    case '8h':
      return { barLimit: 500, minBarsRequired: 20, daysBack: 730 }; // 2 years max (aggregated from 1h, fewer bars expected)
    case '1wk':
      return { barLimit: 365, minBarsRequired: 30, daysBack: 2555 }; // ~7 years
    case '1M':
      return { barLimit: 120, minBarsRequired: 24, daysBack: 3650 }; // ~10 years
    case '1d':
    default:
      return { barLimit: 1260, minBarsRequired: 50, daysBack: 1825 }; // ~5 years
  }
}

// Re-export for convenience
export const SUPPORTED_TIMEFRAMES: Timeframe[] = ['1h', '4h', '8h', '1d', '1wk'];
