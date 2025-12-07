/**
 * Professional Trading Rules for Chart Patterns
 * Based on institutional trading methodologies and best practices
 */

export interface PatternRules {
  entry: string;
  stopLoss: string;
  target: string;
}

export interface PositionManagementRules {
  maxSimultaneousTrades: number;
  maxRiskPerTrade: number;
  maxTotalRisk: number;
  maxAccountDrawdown: number; // Circuit breaker - stops ALL trading when reached
  patternPriority: Record<string, number>; // Higher number = higher priority
  conflictResolution: 'first-formed' | 'higher-priority' | 'higher-quality';
}

/**
 * Professional entry, stop loss, and target rules for each chart pattern
 * Based on:
 * - Breakout confirmation with volume
 * - Price action validation
 * - Risk-reward optimization
 * - Pattern-specific nuances
 */
export const PROFESSIONAL_PATTERN_RULES: Record<string, PatternRules> = {
  'head-shoulders': {
    entry: `PRIMARY ENTRY: Break below neckline with:
• Volume 1.5x average on breakout candle
• Close below neckline (not just wick)
• Retest entry: Price retests neckline from below, rejects, and closes lower

CONFIRMATION REQUIRED:
• Previous uptrend must be established (min 2 higher highs)
• Right shoulder lower than left shoulder (volume divergence)
• Pattern duration 4+ weeks for daily charts

DO NOT ENTER IF:
• False breakdown (closes back above neckline within 2 candles)
• Low volume on break (<0.8x average)
• Market in choppy/sideways consolidation`,

    stopLoss: `STOP LOSS PLACEMENT:
• Conservative: 2-3% above right shoulder high
• Aggressive: Above neckline + 1 ATR
• Scale out approach: Move to breakeven after 50% of target reached

POSITION SIZING:
• Risk 1-2% of account per trade
• If stop is >5% away, reduce position size proportionally

INVALIDATION: Pattern fails if price closes above right shoulder high`,

    target: `TARGET METHODOLOGY:
PRIMARY: Measured Move = Neckline - (Head high - Neckline)
• Target 1 (70% position): 61.8% of measured move
• Target 2 (20% position): 100% measured move  
• Target 3 (10% position): 161.8% extension

DYNAMIC TARGETS:
• Exit 50% at 1:1 risk-reward, move stop to breakeven
• Trail remaining with 20-day MA or previous support
• Full exit if price reclaims neckline

PROBABILITY: 65-70% success rate for full measured move
TIME HORIZON: Typically 2-8 weeks to reach targets`
  },

  'inverted-head-shoulders': {
    entry: `PRIMARY ENTRY: Break above neckline with:
• Volume 1.5x average on breakout candle
• Close above neckline (not just wick)
• Retest entry: Price retests neckline from above, holds, and closes higher

CONFIRMATION REQUIRED:
• Previous downtrend must be established
• Right shoulder higher than left shoulder (volume increasing)
• Pattern duration 4+ weeks for daily charts

DO NOT ENTER IF:
• False breakout (closes back below neckline within 2 candles)
• Low volume on break (<0.8x average)`,

    stopLoss: `STOP LOSS PLACEMENT:
• Conservative: 2-3% below right shoulder low
• Aggressive: Below neckline - 1 ATR

INVALIDATION: Pattern fails if price closes below right shoulder low`,

    target: `TARGET METHODOLOGY:
PRIMARY: Measured Move = Neckline + (Neckline - Head low)
• Target 1 (70%): 61.8% of measured move
• Target 2 (20%): 100% measured move
• Target 3 (10%): 161.8% extension

Exit 50% at 1:1 R:R, trail remainder with 20-day MA`
  },

  'double-top': {
    entry: `PRIMARY ENTRY: Break below support level between peaks with:
• Volume confirmation (1.3x average)
• Two clear peaks at similar levels (within 3-5%)
• Time between peaks: minimum 2-4 weeks

CONFIRMATION:
• Second peak forms on lower volume than first
• Clear support level tested at least twice
• Break below support with decisive candle

DO NOT ENTER IF:
• Peaks differ by >5%
• Support level not clearly defined
• Timeframe too short (<2 weeks between peaks)`,

    stopLoss: `STOP LOSS PLACEMENT:
• Above second peak high + 2%
• Or above resistance + 1 ATR

POSITION SIZING:
• If stop >4%, reduce size to maintain 1-2% account risk

INVALIDATION: New high above second peak`,

    target: `TARGET METHODOLOGY:
Measured Move = Support - (Peak high - Support)
• Target 1 (60%): 61.8% of pattern height
• Target 2 (30%): 100% measured move
• Target 3 (10%): 161.8% extension

Exit 50% at 1:1.5 R:R, trail with previous support levels
Success rate: 60-65% for measured move`
  },

  'double-bottom': {
    entry: `PRIMARY ENTRY: Break above resistance level between troughs with:
• Volume 1.3x average on breakout
• Two clear troughs at similar levels (within 3-5%)
• Time between troughs: minimum 2-4 weeks

CONFIRMATION:
• Second trough forms on lower volume
• Clear resistance tested at least twice
• Break above resistance with momentum

DO NOT ENTER IF:
• Troughs differ by >5%
• Weak volume on breakout`,

    stopLoss: `STOP LOSS PLACEMENT:
• Below second trough low - 2%
• Or below support - 1 ATR

INVALIDATION: New low below second trough`,

    target: `TARGET METHODOLOGY:
Measured Move = Resistance + (Resistance - Trough low)
• Target 1 (60%): 61.8% of pattern height
• Target 2 (30%): 100% measured move  
• Target 3 (10%): 161.8% extension

Exit 50% at 1:1.5 R:R, trail remainder`
  },

  'ascending-triangle': {
    entry: `PRIMARY ENTRY: Breakout above horizontal resistance with:
• Volume 1.5x average (critical for continuation)
• Minimum 2 touches of resistance, 2 rising lows
• Volatility contraction into breakout (tightening range)

PULLBACK ENTRY:
• Wait for retest of broken resistance (now support)
• Enter on bullish rejection candle with volume

CONFIRMATION:
• Prior uptrend or strong momentum
• Each low higher than previous
• Pattern duration 3-8 weeks

DO NOT ENTER:
• Breakdown below rising trendline (pattern failed)
• Volume declining through pattern
• More than 5% above breakout (chase risk)`,

    stopLoss: `STOP LOSS PLACEMENT:
• Below most recent higher low
• Or below breakout level + 1-2%
• Tighten to breakeven after 1:1 R:R

PATTERN FAILURE:
• Close below rising support trendline
• Exit immediately`,

    target: `TARGET METHODOLOGY:
Measured Move = Resistance + Pattern Height
• Height = Resistance - First low in pattern
• Target 1 (50%): Pattern height
• Target 2 (30%): 1.618x pattern height
• Target 3 (20%): Next major resistance

PROBABILITY: 72-75% success (bullish continuation)
Trail with rising 20-period EMA after Target 1`
  },

  'descending-triangle': {
    entry: `PRIMARY ENTRY: Breakdown below horizontal support with:
• Volume 1.5x average on breakdown
• Minimum 2 touches of support, 2 lower highs
• Volatility contraction before break

PULLBACK ENTRY:
• Retest of broken support (now resistance)
• Enter on bearish rejection with volume

DO NOT ENTER:
• Breakout above descending resistance (pattern invalidated)
• Low volume breakdown
• Late entry >5% below support`,

    stopLoss: `STOP LOSS PLACEMENT:
• Above most recent lower high
• Or above breakdown level + 1-2%

PATTERN FAILURE:
• Close above descending trendline`,

    target: `TARGET METHODOLOGY:
Measured Move = Support - Pattern Height
• Target 1 (50%): Full pattern height
• Target 2 (30%): 1.618x height
• Target 3 (20%): Next major support

PROBABILITY: 72-75% success (bearish continuation)`
  },

  'cup-handle': {
    entry: `PRIMARY ENTRY: Breakout above handle high with:
• Volume 2x average (cup patterns need strong volume)
• Cup depth: 12-15% typical, max 30-50%
• Handle: 1-4 weeks, pullback 10-15% from cup high
• Handle on declining volume (profit taking)

CONSERVATIVE ENTRY:
• Wait for handle to form completely
• Enter on break of handle resistance + volume

CONFIRMATION:
• Prior uptrend before cup
• Rounded cup bottom (U-shape, not V)
• Handle forms in upper 1/3 of cup
• Clear resistance at cup rim

DO NOT ENTER IF:
• Handle drops >50% of cup depth
• Cup depth >50% (too deep, may fail)
• Breakout on low volume
• No clear handle (just cup = incomplete)`,

    stopLoss: `STOP LOSS PLACEMENT:
• Below handle low
• Or 7-8% below breakout price (William O'Neil rule)
• Move to breakeven after +3-5% gain

POSITION SIZING:
• Growth stock pattern - consider smaller size
• Stop can be 8-12% typically`,

    target: `TARGET METHODOLOGY:
Measured Move = Breakout + Cup Depth
• Target 1 (40%): 50% of cup depth
• Target 2 (40%): 100% cup depth
• Target 3 (20%): 1.618x cup depth + prior high

PROBABILITY: 60-70% for measured move
TIME HORIZON: 8-24 weeks typical
Trail with 50-day MA after Target 1 reached`
  },

  'bull-flag': {
    entry: `PRIMARY ENTRY: Breakout above flag resistance with:
• Volume 1.5x average on breakout
• Flagpole: Strong 10-25% move in 1-4 periods
• Flag: 5-15 periods, parallel channel downward
• Flag retraces 38-50% of pole (Fib retracement)

AGGRESSIVE ENTRY:
• Enter at lower flag support with tight stop
• Scale in as flag develops

DO NOT ENTER IF:
• Flag retraces >61.8% of pole (pattern weak)
• Flag duration >3 weeks (loses momentum)
• Volume increases in flag (distribution)
• No clear flagpole before flag`,

    stopLoss: `STOP LOSS PLACEMENT:
• Below flag low
• Or below breakout - 2%
• Very tight patterns, respect the stop

PATTERN FAILURE:
• Break below flag support = exit
• Often becomes bearish if flag fails`,

    target: `TARGET METHODOLOGY:
Measured Move = Flagpole length added to breakout
• Target 1 (60%): 61.8% of pole length
• Target 2 (30%): 100% pole length
• Target 3 (10%): 1.618x pole length

PROBABILITY: 68-72% (reliable continuation)
HOLD TIME: Usually reaches target in 5-20 periods
Exit 50% at 1:2 R:R, trail remainder aggressively`
  },

  'rising-wedge': {
    entry: `PRIMARY ENTRY: Breakdown below support trendline with:
• Volume expansion on breakdown (1.5x avg)
• Minimum 5 touches (alternating) on both trendlines
• Both trendlines rising, converging
• Upper trendline shallower angle = stronger reversal

CONFIRMATION:
• Forms after uptrend (reversal) or in middle (continuation)
• Declining volume through wedge formation
• Momentum divergence (price up, indicators down)

DO NOT ENTER:
• Breakout above resistance (invalidation)
• Early entry before clear break
• Low volume breakdown`,

    stopLoss: `STOP LOSS PLACEMENT:
• Above recent high within wedge
• Or above upper trendline + 2%

INVALIDATION:
• Break and close above upper trendline`,

    target: `TARGET METHODOLOGY:
Measured Move = Wedge height (widest point)
• Target 1 (50%): 61.8% of height
• Target 2 (40%): 100% measured move
• Target 3 (10%): Prior major support

PROBABILITY: 68-72% bearish success
Note: Rising wedge = bearish (counterintuitive)`
  },

  'falling-wedge': {
    entry: `PRIMARY ENTRY: Breakout above resistance trendline with:
• Volume 1.5x average on breakout
• Minimum 5 touches on both trendlines
• Both trendlines falling, converging
• Lower trendline steeper = stronger reversal

CONFIRMATION:
• Forms after downtrend (reversal)
• Declining volume through wedge
• Momentum divergence (price down, indicators up)

DO NOT ENTER:
• Breakdown below support (invalidation)
• Chase >4% above breakout`,

    stopLoss: `STOP LOSS PLACEMENT:
• Below recent low within wedge
• Or below lower trendline - 2%

INVALIDATION:
• Break below lower trendline`,

    target: `TARGET METHODOLOGY:
Measured Move = Wedge height added to breakout
• Target 1 (50%): 61.8% of height
• Target 2 (40%): 100% measured move
• Target 3 (10%): Prior major resistance

PROBABILITY: 68-72% bullish success
Note: Falling wedge = bullish (reversal pattern)`
  },

  'symmetrical-triangle': {
    entry: `PRIMARY ENTRY: Breakout either direction with:
• Volume 1.5x average critical (confirms direction)
• Minimum 4 touches (2 per trendline)
• Converging trendlines (symmetrical)
• Breakout at 50-75% of triangle width

DIRECTION PROBABILITY:
• Continuation pattern 75% of time
• Prior trend usually continues
• Volume pattern indicates direction

PULLBACK ENTRY:
• Wait for retest of broken trendline
• Enter on rejection with volume

DO NOT ENTER:
• Breakout in final 25% of triangle (apex)
• Low volume breakout (<0.8x avg)
• Unclear prior trend`,

    stopLoss: `STOP LOSS PLACEMENT:
• Opposite side of triangle
• Or beyond breakout point + 2-3%

TIGHT PATTERN:
• Smaller triangles = tighter stops`,

    target: `TARGET METHODOLOGY:
Measured Move = Triangle height (base width)
• Add height to breakout for bull
• Subtract height from breakout for bear
• Target 1 (60%): 75% of measured move
• Target 2 (30%): 100% measured move
• Target 3 (10%): 1.618x extension

PROBABILITY: 60-65% reach measured move
Exit 50% at 1:1.5 R:R`
  }
};

/**
 * Default position management rules following institutional standards
 */
export const DEFAULT_POSITION_MANAGEMENT: PositionManagementRules = {
  maxSimultaneousTrades: 3,
  maxRiskPerTrade: 2.0, // 2% per trade
  maxTotalRisk: 6.0, // 6% total exposure - auto-exits all open positions
  maxAccountDrawdown: 20.0, // 20% max account loss - stops ALL trading
  patternPriority: {
    'cup-handle': 10,
    'head-shoulders': 9,
    'inverted-head-shoulders': 9,
    'bull-flag': 8,
    'ascending-triangle': 8,
    'descending-triangle': 8,
    'double-bottom': 7,
    'double-top': 7,
    'symmetrical-triangle': 6,
    'rising-wedge': 6,
    'falling-wedge': 6
  },
  conflictResolution: 'higher-priority'
};

/**
 * Check if two patterns overlap in price and time
 */
export function patternsOverlap(
  pattern1: { symbol: string; priceRange: { low: number; high: number }; formationDate: Date },
  pattern2: { symbol: string; priceRange: { low: number; high: number }; formationDate: Date }
): boolean {
  // Must be same symbol
  if (pattern1.symbol !== pattern2.symbol) return false;

  // Check price overlap (10% threshold)
  const p1Mid = (pattern1.priceRange.low + pattern1.priceRange.high) / 2;
  const p2Mid = (pattern2.priceRange.low + pattern2.priceRange.high) / 2;
  const priceOverlap = Math.abs(p1Mid - p2Mid) / p1Mid < 0.10; // Within 10%

  // Check time overlap (patterns formed within 2 weeks)
  const timeDiff = Math.abs(pattern1.formationDate.getTime() - pattern2.formationDate.getTime());
  const twoWeeks = 14 * 24 * 60 * 60 * 1000;
  const timeOverlap = timeDiff < twoWeeks;

  return priceOverlap && timeOverlap;
}

/**
 * Resolve which pattern to trade when there's a conflict
 */
export function resolvePatternConflict(
  patterns: Array<{
    id: string;
    name: string;
    formationDate: Date;
    qualityScore: number; // 0-100
  }>,
  rules: PositionManagementRules
): string | null {
  if (patterns.length === 0) return null;
  if (patterns.length === 1) return patterns[0].id;

  switch (rules.conflictResolution) {
    case 'first-formed':
      // Trade the pattern that formed first (oldest)
      return patterns.sort((a, b) => a.formationDate.getTime() - b.formationDate.getTime())[0].id;
    
    case 'higher-priority':
      // Trade the pattern with highest priority
      return patterns.sort((a, b) => 
        (rules.patternPriority[b.name] || 0) - (rules.patternPriority[a.name] || 0)
      )[0].id;
    
    case 'higher-quality':
      // Trade the pattern with best quality score
      return patterns.sort((a, b) => b.qualityScore - a.qualityScore)[0].id;
    
    default:
      return patterns[0].id;
  }
}

/**
 * Calculate maximum position size based on risk rules
 */
export function calculatePositionSize(
  accountBalance: number,
  entryPrice: number,
  stopLossPrice: number,
  riskPerTrade: number // percentage (e.g., 2 for 2%)
): number {
  const riskAmount = accountBalance * (riskPerTrade / 100);
  const riskPerShare = Math.abs(entryPrice - stopLossPrice);
  
  if (riskPerShare === 0) return 0;
  
  const shares = Math.floor(riskAmount / riskPerShare);
  return shares;
}
