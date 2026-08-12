/**
 * SINGLE SOURCE OF TRUTH for the column vocabularies used by the two tables that
 * drive the edge lookup:
 *
 *   - `live_pattern_detections`        (what is firing right now)
 *   - `historical_pattern_occurrences` (what happened the last ~510k times)
 *
 * These two tables have diverged silently more than once. The failure mode is the
 * worst kind: a mismatched value produces ZERO ROWS, not an error, so the feature
 * looks like it is working and simply never finds anything.
 *
 * Known historical divergences:
 *   1. `direction` — live stores 'long' | 'short', historical stores 'bullish' |
 *      'bearish'. Zero overlap. A naive join returns nothing.
 *   2. `asset_type` — an older UI map sent 'stock' / 'commodity' / 'index' while the
 *      DB stores 'stocks' / 'commodities' / 'indices'.
 *
 * Verified identical (2026-08-12): `pattern_id` (live is a strict subset of
 * historical: 17 shared slugs, historical additionally has bear-flag, bull-flag,
 * cup-and-handle, inverse-cup-and-handle, triple-top, triple-bottom),
 * `timeframe` (both use 15m/1h/4h/8h/1d/1wk).
 *
 * RULE: never compare or join these columns with ad-hoc string literals. Go through
 * the helpers below. See docs/VOCABULARY-CONTRACT.md.
 */

// ---------------------------------------------------------------------------
// direction
// ---------------------------------------------------------------------------

/** Vocabulary used by `live_pattern_detections.direction`. */
export const LIVE_DIRECTIONS = ['long', 'short'] as const;
export type LiveDirection = (typeof LIVE_DIRECTIONS)[number];

/**
 * Vocabulary used by `historical_pattern_occurrences.direction` and
 * `cell_status.direction`. This is the CANONICAL vocabulary for anything that
 * touches measured edge.
 */
export const HISTORICAL_DIRECTIONS = ['bullish', 'bearish'] as const;
export type HistoricalDirection = (typeof HISTORICAL_DIRECTIONS)[number];

/** Vocabulary used by `paper_trades.trade_type`. Same words as the live table. */
export const TRADE_TYPES = ['long', 'short'] as const;
export type TradeType = (typeof TRADE_TYPES)[number];

/** live/paper vocabulary -> historical vocabulary. Accepts either, returns canonical. */
export function toHistoricalDirection(value: string | null | undefined): HistoricalDirection {
  switch ((value ?? '').toLowerCase()) {
    case 'short':
    case 'bearish':
    case 'sell':
      return 'bearish';
    default:
      return 'bullish';
  }
}

/** historical vocabulary -> live/paper vocabulary. Accepts either, returns canonical. */
export function toLiveDirection(value: string | null | undefined): LiveDirection {
  switch ((value ?? '').toLowerCase()) {
    case 'short':
    case 'bearish':
    case 'sell':
      return 'short';
    default:
      return 'long';
  }
}

/**
 * Compare a direction from either table safely. Use this instead of `a === b`.
 */
export function sameDirection(a: string | null | undefined, b: string | null | undefined): boolean {
  return toHistoricalDirection(a) === toHistoricalDirection(b);
}

// ---------------------------------------------------------------------------
// asset_type
// ---------------------------------------------------------------------------

/**
 * The DB vocabulary. Both tables agree on this — all plural, all lowercase.
 * Do NOT introduce singular forms anywhere.
 */
export const DB_ASSET_TYPES = ['stocks', 'fx', 'crypto', 'etfs', 'indices', 'commodities'] as const;
export type DbAssetType = (typeof DB_ASSET_TYPES)[number];

/** UI-facing labels/slugs seen in routes and filters, mapped to the DB vocabulary. */
const ASSET_TYPE_ALIASES: Record<string, DbAssetType> = {
  stock: 'stocks',
  stocks: 'stocks',
  equity: 'stocks',
  equities: 'stocks',
  forex: 'fx',
  fx: 'fx',
  currency: 'fx',
  currencies: 'fx',
  crypto: 'crypto',
  cryptocurrency: 'crypto',
  etf: 'etfs',
  etfs: 'etfs',
  index: 'indices',
  indices: 'indices',
  commodity: 'commodities',
  commodities: 'commodities',
};

/** Normalise any UI/legacy asset label to the DB vocabulary. Returns null if unknown. */
export function toDbAssetType(value: string | null | undefined): DbAssetType | null {
  if (!value) return null;
  return ASSET_TYPE_ALIASES[value.toLowerCase().trim()] ?? null;
}

export function isDbAssetType(value: string | null | undefined): value is DbAssetType {
  return !!value && (DB_ASSET_TYPES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// timeframe
// ---------------------------------------------------------------------------

/** Identical in both tables. 15m exists only for stocks in the historical set. */
export const DB_TIMEFRAMES = ['15m', '1h', '4h', '8h', '1d', '1wk'] as const;
export type DbTimeframe = (typeof DB_TIMEFRAMES)[number];

const TIMEFRAME_ALIASES: Record<string, DbTimeframe> = {
  '15m': '15m',
  '15min': '15m',
  '1h': '1h',
  '60m': '1h',
  '4h': '4h',
  '8h': '8h',
  '1d': '1d',
  d: '1d',
  daily: '1d',
  '1w': '1wk',
  '1wk': '1wk',
  weekly: '1wk',
};

export function toDbTimeframe(value: string | null | undefined): DbTimeframe | null {
  if (!value) return null;
  return TIMEFRAME_ALIASES[value.toLowerCase().trim()] ?? null;
}

// ---------------------------------------------------------------------------
// pattern_id
// ---------------------------------------------------------------------------

/**
 * Pattern slugs shared by both tables (verified 2026-08-12). Historical additionally
 * carries slugs the live detector does not emit, which is fine — the edge lookup only
 * ever goes live -> historical.
 */
export const SHARED_PATTERN_IDS = [
  'ascending-triangle',
  'descending-triangle',
  'donchian-breakout-long',
  'donchian-breakout-short',
  'double-bottom',
  'double-top',
  'falling-wedge',
  'head-and-shoulders',
  'inverse-head-and-shoulders',
  'rising-wedge',
  'symmetrical-triangle',
] as const;

/**
 * Slugs present in `historical_pattern_occurrences` but never emitted live. An alert
 * on these can never fire; useful for explaining empty results.
 */
export const HISTORICAL_ONLY_PATTERN_IDS = [
  'bear-flag',
  'bull-flag',
  'cup-and-handle',
  'inverse-cup-and-handle',
  'triple-top',
  'triple-bottom',
] as const;

/** Normalise a pattern identifier to the slug vocabulary both tables use. */
export function toDbPatternId(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.toLowerCase().trim().replace(/_/g, '-');
}

/** Direction implied by a pattern slug, in the CANONICAL historical vocabulary. */
export function directionForPatternId(patternId: string): HistoricalDirection {
  const id = toDbPatternId(patternId) ?? '';
  const bearish = [
    'short',
    'double-top',
    'descending-triangle',
    'head-and-shoulders',
    'rising-wedge',
    'bear-flag',
    'bearish',
    'evening-star',
    'triple-top',
    'inverse-cup-and-handle',
  ];
  if (id.includes('inverse-head')) return 'bullish';
  return bearish.some((k) => id.includes(k)) ? 'bearish' : 'bullish';
}
