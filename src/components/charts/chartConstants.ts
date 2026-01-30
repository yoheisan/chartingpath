/**
 * Unified Chart Constants
 * 
 * Single source of truth for all lightweight-charts styling across the platform.
 * Ensures visual consistency between StudyChart, ThumbnailChart, and FullChartViewer.
 */

// === THEME COLORS ===
export const CHART_THEME = {
  dark: {
    background: '#0f0f0f',
    text: '#a1a1a1',
    grid: 'rgba(255,255,255,0.05)',
  },
  light: {
    background: '#ffffff',
    text: '#666666',
    grid: 'rgba(0,0,0,0.05)',
  },
} as const;

// === CANDLESTICK COLORS ===
// All colors MUST match for consistent appearance (body, border, wick)
// borderVisible: false ensures clean solid candles without stroke artifacts
export const CANDLE_COLORS = {
  // Body colors
  upColor: '#22c55e',
  downColor: '#ef4444',
  // Border colors (match body for solid appearance)
  borderUpColor: '#22c55e',
  borderDownColor: '#ef4444',
  // Wick colors (match body for consistency)
  wickUpColor: '#22c55e',
  wickDownColor: '#ef4444',
  // Disable borders to avoid stroke artifacts
  borderVisible: false,
} as const;

// === VOLUME HISTOGRAM ===
export const VOLUME_COLORS = {
  up: 'rgba(34, 197, 94, 0.4)',
  down: 'rgba(239, 68, 68, 0.4)',
  default: '#6b7280',
} as const;

// Volume histogram position (as ratio of chart height)
export const VOLUME_SCALE_MARGINS = {
  // For full-size charts (StudyChart, FullChartViewer)
  standard: { top: 0.8, bottom: 0 },
  // For compact charts (ThumbnailChart)
  compact: { top: 0.85, bottom: 0 },
} as const;

// === INDICATOR COLORS ===
// Using rgba for semi-transparency so indicators don't fully obscure candle wicks
export const INDICATOR_COLORS = {
  ema20: 'rgba(249, 115, 22, 0.8)',    // Orange
  ema50: 'rgba(59, 130, 246, 0.8)',    // Blue  
  sma200: 'rgba(139, 92, 246, 0.8)',   // Purple
  bollingerBands: 'rgba(156, 163, 175, 0.4)', // Gray translucent
  vwap: 'rgba(6, 182, 212, 0.8)',      // Cyan
} as const;

// === OVERLAY/PRICE LINE COLORS ===
export const OVERLAY_COLORS = {
  primary: '#3b82f6',    // Entry
  destructive: '#ef4444', // Stop Loss
  positive: '#22c55e',    // Take Profit
  default: '#888888',
} as const;

// === PIVOT MARKER COLORS ===
export const PIVOT_COLORS = {
  high: '#f97316', // Orange
  low: '#8b5cf6',  // Purple
} as const;

/**
 * Get theme colors based on current document theme
 */
export function getThemeColors() {
  const isDark = typeof document !== 'undefined' 
    ? document.documentElement.classList.contains('dark') 
    : true;
  return isDark ? CHART_THEME.dark : CHART_THEME.light;
}

/**
 * Get volume bar color based on candle direction
 */
export function getVolumeColor(isUp: boolean): string {
  return isUp ? VOLUME_COLORS.up : VOLUME_COLORS.down;
}

/**
 * Get overlay color from style string
 */
export function getOverlayColor(style?: string): string {
  switch (style) {
    case 'primary': return OVERLAY_COLORS.primary;
    case 'destructive': return OVERLAY_COLORS.destructive;
    case 'positive': return OVERLAY_COLORS.positive;
    default: return OVERLAY_COLORS.default;
  }
}

/**
 * Normalize OHLC bars so that open = previous bar's close.
 * This ensures consistent candle coloring based on day-to-day price movement:
 * - Green: close > previous close (price went UP)
 * - Red: close < previous close (price went DOWN)
 * 
 * Without this, raw OHLC data uses intraday opens which can show green candles
 * during a downtrend if the day closed above its open (but below prior close).
 */
export interface NormalizedBar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export function normalizeBarsForConsistentColoring<T extends { t: string; o: number; h: number; l: number; c: number; v: number }>(
  bars: T[]
): T[] {
  if (!bars || bars.length === 0) return bars;

  // Sort chronologically first to ensure correct prev-close logic
  const sorted = [...bars].sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());

  const result: T[] = [];
  let prevClose: number | null = null;

  for (const bar of sorted) {
    // Use previous bar's close as this bar's open for day-to-day coloring
    // For first bar, use a tiny offset below close to show as green (neutral)
    const eps = Math.max(Math.abs(bar.c) * 1e-6, 1e-6);
    const normalizedOpen = prevClose !== null ? prevClose : bar.c - eps;

    result.push({
      ...bar,
      o: normalizedOpen,
      h: Math.max(bar.h, normalizedOpen, bar.c),
      l: Math.min(bar.l, normalizedOpen, bar.c),
    });

    prevClose = bar.c;
  }

  return result;
}
