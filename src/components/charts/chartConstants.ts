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
// Border colors MUST match body colors to ensure solid filled appearance
export const CANDLE_COLORS = {
  upColor: '#22c55e',
  downColor: '#ef4444',
  borderUpColor: '#22c55e',
  borderDownColor: '#ef4444',
  wickUpColor: '#22c55e',
  wickDownColor: '#ef4444',
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
export const INDICATOR_COLORS = {
  ema20: '#f97316',    // Orange
  ema50: '#3b82f6',    // Blue  
  sma200: '#8b5cf6',   // Purple
  bollingerBands: 'rgba(156, 163, 175, 0.5)', // Gray translucent
  vwap: '#06b6d4',     // Cyan
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
