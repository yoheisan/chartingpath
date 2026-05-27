/**
 * Centralized builder for Pattern Lab URLs.
 * Normalizes symbol (uppercase) and pattern_id (lowercase, hyphens) to match
 * the canonical formats used in `historical_pattern_occurrences`.
 */

export function normalizePatternId(patternId: string): string {
  return patternId.trim().toLowerCase().replace(/_/g, '-');
}

export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

interface PatternLabParams {
  instrument?: string;
  pattern?: string;
  timeframe?: string;
  mode?: 'validate' | 'automate';
  grade?: string;
}

export function buildPatternLabUrl(params: PatternLabParams): string {
  const sp = new URLSearchParams();

  if (params.instrument) sp.set('instrument', normalizeSymbol(params.instrument));
  if (params.pattern) sp.set('pattern', normalizePatternId(params.pattern));
  if (params.timeframe) sp.set('timeframe', params.timeframe);
  if (params.mode) sp.set('mode', params.mode);
  if (params.grade) sp.set('grade', params.grade);

  return `/projects/pattern-lab/new?${sp.toString()}`;
}

/**
 * Builds a canonical URL for the programmatic "Backtest <pattern> on <asset>" SEO page.
 * Path format mirrors the existing `/patterns/stats/...` programmatic pages.
 */
export function buildBacktestSeoUrl(patternId: string, assetClass: string): string {
  return `/backtest/${normalizePatternId(patternId)}/${assetClass}`;
}
