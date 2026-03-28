/**
 * PatternOverlayRenderer
 * 
 * Standardized pattern visualization system for ChartingPath.
 * Single source of truth for rendering historical pattern identifications on charts.
 * 
 * Visual Layers (per pattern):
 * 1. Cyan ZigZag polyline connecting pivots
 * 2. Semi-transparent formation zone (canvas)
 * 3. Entry/SL/TP horizontal price lines with labels
 * 4. Vertical time-range shading for trade duration
 * 5. Pattern name label via series marker
 * 6. Directional signal arrow at entry bar
 * 
 * Color Standard:
 * - Entry: #3b82f6 (blue), solid
 * - Stop Loss: #ef4444 (red), dashed
 * - Take Profit: #22c55e (green), dashed
 * - TP zone: rgba(34, 197, 94, 0.06)
 * - SL zone: rgba(239, 68, 68, 0.06)
 * - ZigZag: rgba(0, 200, 255, 0.85)
 * - Pattern label: #f97316 (orange)
 */

import { Time, IChartApi, CandlestickSeries, LineSeries, SeriesMarkerShape, createSeriesMarkers } from 'lightweight-charts';
import { ZigZagPivot, CompressedBar } from '@/types/VisualSpec';
import { deriveFormationOverlay, FormationOverlayData, ZigZagSegmentSplit, FormationLineData } from '@/utils/formationOverlay';

// === PATTERN OVERLAY COLORS (standardized) ===
export const PATTERN_OVERLAY_COLORS = {
  entry: '#3b82f6',
  stopLoss: '#ef4444',
  takeProfit: '#22c55e',
  tpZone: 'rgba(34, 197, 94, 0.06)',
  slZone: 'rgba(239, 68, 68, 0.06)',
  zigzag: 'rgba(0, 200, 255, 0.85)',
  patternLabel: '#f97316',
  timeRangeZone: 'rgba(59, 130, 246, 0.04)',
  winOutcome: '#22c55e',
  lossOutcome: '#ef4444',
  pendingOutcome: '#6b7280',
  neckline: 'rgba(200, 200, 200, 0.6)',
} as const;

/** A historical pattern occurrence for chart overlay rendering */
export interface HistoricalPatternOverlay {
  id: string;
  patternName: string;
  patternId: string;
  direction: 'long' | 'short' | 'bullish' | 'bearish';
  detectedAt: string; // ISO date
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  outcome?: 'hit_tp' | 'hit_sl' | 'timeout' | 'pending' | 'win' | 'loss' | null;
  outcomePnlPercent?: number | null;
  isActive?: boolean;
  status?: string | null;
  /** Whether the detection bar's candle had fully closed when detected */
  detectionBarClosed?: boolean;
  /** Pivots from visual_spec for zigzag rendering */
  pivots?: ZigZagPivot[];
  /** Pattern's own bars for pivot-to-time resolution */
  bars?: CompressedBar[];
}

/** Toggle state for pattern overlay visibility */
export interface PatternOverlayToggles {
  showPatterns: boolean;
  showEntry: boolean;
  showStopLoss: boolean;
  showTakeProfit: boolean;
  showTradeZones: boolean;
  showZigzag: boolean;
  showLabels: boolean;
}

export const DEFAULT_PATTERN_OVERLAY_TOGGLES: PatternOverlayToggles = {
  showPatterns: true,
  showEntry: true,
  showStopLoss: true,
  showTakeProfit: true,
  showTradeZones: true,
  showZigzag: true,
  showLabels: true,
};

const TOGGLES_STORAGE_KEY = 'chartingpath_pattern_overlay_toggles';

export function loadPatternOverlayToggles(): PatternOverlayToggles {
  try {
    const saved = localStorage.getItem(TOGGLES_STORAGE_KEY);
    if (saved) return { ...DEFAULT_PATTERN_OVERLAY_TOGGLES, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_PATTERN_OVERLAY_TOGGLES;
}

export function savePatternOverlayToggles(toggles: PatternOverlayToggles) {
  try {
    localStorage.setItem(TOGGLES_STORAGE_KEY, JSON.stringify(toggles));
  } catch {}
}

/**
 * Convert a pattern's detected_at date to a chart Time value.
 */
function dateToTime(dateStr: string): Time | null {
  const ts = Math.floor(new Date(dateStr).getTime() / 1000);
  return Number.isFinite(ts) ? (ts as unknown as Time) : null;
}

/**
 * Get outcome color for a pattern occurrence.
 */
export function getOutcomeColor(outcome?: string | null): string {
  if (!outcome) return PATTERN_OVERLAY_COLORS.pendingOutcome;
  if (outcome === 'hit_tp' || outcome === 'win') return PATTERN_OVERLAY_COLORS.winOutcome;
  if (outcome === 'hit_sl' || outcome === 'loss') return PATTERN_OVERLAY_COLORS.lossOutcome;
  return PATTERN_OVERLAY_COLORS.pendingOutcome;
}

/**
 * Render price lines (Entry/SL/TP) for a pattern on a candle series.
 * Returns cleanup function to remove lines.
 */
export function renderPatternPriceLines(
  candleSeries: ReturnType<IChartApi['addSeries']>,
  pattern: HistoricalPatternOverlay,
  toggles: PatternOverlayToggles
): (() => void) {
  const lines: any[] = [];

  // Candle-close guard: if detection bar hasn't closed, show muted "Awaiting confirmation" only
  if (!pattern.detectionBarClosed) {
    if (toggles.showEntry) {
      lines.push(candleSeries.createPriceLine({
        price: pattern.entryPrice,
        color: '#6b7280', // gray
        lineWidth: 1,
        lineStyle: 2, // dashed
        axisLabelVisible: true,
        title: 'Awaiting confirmation',
      }));
    }
    return () => {
      lines.forEach(line => {
        try { candleSeries.removePriceLine(line); } catch {}
      });
    };
  }

  const shortName = pattern.patternName.length > 20 
    ? pattern.patternName.substring(0, 18) + '…'
    : pattern.patternName;

  if (toggles.showEntry) {
    lines.push(candleSeries.createPriceLine({
      price: pattern.entryPrice,
      color: PATTERN_OVERLAY_COLORS.entry,
      lineWidth: 2,
      lineStyle: 0,
      axisLabelVisible: true,
      title: 'ENTRY',
    }));
  }

  if (toggles.showStopLoss) {
    lines.push(candleSeries.createPriceLine({
      price: pattern.stopLossPrice,
      color: PATTERN_OVERLAY_COLORS.stopLoss,
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: 'SL',
    }));
  }

  if (toggles.showTakeProfit) {
    lines.push(candleSeries.createPriceLine({
      price: pattern.takeProfitPrice,
      color: PATTERN_OVERLAY_COLORS.takeProfit,
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: 'TP',
    }));
  }

  return () => {
    lines.forEach(line => {
      try { candleSeries.removePriceLine(line); } catch {}
    });
  };
}

/**
 * Generate chart markers for pattern labels and signal arrows.
 */
export function generatePatternMarkers(
  patterns: HistoricalPatternOverlay[],
  chartBars: CompressedBar[],
  toggles: PatternOverlayToggles
): Array<{
  time: Time;
  position: 'aboveBar' | 'belowBar';
  color: string;
  shape: SeriesMarkerShape;
  text: string;
}> {
  if (!toggles.showLabels || patterns.length === 0) return [];

  const markers: Array<{
    time: Time;
    position: 'aboveBar' | 'belowBar';
    color: string;
    shape: SeriesMarkerShape;
    text: string;
  }> = [];

  // Build a sorted timestamp array from chart bars for nearest-candle snapping
  const chartBarTimes = chartBars.map(b => ({
    ts: Math.floor(new Date(b.t).getTime() / 1000),
    t: b.t,
  })).filter(x => Number.isFinite(x.ts)).sort((a, b) => a.ts - b.ts);

  for (const p of patterns) {
    if (!p.detectedAt) continue;
    const detectedTs = Math.floor(new Date(p.detectedAt).getTime() / 1000);
    if (!Number.isFinite(detectedTs)) continue;
    
    // Find nearest chart bar by timestamp (handles intraday timeframes correctly)
    let bestMatch = chartBarTimes[0];
    let bestDist = Math.abs(detectedTs - bestMatch.ts);
    for (const entry of chartBarTimes) {
      const dist = Math.abs(detectedTs - entry.ts);
      if (dist < bestDist) {
        bestDist = dist;
        bestMatch = entry;
      }
      // Early exit if we've passed the target (sorted array)
      if (entry.ts > detectedTs && dist > bestDist) break;
    }
    if (!bestMatch) continue;

    const time = dateToTime(bestMatch.t);
    if (!time) continue;

    const isLong = p.direction === 'long' || p.direction === 'bullish';
    const outcomeColor = getOutcomeColor(p.outcome);
    
    // Pattern name label
    markers.push({
      time,
      position: isLong ? 'belowBar' : 'aboveBar',
      color: PATTERN_OVERLAY_COLORS.patternLabel,
      shape: isLong ? 'arrowUp' : 'arrowDown',
      text: p.patternName,
    });
  }

  // Sort by time and dedupe
  markers.sort((a, b) => (a.time as number) - (b.time as number));
  const seen = new Set<string>();
  return markers.filter(m => {
    const key = `${m.time}|${m.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Draw vertical trade-range shading and TP/SL zones on a canvas overlay.
 */
export function drawPatternZones(
  ctx: CanvasRenderingContext2D,
  chart: IChartApi,
  candleSeries: ReturnType<IChartApi['addSeries']>,
  patterns: HistoricalPatternOverlay[],
  toggles: PatternOverlayToggles,
  canvasWidth: number,
  canvasHeight: number,
) {
  if (!toggles.showTradeZones) return;

  for (const pattern of patterns) {
    const entryY = (candleSeries as any).priceToCoordinate(pattern.entryPrice);
    const tpY = (candleSeries as any).priceToCoordinate(pattern.takeProfitPrice);
    const slY = (candleSeries as any).priceToCoordinate(pattern.stopLossPrice);

    if (entryY == null || tpY == null || slY == null) continue;

    // TP zone (green)
    if (toggles.showTakeProfit) {
      ctx.fillStyle = PATTERN_OVERLAY_COLORS.tpZone;
      ctx.fillRect(0, Math.min(entryY, tpY), canvasWidth, Math.abs(tpY - entryY));
    }

    // SL zone (red)
    if (toggles.showStopLoss) {
      ctx.fillStyle = PATTERN_OVERLAY_COLORS.slZone;
      ctx.fillRect(0, Math.min(entryY, slY), canvasWidth, Math.abs(slY - entryY));
    }
  }
}

// === ZIGZAG SEGMENT RENDERING ===

/** Deduplicate line data by time */
function dedupeLineData(data: FormationLineData[]): FormationLineData[] {
  const m = new Map<number, FormationLineData>();
  for (const d of data) m.set(d.time as number, d);
  return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

/**
 * Render zigzag polyline(s) on a chart, using segment-split styling when available.
 * For patterns with a segmentSplit, renders two LineSeries with different opacity/width.
 * For all other patterns, renders a single uniform cyan LineSeries.
 */
export function renderZigZagSeries(
  chart: IChartApi,
  formation: FormationOverlayData,
): void {
  const split = formation.segmentSplit;

  if (split && (split.emphasized.length >= 2 || split.normal.length >= 2)) {
    // Emphasized segments: higher opacity, thicker line
    if (split.emphasized.length >= 2) {
      const emphSeries = chart.addSeries(LineSeries, {
        color: 'rgba(0, 200, 255, 0.9)',
        lineWidth: 2,
        lineStyle: 0,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        autoscaleInfoProvider: () => null,
      });
      emphSeries.setData(dedupeLineData(split.emphasized));
    }
    // Normal segments: lower opacity, thinner line
    if (split.normal.length >= 2) {
      const normSeries = chart.addSeries(LineSeries, {
        color: 'rgba(0, 200, 255, 0.5)',
        lineWidth: 1,
        lineStyle: 0,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        autoscaleInfoProvider: () => null,
      });
      normSeries.setData(dedupeLineData(split.normal));
    }
  } else {
    // Default: single uniform zigzag
    const zigzagSeries = chart.addSeries(LineSeries, {
      color: PATTERN_OVERLAY_COLORS.zigzag,
      lineWidth: 2,
      lineStyle: 0,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
      autoscaleInfoProvider: () => null,
    });
    zigzagSeries.setData(dedupeLineData(formation.zigzag));
  }
}

// === NECKLINE RENDERING ===

/** Pattern families that support neckline rendering */
const NECKLINE_PATTERN_IDS = new Set([
  'double-bottom', 'double_bottom', 'doublebottom',
  'double-top', 'double_top', 'doubletop',
  'triple-bottom', 'triple_bottom', 'triplebottom',
  'triple-top', 'triple_top', 'tripletop',
  'head-and-shoulders', 'head_and_shoulders', 'headandshoulders', 'hs',
  'inverse-head-and-shoulders', 'inverse_head_and_shoulders', 'inverseheadandshoulders', 'ihs',
]);

function normalizePatternId(id: string): string {
  return id.toLowerCase().replace(/[\s_-]+/g, '');
}

function isNecklinePattern(patternId: string): boolean {
  const norm = normalizePatternId(patternId);
  for (const candidate of NECKLINE_PATTERN_IDS) {
    if (norm === normalizePatternId(candidate)) return true;
  }
  return false;
}

function isBottomPattern(patternId: string): boolean {
  const n = normalizePatternId(patternId);
  return n.includes('bottom') || n === 'ihs' || n.includes('inversehead');
}

function isAngledNecklinePattern(patternId: string): boolean {
  const n = normalizePatternId(patternId);
  return n.includes('head') && n.includes('shoulder');
}

/**
 * Compute neckline data from pivots for reversal patterns.
 * Returns either a single price (horizontal neckline) or two {time, price} points (angled).
 */
export function computeNeckline(
  pivots: ZigZagPivot[],
  patternId: string,
  chartBars: CompressedBar[],
): { type: 'horizontal'; price: number } | { type: 'angled'; points: Array<{ time: Time; price: number }> } | null {
  if (!pivots || pivots.length < 2 || !isNecklinePattern(patternId)) return null;

  const isBottom = isBottomPattern(patternId);
  const isAngled = isAngledNecklinePattern(patternId);

  // Build sorted timestamp lookup for snapping
  const chartBarTimes = chartBars.map(b => ({
    ts: Math.floor(new Date(b.t).getTime() / 1000),
    t: b.t,
  })).filter(x => Number.isFinite(x.ts)).sort((a, b) => a.ts - b.ts);

  const snapToChart = (pivotTs: string): Time | null => {
    const ts = Math.floor(new Date(pivotTs).getTime() / 1000);
    if (!Number.isFinite(ts) || chartBarTimes.length === 0) return null;
    let best = chartBarTimes[0];
    let bestDist = Math.abs(ts - best.ts);
    for (const entry of chartBarTimes) {
      const dist = Math.abs(ts - entry.ts);
      if (dist < bestDist) { bestDist = dist; best = entry; }
      if (entry.ts > ts && dist > bestDist) break;
    }
    return dateToTime(best.t);
  };

  if (isAngled) {
    // H&S / IH&S: neckline connects the troughs (or peaks) between the shoulders
    // For H&S (top pattern): connect lows between LS-H and H-RS
    // For IH&S (bottom pattern): connect highs between LS-H and H-RS
    const neckPivotType = isBottom ? 'high' : 'low';
    
    // Try role-based detection first
    const rolePivots = pivots.filter(p => {
      const role = (p.role || '').toUpperCase();
      return role === 'LS' || role === 'H' || role === 'RS';
    });
    
    let necklinePoints: Array<{ time: Time; price: number }> = [];
    
    if (rolePivots.length >= 3) {
      // Find intermediate pivots of opposite type between shoulders
      const lsIdx = pivots.findIndex(p => (p.role || '').toUpperCase() === 'LS');
      const hIdx = pivots.findIndex(p => (p.role || '').toUpperCase() === 'H');
      const rsIdx = pivots.findIndex(p => (p.role || '').toUpperCase() === 'RS');
      
      if (lsIdx >= 0 && hIdx >= 0 && rsIdx >= 0) {
        // Neckline point 1: between LS and H
        const between1 = pivots.slice(Math.min(lsIdx, hIdx) + 1, Math.max(lsIdx, hIdx))
          .filter(p => p.type === neckPivotType);
        // Neckline point 2: between H and RS
        const between2 = pivots.slice(Math.min(hIdx, rsIdx) + 1, Math.max(hIdx, rsIdx))
          .filter(p => p.type === neckPivotType);
        
        const np1 = between1[0];
        const np2 = between2[0];
        
        if (np1 && np2) {
          const t1 = snapToChart(np1.timestamp);
          const t2 = snapToChart(np2.timestamp);
          if (t1 && t2) {
            necklinePoints = [
              { time: t1, price: np1.price },
              { time: t2, price: np2.price },
            ];
          }
        }
      }
    }
    
    // Fallback: find the two intermediate pivots of the neckline type
    if (necklinePoints.length < 2) {
      const neckCandidates = pivots.filter(p => p.type === neckPivotType);
      if (neckCandidates.length >= 2) {
        // Use the two that are most likely between the structural peaks/troughs
        const sorted = [...neckCandidates].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        // Skip first and last if they're likely the shoulders themselves
        const candidates = sorted.length > 2 ? sorted.slice(0, 2) : sorted;
        const t1 = snapToChart(candidates[0].timestamp);
        const t2 = snapToChart(candidates[1].timestamp);
        if (t1 && t2) {
          necklinePoints = [
            { time: t1, price: candidates[0].price },
            { time: t2, price: candidates[1].price },
          ];
        }
      }
    }
    
    if (necklinePoints.length >= 2) {
      return { type: 'angled', points: necklinePoints };
    }
    return null;
  }

  // Horizontal neckline for Double/Triple Bottom/Top
  if (isBottom) {
    // Neckline = highest high between the lows
    const lowPivots = pivots.filter(p => p.type === 'low');
    if (lowPivots.length < 2) return null;
    const highPivots = pivots.filter(p => p.type === 'high');
    if (highPivots.length === 0) {
      // Fallback: use max price among all pivots that aren't lows
      return null;
    }
    // Find the intermediate highs (between the lows chronologically)
    const firstLowTs = new Date(lowPivots[0].timestamp).getTime();
    const lastLowTs = new Date(lowPivots[lowPivots.length - 1].timestamp).getTime();
    const intermHighs = highPivots.filter(p => {
      const t = new Date(p.timestamp).getTime();
      return t >= firstLowTs && t <= lastLowTs;
    });
    const candidates = intermHighs.length > 0 ? intermHighs : highPivots;
    const maxPrice = Math.max(...candidates.map(p => p.price));
    return { type: 'horizontal', price: maxPrice };
  } else {
    // Top patterns: neckline = lowest low between the highs
    const highPivots = pivots.filter(p => p.type === 'high');
    if (highPivots.length < 2) return null;
    const lowPivots = pivots.filter(p => p.type === 'low');
    if (lowPivots.length === 0) return null;
    const firstHighTs = new Date(highPivots[0].timestamp).getTime();
    const lastHighTs = new Date(highPivots[highPivots.length - 1].timestamp).getTime();
    const intermLows = lowPivots.filter(p => {
      const t = new Date(p.timestamp).getTime();
      return t >= firstHighTs && t <= lastHighTs;
    });
    const candidates = intermLows.length > 0 ? intermLows : lowPivots;
    const minPrice = Math.min(...candidates.map(p => p.price));
    return { type: 'horizontal', price: minPrice };
  }
}

/**
 * Render a neckline on the chart for reversal patterns.
 * For horizontal necklines, uses a price line on the candle series.
 * For angled necklines (H&S), uses a LineSeries segment.
 * Returns a cleanup function.
 */
export function renderNeckline(
  chart: IChartApi,
  candleSeries: ReturnType<IChartApi['addSeries']>,
  pivots: ZigZagPivot[] | undefined,
  patternId: string | undefined,
  chartBars: CompressedBar[],
): (() => void) {
  if (!pivots || !patternId || pivots.length < 2) return () => {};
  
  const neckline = computeNeckline(pivots, patternId, chartBars);
  if (!neckline) return () => {};

  if (neckline.type === 'horizontal') {
    const line = candleSeries.createPriceLine({
      price: neckline.price,
      color: PATTERN_OVERLAY_COLORS.neckline,
      lineWidth: 1,
      lineStyle: 0, // solid
      axisLabelVisible: true,
      title: 'Neckline',
    });
    return () => {
      try { candleSeries.removePriceLine(line); } catch {}
    };
  }

  // Angled neckline via LineSeries
  const necklineSeries = chart.addSeries(LineSeries, {
    color: PATTERN_OVERLAY_COLORS.neckline,
    lineWidth: 1,
    lineStyle: 0,
    priceLineVisible: false,
    lastValueVisible: false,
    crosshairMarkerVisible: false,
    autoscaleInfoProvider: () => null,
  });

  const sortedPoints = [...neckline.points].sort(
    (a, b) => (a.time as number) - (b.time as number)
  );
  necklineSeries.setData(sortedPoints.map(p => ({ time: p.time, value: p.price })));

  // Add a label marker at the midpoint
  if (sortedPoints.length >= 2) {
    try {
      createSeriesMarkers(necklineSeries, [{
        time: sortedPoints[0].time,
        position: 'aboveBar' as const,
        color: PATTERN_OVERLAY_COLORS.neckline,
        shape: 'circle' as SeriesMarkerShape,
        text: 'Neckline',
      }]);
    } catch {}
  }

  return () => {
    try { chart.removeSeries(necklineSeries); } catch {}
  };
}
