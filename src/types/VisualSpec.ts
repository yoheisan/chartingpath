// VisualSpec schema for Setup Finder chart rendering
// Version 1.0.0

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

export type Overlay = HLineOverlay | BoxOverlay;

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
}

export interface SetupWithVisuals {
  instrument: string;
  patternId: string;
  patternName: string;
  direction: 'long' | 'short';
  signalTs: string;
  quality: { score: string; reasons: string[] };
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
}
