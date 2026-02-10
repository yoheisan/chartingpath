/**
 * Shared types and constants for the pattern screener system.
 * 
 * IMPORTANT: This is the single source of truth for screener types.
 * All screener-related components (PatternScreenerTeaser, PatternScreenerTable,
 * LivePatternsPage, LivePatternPreview) must import from here.
 * Do NOT duplicate these interfaces in individual components.
 */

import type { CompressedBar, VisualSpec, PatternQuality } from '@/types/VisualSpec';

/** A live pattern detection / signal setup */
export interface LiveSetup {
  /** DB identifier for lazy-loading full chart details */
  dbId?: string;
  instrument: string;
  patternId: string;
  patternName: string;
  direction: 'long' | 'short';
  signalTs: string;
  quality: PatternQuality | { score: string; grade?: string; reasons: string[] };
  tradePlan: {
    entry: number;
    stopLoss: number;
    takeProfit: number;
    rr: number;
    entryType?: string;
    stopDistance?: number;
    tpDistance?: number;
    timeStopBars?: number;
    bracketLevelsVersion?: string;
    priceRounding?: { priceDecimals: number; rrDecimals: number };
  };
  bars?: CompressedBar[] | any[];
  visualSpec?: VisualSpec | any;
  /** Price data */
  currentPrice?: number;
  prevClose?: number;
  changePercent?: number | null;
  /** Trend alignment */
  trendAlignment?: 'with_trend' | 'counter_trend' | 'neutral' | null;
  trendIndicators?: {
    macd_signal?: string;
    ema_trend?: string;
    rsi_zone?: string;
    adx_strength?: string;
  } | null;
  /** Historical performance metrics (from pattern_hit_rates) */
  historicalPerformance?: {
    winRate: number;
    avgRMultiple: number;
    sampleSize: number;
    profitFactor?: number;
    avgDurationBars?: number;
    accumulatedRoi?: {
      threeMonth: number | null;
      sixMonth: number | null;
      oneYear: number | null;
      threeYear: number | null;
      fiveYear: number | null;
    };
  };
}

/** Response from scan-live-patterns edge function */
export interface ScanResult {
  success: boolean;
  patterns: LiveSetup[];
  scannedAt: string;
  instrumentsScanned: number;
  assetType?: string;
  marketOpen?: boolean;
  marketStatus?: 'open' | 'closed';
  error?: string;
}

export type AssetType = 'fx' | 'crypto' | 'stocks' | 'commodities' | 'indices' | 'etfs';

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  fx: 'Forex',
  crypto: 'Crypto',
  stocks: 'Stocks',
  commodities: 'Commodities',
  indices: 'Indices',
  etfs: 'ETFs',
};

/** Grade ordering for sorting (A=1 best, F=5 worst) */
export const GRADE_ORDER: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, F: 5 };

/** Extract a sortable grade string from a LiveSetup */
export const getPatternGrade = (setup: LiveSetup): string => {
  const q = setup.quality as any;
  return q?.grade || q?.score || 'C';
};
