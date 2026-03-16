/**
 * Constants for the programmatic SEO pattern statistics pages.
 * 425+ unique pages: 15 patterns × 5 asset classes × 5+ timeframes
 */

export const STAT_PATTERNS = [
  'bull-flag', 'bear-flag', 'ascending-triangle', 'descending-triangle',
  'head-and-shoulders', 'inverse-head-and-shoulders',
  'double-top', 'double-bottom', 'triple-top', 'triple-bottom',
  'cup-and-handle', 'rising-wedge', 'falling-wedge',
  'donchian-breakout-long', 'donchian-breakout-short',
] as const;

export const STAT_ASSET_CLASSES = ['forex', 'crypto', 'stocks', 'commodities', 'indices'] as const;
export const STAT_TIMEFRAMES = ['1h', '4h', '8h', '1d', '1wk'] as const;

export type StatPattern = typeof STAT_PATTERNS[number];
export type StatAssetClass = typeof STAT_ASSET_CLASSES[number];
export type StatTimeframe = typeof STAT_TIMEFRAMES[number];

/** Map URL slug → DB asset_type value */
export const ASSET_CLASS_TO_DB: Record<string, string> = {
  forex: 'fx',
  crypto: 'crypto',
  stocks: 'stock',
  commodities: 'commodity',
  indices: 'index',
};

export const DB_TO_ASSET_CLASS: Record<string, string> = Object.fromEntries(
  Object.entries(ASSET_CLASS_TO_DB).map(([k, v]) => [v, k])
);

export const ASSET_CLASS_LABELS: Record<string, string> = {
  forex: 'Forex',
  crypto: 'Crypto',
  stocks: 'Stocks',
  commodities: 'Commodities',
  indices: 'Indices',
};

export const TIMEFRAME_LABELS: Record<string, string> = {
  '1h': '1 Hour',
  '4h': '4 Hour',
  '8h': '8 Hour',
  '1d': 'Daily',
  '1wk': 'Weekly',
};

export const PATTERN_NAMES: Record<string, string> = {
  'bull-flag': 'Bull Flag',
  'bear-flag': 'Bear Flag',
  'ascending-triangle': 'Ascending Triangle',
  'descending-triangle': 'Descending Triangle',
  'head-and-shoulders': 'Head & Shoulders',
  'inverse-head-and-shoulders': 'Inverse Head & Shoulders',
  'double-top': 'Double Top',
  'double-bottom': 'Double Bottom',
  'triple-top': 'Triple Top',
  'triple-bottom': 'Triple Bottom',
  'cup-and-handle': 'Cup & Handle',
  'rising-wedge': 'Rising Wedge',
  'falling-wedge': 'Falling Wedge',
  'donchian-breakout-long': 'Donchian Breakout (Long)',
  'donchian-breakout-short': 'Donchian Breakout (Short)',
};

export const PATTERN_DESCRIPTIONS: Record<string, string> = {
  'bull-flag': 'A Bull Flag forms when price makes a sharp vertical move upward (the pole), followed by a brief, orderly consolidation in a downward-sloping channel (the flag). The consolidation represents demand resting while supply is absorbed. When price breaks above the flag, it signals that demand has resumed and the original move is likely to continue. The Bull Flag is one of the most reliable continuation patterns in technical analysis.',
  'bear-flag': 'A Bear Flag is the mirror image of a Bull Flag. Price drops sharply (the pole), then consolidates in an upward-sloping channel (the flag). This brief retracement represents sellers pausing while weak buyers step in. When price breaks below the flag, it confirms sellers have regained control and the downtrend is set to resume.',
  'ascending-triangle': 'An Ascending Triangle features a flat resistance level and a series of rising lows forming an upward-sloping support line. Each successive low is higher, showing buyers are willing to pay more. When price finally breaks above the flat resistance, the accumulated buying pressure often produces a strong upward move.',
  'descending-triangle': 'A Descending Triangle is characterised by a flat support level and declining highs forming a downward-sloping resistance line. Each bounce off support is weaker, indicating sellers are gradually overwhelming buyers. The pattern typically resolves with a breakdown below support.',
  'head-and-shoulders': 'The Head and Shoulders is a classic reversal pattern consisting of three peaks. The middle peak (head) is the highest, flanked by two lower peaks (shoulders). A neckline connects the two troughs between the peaks. When price breaks below the neckline, it signals a bearish reversal with a measured target equal to the distance from the head to the neckline.',
  'inverse-head-and-shoulders': 'The Inverse Head and Shoulders is a bullish reversal pattern that mirrors the classic H&S. Three troughs form with the middle (head) being the deepest. When price breaks above the neckline connecting the peaks between the troughs, it signals a bullish reversal with strong upside potential.',
  'double-top': 'A Double Top forms when price reaches a resistance level twice and fails to break through, creating an "M" shape. The two peaks at roughly the same level indicate strong selling pressure at that price. A break below the support between the two peaks confirms the bearish reversal.',
  'double-bottom': 'A Double Bottom is a bullish reversal pattern that forms after a downtrend when price tests a support level twice and bounces, creating a "W" shape. The two equal lows indicate strong buying support, and a break above the peak between the bottoms confirms the reversal.',
  'triple-top': 'A Triple Top is a bearish reversal pattern where price tests a resistance level three times, each time failing to break through. Three roughly equal peaks signal strong selling pressure and exhaustion of buying momentum. A break below the support level confirms the pattern.',
  'triple-bottom': 'A Triple Bottom is a bullish reversal pattern with three roughly equal lows, indicating strong demand at that price level. Each bounce off support confirms buyers are defending the level. A break above the resistance connecting the intervening highs triggers the bullish reversal.',
  'cup-and-handle': 'The Cup and Handle is a bullish continuation pattern resembling a teacup in profile. The cup is a rounded bottom formed as selling pressure gradually gives way to buying pressure. The handle is a brief pullback before the final breakout. This pattern often precedes strong upward moves.',
  'rising-wedge': 'A Rising Wedge forms when price moves within two converging, upward-sloping trendlines. Both highs and lows are rising, but the range is narrowing. This typically signals weakening momentum, and the pattern usually breaks down through the lower trendline.',
  'falling-wedge': 'A Falling Wedge features two converging, downward-sloping trendlines. Both highs and lows are declining, but the range is tightening. This bullish pattern indicates sellers are losing momentum, and the breakout usually occurs to the upside.',
  'donchian-breakout-long': 'A Donchian Breakout (Long) occurs when price breaks above the highest high of the previous N periods (the Donchian Channel upper band). This momentum-based signal captures trend initiation and is the foundation of many systematic trend-following strategies.',
  'donchian-breakout-short': 'A Donchian Breakout (Short) triggers when price breaks below the lowest low of the previous N periods (the Donchian Channel lower band). This signals bearish momentum and potential trend initiation to the downside.',
};

/** SVG path data for pattern diagrams — viewBox="0 0 200 100" */
export const PATTERN_SVG_PATHS: Record<string, string> = {
  'bull-flag': 'M 20 80 L 50 20 L 60 35 L 80 25 L 90 40 L 110 30 L 120 20 L 180 20',
  'bear-flag': 'M 20 20 L 50 80 L 60 65 L 80 75 L 90 60 L 110 70 L 120 80 L 180 80',
  'ascending-triangle': 'M 20 80 L 50 30 L 70 60 L 100 30 L 120 50 L 150 30 L 170 30 L 180 15',
  'descending-triangle': 'M 20 20 L 50 70 L 70 40 L 100 70 L 120 50 L 150 70 L 170 70 L 180 85',
  'head-and-shoulders': 'M 15 70 L 40 40 L 55 65 L 80 15 L 105 65 L 130 40 L 145 70 L 180 85',
  'inverse-head-and-shoulders': 'M 15 30 L 40 60 L 55 35 L 80 85 L 105 35 L 130 60 L 145 30 L 180 15',
  'double-top': 'M 20 80 L 50 20 L 80 55 L 110 20 L 140 55 L 180 80',
  'double-bottom': 'M 20 20 L 50 80 L 80 45 L 110 80 L 140 45 L 180 20',
  'triple-top': 'M 15 80 L 35 20 L 55 55 L 75 20 L 95 55 L 115 20 L 135 55 L 180 80',
  'triple-bottom': 'M 15 20 L 35 80 L 55 45 L 75 80 L 95 45 L 115 80 L 135 45 L 180 20',
  'cup-and-handle': 'M 15 25 L 30 40 L 50 65 L 80 75 L 110 65 L 130 40 L 145 25 L 155 35 L 165 25 L 180 10',
  'rising-wedge': 'M 20 80 L 60 50 L 80 65 L 120 30 L 140 50 L 170 20 L 180 60',
  'falling-wedge': 'M 20 20 L 60 50 L 80 35 L 120 70 L 140 50 L 170 80 L 180 40',
  'donchian-breakout-long': 'M 20 50 L 40 45 L 60 55 L 80 50 L 100 45 L 110 50 L 120 30 L 140 25 L 160 20 L 180 15',
  'donchian-breakout-short': 'M 20 50 L 40 55 L 60 45 L 80 50 L 100 55 L 110 50 L 120 70 L 140 75 L 160 80 L 180 85',
};

/** Trading guidance per pattern */
export const PATTERN_TRADING_GUIDE: Record<string, { entry: string; stopLoss: string; takeProfit: string }> = {
  'bull-flag': {
    entry: 'Enter on confirmed breakout above the upper flag channel boundary. Wait for a candle close above the level to avoid false breaks.',
    stopLoss: 'Place stop loss below the lowest point of the flag consolidation.',
    takeProfit: 'Target the measured move: project the pole height from the breakout point upward.',
  },
  'bear-flag': {
    entry: 'Enter on confirmed breakdown below the lower flag channel boundary. Wait for a candle close below the level.',
    stopLoss: 'Place stop loss above the highest point of the flag consolidation.',
    takeProfit: 'Target the measured move: project the pole height from the breakdown point downward.',
  },
  'ascending-triangle': {
    entry: 'Enter on confirmed breakout above the flat resistance line. Volume increase on breakout adds confidence.',
    stopLoss: 'Place stop loss below the most recent swing low or the ascending trendline.',
    takeProfit: 'Target the measured move: the height of the triangle projected from the breakout point.',
  },
  'descending-triangle': {
    entry: 'Enter on confirmed breakdown below the flat support line.',
    stopLoss: 'Place stop loss above the most recent swing high or the descending trendline.',
    takeProfit: 'Target the measured move: the height of the triangle projected from the breakdown point.',
  },
  'head-and-shoulders': {
    entry: 'Enter on confirmed break below the neckline connecting the troughs between the shoulders and head.',
    stopLoss: 'Place stop loss above the right shoulder.',
    takeProfit: 'Target the measured move: the distance from the head to the neckline, projected downward from the breakout.',
  },
  'inverse-head-and-shoulders': {
    entry: 'Enter on confirmed break above the neckline.',
    stopLoss: 'Place stop loss below the right shoulder (the last trough before breakout).',
    takeProfit: 'Target the measured move: the distance from the head to the neckline, projected upward.',
  },
  'double-top': {
    entry: 'Enter on confirmed break below the support between the two peaks.',
    stopLoss: 'Place stop loss above the highest peak.',
    takeProfit: 'Target the measured move: the height from the peaks to the support, projected downward.',
  },
  'double-bottom': {
    entry: 'Enter on confirmed break above the resistance between the two troughs.',
    stopLoss: 'Place stop loss below the lowest trough.',
    takeProfit: 'Target the measured move: the height from the troughs to the resistance, projected upward.',
  },
  'triple-top': {
    entry: 'Enter on confirmed break below the support connecting the troughs between the three peaks.',
    stopLoss: 'Place stop loss above the highest peak.',
    takeProfit: 'Target the measured move: the height of the pattern projected downward from the breakout.',
  },
  'triple-bottom': {
    entry: 'Enter on confirmed break above the resistance connecting the peaks between the three troughs.',
    stopLoss: 'Place stop loss below the lowest trough.',
    takeProfit: 'Target the measured move: the height of the pattern projected upward from the breakout.',
  },
  'cup-and-handle': {
    entry: 'Enter on confirmed breakout above the handle resistance (the lip of the cup).',
    stopLoss: 'Place stop loss below the handle low.',
    takeProfit: 'Target the measured move: the depth of the cup projected upward from the breakout.',
  },
  'rising-wedge': {
    entry: 'Enter on confirmed breakdown below the lower trendline of the wedge.',
    stopLoss: 'Place stop loss above the most recent swing high within the wedge.',
    takeProfit: 'Target the base of the wedge (the vertical distance at the widest point) projected downward.',
  },
  'falling-wedge': {
    entry: 'Enter on confirmed breakout above the upper trendline of the wedge.',
    stopLoss: 'Place stop loss below the most recent swing low within the wedge.',
    takeProfit: 'Target the base of the wedge projected upward from the breakout.',
  },
  'donchian-breakout-long': {
    entry: 'Enter when price closes above the Donchian Channel upper band (highest high of N periods).',
    stopLoss: 'Place stop loss at the Donchian Channel lower band or the recent swing low.',
    takeProfit: 'Use a trailing stop based on the Donchian Channel lower band, or target a fixed R:R ratio.',
  },
  'donchian-breakout-short': {
    entry: 'Enter when price closes below the Donchian Channel lower band (lowest low of N periods).',
    stopLoss: 'Place stop loss at the Donchian Channel upper band or the recent swing high.',
    takeProfit: 'Use a trailing stop based on the Donchian Channel upper band, or target a fixed R:R ratio.',
  },
};

/** Bars-per-year for annualized calculations */
export const BARS_PER_YEAR: Record<string, number> = {
  '1h': 6048,
  '4h': 1512,
  '8h': 756,
  '1d': 252,
  '1wk': 52,
};
