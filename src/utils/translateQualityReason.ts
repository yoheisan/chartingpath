import type { TFunction } from 'i18next';

/**
 * Translates dynamic quality reason strings from the pattern scorer.
 * These strings contain embedded numbers (ADX values, R:R ratios, ATR values, etc.)
 * that must be preserved while translating the template text.
 */

interface ReasonPattern {
  regex: RegExp;
  key: string;
  extractParams?: (match: RegExpMatchArray) => Record<string, string>;
}

const REASON_PATTERNS: ReasonPattern[] = [
  // Trend / ADX patterns
  { regex: /^Strong trend \(ADX ([\d.]+)\)$/, key: 'strongTrend', extractParams: m => ({ adx: m[1] }) },
  { regex: /^Moderate trend \(ADX ([\d.]+)\)$/, key: 'moderateTrend', extractParams: m => ({ adx: m[1] }) },
  { regex: /^Weak trend \(ADX ([\d.]+)\)$/, key: 'weakTrend', extractParams: m => ({ adx: m[1] }) },
  { regex: /^ADX direction confirms$/, key: 'adxConfirms' },
  { regex: /^ADX direction opposes$/, key: 'adxOpposes' },

  // RVOL patterns
  { regex: /^Very high RVOL \(([\d.]+)x\)$/, key: 'veryHighRVOL', extractParams: m => ({ value: m[1] }) },
  { regex: /^Elevated RVOL \(([\d.]+)x\)$/, key: 'elevatedRVOL', extractParams: m => ({ value: m[1] }) },
  { regex: /^Normal RVOL \(([\d.]+)x\)$/, key: 'normalRVOL', extractParams: m => ({ value: m[1] }) },
  { regex: /^Below-average RVOL \(([\d.]+)x\)$/, key: 'belowAvgRVOL', extractParams: m => ({ value: m[1] }) },
  { regex: /^Very low RVOL \(([\d.]+)x\)$/, key: 'veryLowRVOL', extractParams: m => ({ value: m[1] }) },

  // Volatility patterns
  { regex: /^Elevated volatility \(([\d.]+)x avg\)$/, key: 'elevatedVolatility', extractParams: m => ({ value: m[1] }) },
  { regex: /^Normal volatility regime$/, key: 'normalVolatility' },
  { regex: /^Normal volatility regime; Optimal for trend patterns$/, key: 'normalVolatilityOptimal' },
  { regex: /^High volatility regime; Wide stops recommended$/, key: 'highVolatilityWide' },
  { regex: /^Low volatility regime; Tight stops possible$/, key: 'lowVolatilityTight' },
  { regex: /^Low volatility \(([\d.]+)x avg\); Breakout potential$/, key: 'lowVolatilityBreakout', extractParams: m => ({ value: m[1] }) },

  // R:R patterns
  { regex: /^Excellent R:R \(([\d.]+)\)$/, key: 'excellentRR', extractParams: m => ({ value: m[1] }) },
  { regex: /^Good R:R \(([\d.]+)\)$/, key: 'goodRR', extractParams: m => ({ value: m[1] }) },
  { regex: /^Poor R:R \(([\d.]+)\)$/, key: 'poorRR', extractParams: m => ({ value: m[1] }) },

  // ATR stop patterns
  { regex: /^Stop at ([\d.]+) ATR \(optimal\)$/, key: 'stopATROptimal', extractParams: m => ({ value: m[1] }) },
  { regex: /^Stop too tight/, key: 'stopTooTight' },
  { regex: /^Stop too wide$/, key: 'stopTooWide' },

  // Volume patterns
  { regex: /^Strong breakout volume \(2x\+ average\)$/, key: 'strongBreakoutVolume' },
  { regex: /^Good breakout volume \(1\.5x\+ average\)$/, key: 'goodBreakoutVolume' },
  { regex: /^Weak breakout volume$/, key: 'weakBreakoutVolume' },
  { regex: /^Healthy volume contraction during pattern$/, key: 'healthyVolumeContraction' },
  { regex: /^Excessive volume decline$/, key: 'excessiveVolumDecline' },
  { regex: /^Breakout confirmed with volume$/, key: 'breakoutConfirmedVolume' },

  // Price action patterns
  { regex: /^Strong candle bodies/, key: 'strongCandleBodies' },
  { regex: /^Many doji\/spinning tops/, key: 'dojiSpinningTops' },
  { regex: /^Clean price action$/, key: 'cleanPriceAction' },
  { regex: /^Noisy price action$/, key: 'noisyPriceAction' },

  // Symmetry / structure
  { regex: /^Excellent pivot spacing$/, key: 'excellentPivotSpacing' },
  { regex: /^Good pivot spacing$/, key: 'goodPivotSpacing' },
  { regex: /^Irregular pivot spacing$/, key: 'irregularPivotSpacing' },
  { regex: /^Near-equal resistance levels$/, key: 'nearEqualResistance' },
  { regex: /^Near-equal support levels$/, key: 'nearEqualSupport' },

  // Trend alignment
  { regex: /^Long signal in uptrend$/, key: 'longInUptrend' },
  { regex: /^Short signal in downtrend$/, key: 'shortInDowntrend' },
  { regex: /^Pattern near key support level$/, key: 'nearKeySupport' },
  { regex: /^Pattern near key resistance level$/, key: 'nearKeyResistance' },
  { regex: /^Pattern detected$/, key: 'patternDetected' },
];

/**
 * Translates a single quality reason string.
 * Tries pattern matching first, then falls back to exact key lookup, then raw string.
 */
export function translateQualityReason(reason: string, t: TFunction): string {
  // Handle compound reasons joined by "; "
  if (reason.includes('; ')) {
    return reason.split('; ').map(part => translateSingleReason(part.trim(), t)).join('; ');
  }
  return translateSingleReason(reason, t);
}

function translateSingleReason(reason: string, t: TFunction): string {
  for (const pattern of REASON_PATTERNS) {
    const match = reason.match(pattern.regex);
    if (match) {
      const params = pattern.extractParams ? pattern.extractParams(match) : {};
      const key = `fullChart.qualityReasonPatterns.${pattern.key}`;
      const translated = t(key, { ...params, defaultValue: '' });
      if (translated && translated !== key) return translated;
      // Fallback: try legacy exact-match key
      break;
    }
  }

  // Try exact-match lookup (legacy)
  const exactKey = `fullChart.qualityReasons.${reason}`;
  const exact = t(exactKey, { defaultValue: '' });
  if (exact && exact !== exactKey) return exact;

  // Return original string as fallback
  return reason;
}
