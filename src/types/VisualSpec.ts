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
}

export interface SetupWithVisuals {
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
  // Historical hit rate (populated from pattern_hit_rates table)
  historicalPerformance?: {
    winRate: number;
    avgRMultiple: number;
    sampleSize: number;
    reliabilityScore: number;
  };
}
