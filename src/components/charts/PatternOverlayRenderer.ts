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
import { deriveFormationOverlay, FormationOverlayData } from '@/utils/formationOverlay';

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
