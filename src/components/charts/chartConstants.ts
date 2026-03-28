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
    grid: 'rgba(255,255,255,0.06)',
  },
  light: {
    background: '#ffffff',
    text: '#666666',
    grid: 'rgba(0,0,0,0.06)',
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
  upHighlight: 'rgba(34, 197, 94, 1.0)',
  downHighlight: 'rgba(239, 68, 68, 1.0)',
  default: '#6b7280',
} as const;

// Volume histogram position (as ratio of chart height)
export const VOLUME_SCALE_MARGINS = {
  // For full-size charts (StudyChart, FullChartViewer)
  standard: { top: 0.8, bottom: 0 },
  // For compact charts (ThumbnailChart)
  compact: { top: 0.85, bottom: 0 },
} as const;

// === PRICE SCALE MARGINS ===
// Rule-based system for dynamic price scaling to prevent flat-looking charts
// Smaller margins = more vertical space for price action = more dynamic appearance
export const PRICE_SCALE_MARGINS = {
  // Ultra-tight for maximum price sensitivity (thumbnails, pattern cards)
  thumbnail: { top: 0.02, bottom: 0.02 },
  // Tight for study/detail charts 
  standard: { top: 0.05, bottom: 0.05 },
  // With room for overlays (Entry/SL/TP lines)
  withOverlays: { top: 0.08, bottom: 0.08 },
} as const;

/**
 * Calculate optimal price scale margins to ensure candles fill at least ~70%
 * of the chart's vertical space, with the median price centered.
 * 
 * lightweight-charts' scaleMargins define the fraction of chart height reserved
 * as empty padding at top/bottom. By keeping these small and symmetric, the
 * price action is centered and uses most of the available space.
 * 
 * Target: price range occupies ≥70% of chart height → max 15% padding each side.
 * For overlays (Entry/SL/TP lines) we allow slightly more room.
 */
export function calculateOptimalPriceMargins(
  bars: { h: number; l: number }[],
  hasOverlays: boolean = false
): { top: number; bottom: number } {
  if (!bars || bars.length === 0) {
    return hasOverlays ? PRICE_SCALE_MARGINS.withOverlays : PRICE_SCALE_MARGINS.standard;
  }

  // Find price range
  const highs = bars.map(b => b.h).filter(Number.isFinite);
  const lows = bars.map(b => b.l).filter(Number.isFinite);
  
  if (highs.length === 0 || lows.length === 0) {
    return PRICE_SCALE_MARGINS.standard;
  }

  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);
  const midPrice = (maxHigh + minLow) / 2;
  
  // Calculate volatility as percentage of price range
  const priceRange = maxHigh - minLow;
  const volatilityPercent = midPrice > 0 ? (priceRange / midPrice) * 100 : 0;

  // We want the candle range to fill ~70-85% of chart height.
  // scaleMargins top+bottom = fraction of height NOT used by price.
  // So we target total padding of 15-30% (each side 7.5-15%).
  //
  // For low volatility data we use the tightest margins so small moves
  // are visually amplified. For higher volatility we can be slightly looser
  // to avoid clipping wicks during live updates.

  let margin: number;
  if (volatilityPercent < 1) {
    // Ultra-low volatility – maximize visual impact
    margin = 0.02;
  } else if (volatilityPercent < 3) {
    // Low volatility – tight
    margin = 0.04;
  } else if (volatilityPercent < 8) {
    // Normal range – balanced (price fills ~86% of height)
    margin = 0.07;
  } else if (volatilityPercent < 20) {
    // Higher volatility – a touch more breathing room
    margin = 0.10;
  } else {
    // Very high volatility – still keep it reasonable
    margin = 0.12;
  }

  // Overlays need extra room for SL/TP labels outside the candle range
  if (hasOverlays) {
    const topMargin = Math.max(Math.min(margin + 0.04, 0.15), 0.08);
    // Extra bottom margin to prevent ENTRY/TP labels and lowest lows from clipping
    const bottomMargin = Math.max(Math.min(margin + 0.08, 0.20), 0.12);
    return { top: topMargin, bottom: bottomMargin };
  }

  // Keep a small minimum breathing room so high/low wicks are always visible.
  const baseMargin = Math.max(margin, 0.05);
  return { top: baseMargin, bottom: baseMargin };
}

/**
 * Calculate appropriate price precision (decimal places) based on price magnitude.
 * Essential for micro-cap assets like BONK, SHIB, PEPE that trade at fractions of a cent.
 * 
 * Rules:
 * - Price >= 1000: 2 decimals (BTC, SPY)
 * - Price >= 1: 2-4 decimals (ETH, most stocks)
 * - Price >= 0.01: 4 decimals (small cap stocks)
 * - Price >= 0.0001: 6 decimals (low-cap crypto)
 * - Price < 0.0001: 8 decimals (micro-cap meme coins like BONK, SHIB)
 */
export function calculatePricePrecision(price: number): { precision: number; minMove: number } {
  const absPrice = Math.abs(price);
  
  if (absPrice >= 1000) {
    return { precision: 2, minMove: 0.01 };
  } else if (absPrice >= 100) {
    return { precision: 2, minMove: 0.01 };
  } else if (absPrice >= 1) {
    return { precision: 4, minMove: 0.0001 };
  } else if (absPrice >= 0.01) {
    return { precision: 4, minMove: 0.0001 };
  } else if (absPrice >= 0.0001) {
    return { precision: 6, minMove: 0.000001 };
  } else if (absPrice >= 0.00000001) {
    return { precision: 8, minMove: 0.00000001 };
  } else {
    // Ultra-micro prices
    return { precision: 10, minMove: 0.0000000001 };
  }
}

// === INDICATOR COLORS ===
// Using rgba for semi-transparency so indicators don't fully obscure candle wicks
export const INDICATOR_COLORS = {
  ema20: 'rgba(249, 115, 22, 0.8)',    // Orange
  ema50: 'rgba(59, 130, 246, 0.8)',    // Blue  
  ema200: 'rgba(139, 92, 246, 0.8)',   // Purple
  bollingerBands: 'rgba(156, 163, 175, 0.4)', // Gray translucent
  vwap: 'rgba(6, 182, 212, 0.8)',      // Cyan
  rsi: 'rgba(234, 179, 8, 0.8)',       // Yellow
  macdLine: 'rgba(59, 130, 246, 0.8)', // Blue
  macdSignal: 'rgba(249, 115, 22, 0.8)', // Orange
  macdHistogramUp: 'rgba(34, 197, 94, 0.5)',  // Green
  macdHistogramDown: 'rgba(239, 68, 68, 0.5)', // Red
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
export function getVolumeColor(isUp: boolean, highlighted?: boolean): string {
  if (highlighted) return isUp ? VOLUME_COLORS.upHighlight : VOLUME_COLORS.downHighlight;
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
