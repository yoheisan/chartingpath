// VisualSpec schema for Setup Finder chart rendering
// Version 2.0.0 - Enhanced with Pattern Quality Score

export interface CompressedBar {
  t: string;  // timestamp ISO
  o: number;  // open
  h: number;  // high
  l: number;  // low
  c: number;  // close
  v: number;  // volume
}

export interface HLineOverlay {
  type: 'hline';
  id: string;
  price: number;
  label: string;
  style: 'primary' | 'destructive' | 'positive' | 'muted';
}

export interface BoxOverlay {
  type: 'box';
  id: string;
  startTs: string;
  endTs: string;
  label: string;
  style: 'primary' | 'destructive' | 'positive' | 'muted';
}

export interface ZigZagPivot {
  index: number;
  price: number;
  type: 'high' | 'low';
  timestamp: string;
  label?: string;
  /** Structural role within the pattern (e.g. "B1", "T1", "LS", "H", "RS", "Rim", "Cup", "Handle") */
  role?: string;
}

export interface PivotOverlay {
  type: 'pivot';
  id: string;
  pivots: ZigZagPivot[];
  style: 'primary' | 'muted';
}

export type Overlay = HLineOverlay | BoxOverlay | PivotOverlay;

export interface QualityFactor {
  name: string;
  score: number; // 0-10
  weight: number;
  description: string;
  passed: boolean;
}

export interface PatternQuality {
  score: number; // 0-10 numeric score (primary)
  grade: 'A' | 'B' | 'C' | 'D' | 'F'; // Letter grade for display
  confidence: number; // 0-100%
  reasons: string[];
  warnings: string[];
  factors?: QualityFactor[];
  tradeable: boolean;
}

export interface VisualSpec {
  version: string;
  symbol: string;
  timeframe: string;
  patternId: string;
  signalTs: string;
  window: {
    startTs: string;
    endTs: string;
  };
  yDomain: {
    min: number;
    max: number;
  };
  overlays: Overlay[];
  pivots?: ZigZagPivot[]; // ZigZag pivots for pattern explainability
  detectionBarClosed?: boolean; // true only when the detection bar's candle has fully closed
  entryBarTimestamp?: number; // Unix timestamp (seconds) of the entry bar's close
  significantVolumeBars?: string[]; // ISO timestamps of pattern-significant volume bars
  // Trade lifecycle info (for historical occurrences)
  entryBarIndex?: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  outcome?: 'hit_tp' | 'hit_sl' | 'timeout' | 'pending' | null;
  outcomePrice?: number | null;
  outcomeDate?: string | null;
  barsToOutcome?: number | null;
}

export interface SetupWithVisuals {
  dbId?: string;
  instrument: string;
  patternId: string;
  patternName: string;
  direction: 'long' | 'short';
  signalTs: string;
  quality: PatternQuality; // Enhanced quality object
  tradePlan: {
    entryType: string;
    entry: number;
    stopLoss: number;
    takeProfit: number;
    rr: number;
    stopDistance: number;
    tpDistance: number;
    timeStopBars: number;
    bracketLevelsVersion: string;
    priceRounding: { priceDecimals: number; rrDecimals: number };
  };
  bars: CompressedBar[];
  visualSpec: VisualSpec;
  // Trade outcome info (for historical occurrences)
  outcome?: 'hit_tp' | 'hit_sl' | 'timeout' | 'pending' | null;
  outcomePnlPercent?: number | null;
  barsToOutcome?: number | null;
  entryBarIndex?: number;
  // Historical hit rate (populated from pattern_hit_rates table)
  historicalPerformance?: {
    winRate: number;
    avgRMultiple: number;
    sampleSize: number;
    reliabilityScore: number;
  };
}
