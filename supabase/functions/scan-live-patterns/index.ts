import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { computeBracketLevels } from "../_shared/bracketLevels.ts";
import { ALL_INSTRUMENTS, type Instrument } from "../_shared/screenerInstruments.ts";
import { analyzePatternTrend, type OHLCBar } from "../_shared/trendIndicators.ts";
import {
  PATTERN_REGISTRY,
  BASE_PATTERNS,
  EXTENDED_PATTERNS,
  PREMIUM_PATTERNS,
  ALL_PATTERNS,
  calculateATR,
  isMarketOpen,
  getDbSymbol,
} from "../_shared/patternDetectors.ts";
import {
  calculatePatternQualityScore,
  type PatternQualityScorerInput,
} from "../_shared/patternQualityScorer.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ============================================
// Circuit Breaker + Retry Utilities
// ============================================
let consecutiveDbFailures = 0;
const MAX_DB_FAILURES = 3;
const CIRCUIT_RESET_MS = 5 * 60 * 1000;
let circuitOpenedAt = 0;

function isDbCircuitOpen(): boolean {
  if (consecutiveDbFailures < MAX_DB_FAILURES) return false;
  if (Date.now() - circuitOpenedAt > CIRCUIT_RESET_MS) {
    consecutiveDbFailures = 0;
    return false;
  }
  return true;
}
function recordDbSuccess() { consecutiveDbFailures = 0; }
function recordDbFailure() {
  consecutiveDbFailures++;
  if (consecutiveDbFailures >= MAX_DB_FAILURES) circuitOpenedAt = Date.now();
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 1, baseDelayMs = 300): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      recordDbSuccess();
      return result;
    } catch (err: any) {
      lastError = err;
      const isTimeout = err?.message?.includes('statement timeout') || err?.code === '57014';
      if (!isTimeout || attempt === maxRetries) {
        recordDbFailure();
        throw err;
      }
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(`[scan-live-patterns] Attempt ${attempt + 1} timed out, retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

function getInstrumentsForTier(assetType: string, maxTickers: number): string[] {
  const assetMap: Record<string, Instrument[]> = {
    fx: ALL_INSTRUMENTS.fx,
    crypto: ALL_INSTRUMENTS.crypto,
    stocks: ALL_INSTRUMENTS.stocks,
    commodities: ALL_INSTRUMENTS.commodities,
    indices: ALL_INSTRUMENTS.indices,
    etfs: ALL_INSTRUMENTS.etfs,
  };
  const instruments = assetMap[assetType] || [];
  return instruments.slice(0, maxTickers).map(i => i.yahooSymbol);
}

// Cache configuration
const scanCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000;
const CACHE_TTL_MS_SLOW = 5 * 60 * 1000;
const symbolDataCache = new Map<string, { bars: any[]; timestamp: number }>();
const SYMBOL_CACHE_TTL_MS = 3 * 60 * 1000;

// Pattern stats interface
interface PatternStats {
  winRate: number;
  avgRMultiple: number;
  sampleSize: number;
  avgDurationBars: number;
  accumulatedRoi: {
    threeMonth: number | null;
    sixMonth: number | null;
    oneYear: number | null;
    threeYear: number | null;
    fiveYear: number | null;
  };
}

// Supported R:R tiers (2 is baseline stored in 'outcome', 3-5 are in outcome_rr3, etc.)
type RRTier = 2 | 3 | 4 | 5;
const DEFAULT_RR_TIER: RRTier = 2;

// Cache computed historical stats in-memory to keep the DB-cache fast path responsive.
// Key: "patternId|symbol|timeframe|rrTier" for per-asset, per-timeframe, per-tier stats.
const patternSymbolStatsCache = new Map<string, { stats: PatternStats; ts: number }>();
const PATTERN_STATS_TTL_MS = 10 * 60 * 1000;

// Minimum sample size threshold - below this we consider stats unreliable
const MIN_SAMPLE_SIZE = 3;
// Maximum sample size that could reasonably be per-symbol (catches pattern-level fallbacks)
const MAX_REALISTIC_PER_SYMBOL_SAMPLE = 500;

function isStatsSuspect(hp: any): boolean {
  // Only treat truly missing or empty data as suspect.
  // Pattern-level aggregates are now considered valid — they provide the best available signal.
  const n = hp?.sampleSize;
  if (typeof n !== 'number') return true;
  if (n < MIN_SAMPLE_SIZE) return true;
  // Removed: MAX_REALISTIC_PER_SYMBOL_SAMPLE check — pattern-level fallbacks are valid and should not be wiped.
  return false;
}

function toHistoricalPerformance(stats: PatternStats) {
  return {
    winRate: stats.winRate,
    avgRMultiple: stats.avgRMultiple,
    sampleSize: stats.sampleSize,
    avgDurationBars: stats.avgDurationBars,
    accumulatedRoi: stats.accumulatedRoi,
  };
}

// Build a cache key for pattern+symbol+timeframe+rrTier combination
function getStatsKey(patternId: string, symbol: string, timeframe: string, rrTier: RRTier = 2): string {
  return `${patternId}|${symbol}|${timeframe}|${rrTier}`;
}

// Normalize symbol for DB lookup (Yahoo symbol -> DB symbol)
// NOTE: historical_pattern_occurrences stores symbols in Yahoo format (e.g. GBPNZD=X, BTC-USD)
// so we should NOT strip the suffix
function normalizeSymbolForStats(yahooSymbol: string): string {
  // The DB stores symbols in Yahoo format, so return as-is
  return yahooSymbol;
}

async function loadFromDbCache(
  supabase: any, symbols: string[], timeframe: string, minDays: number = 60, minBarsRequired: number = 20
): Promise<Map<string, any[]>> {
  const results = new Map<string, any[]>();
  const dbSymbols = symbols.map(s => getDbSymbol(s));
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - minDays);
    
    const { data, error } = await supabase
      .from('historical_prices')
      .select('symbol, date, open, high, low, close, volume')
      .in('symbol', dbSymbols)
      .eq('timeframe', timeframe)
      .gte('date', cutoffDate.toISOString())
      .order('date', { ascending: true });
    
    if (error || !data?.length) return results;
    
    const symbolGroups = new Map<string, any[]>();
    for (const row of data) {
      if (!symbolGroups.has(row.symbol)) symbolGroups.set(row.symbol, []);
      symbolGroups.get(row.symbol)!.push({
        date: row.date, open: row.open, high: row.high, low: row.low, close: row.close, volume: row.volume || 0,
      });
    }
    
    for (const [dbSymbol, bars] of symbolGroups) {
      const yahooSymbol = symbols.find(s => getDbSymbol(s) === dbSymbol);
      if (yahooSymbol && bars.length >= minBarsRequired) results.set(yahooSymbol, bars);
    }
    return results;
  } catch { return results; }
}

// ============================================
// Repeatability Gate: Edge Atlas aggregate stats
// ============================================
interface EdgeAtlasEntry {
  pattern_id: string;
  timeframe: string;
  total_trades: number;
  win_rate_pct: number;
  expectancy_r: number;
}

async function fetchRepeatabilityStats(
  supabase: any,
  patternIds: string[],
  timeframe: string,
  assetType: string
): Promise<Map<string, EdgeAtlasEntry>> {
  const map = new Map<string, EdgeAtlasEntry>();
  if (!patternIds.length) return map;
  
  try {
    const { data, error } = await supabase.rpc('get_edge_atlas_rankings_filtered', {
      p_asset_type: assetType,
      p_timeframe: timeframe,
      p_min_trades: 1, // fetch all, let the scorer apply thresholds
      p_limit: 100,
    });
    
    if (error) {
      console.warn('[repeatability] Edge Atlas query error:', error.message);
      return map;
    }
    
    for (const row of (data || [])) {
      map.set(row.pattern_id, {
        pattern_id: row.pattern_id,
        timeframe: row.timeframe,
        total_trades: Number(row.total_trades),
        win_rate_pct: Number(row.win_rate_pct),
        expectancy_r: Number(row.expectancy_r),
      });
    }
    
    console.info(`[repeatability] Loaded ${map.size} Edge Atlas entries for ${assetType}@${timeframe}`);
  } catch (err: any) {
    console.warn('[repeatability] Exception:', err.message);
  }
  
  return map;
}

// Fetch stats per (pattern_id, symbol, rrTier) combination - returns Map keyed by "patternId|symbol|rrTier"
async function fetchPatternSymbolStats(
  supabase: any, 
  patternSymbolPairs: Array<{ patternId: string; symbol: string }>,
  timeframe: string,
  rrTier: RRTier = DEFAULT_RR_TIER
): Promise<Map<string, PatternStats>> {
  const statsMap = new Map<string, PatternStats>();
  if (!patternSymbolPairs.length) {
    console.info('[fetchPatternSymbolStats] No pairs to fetch stats for');
    return statsMap;
  }
  
  const now = Date.now();
  const toFetch: Array<{ patternId: string; symbol: string }> = [];
  
  // Check cache first (now includes timeframe + rrTier in key)
  for (const pair of patternSymbolPairs) {
    const key = getStatsKey(pair.patternId, pair.symbol, timeframe, rrTier);
    const cached = patternSymbolStatsCache.get(key);
    if (cached && now - cached.ts < PATTERN_STATS_TTL_MS) {
      statsMap.set(key, cached.stats);
    } else {
      toFetch.push(pair);
    }
  }
  
  if (!toFetch.length) {
    console.info(`[fetchPatternSymbolStats] All ${patternSymbolPairs.length} stats served from cache (rrTier=${rrTier})`);
    return statsMap;
  }
  
  try {
    const uniquePatternIds = [...new Set(toFetch.map(p => p.patternId))];
    const uniqueSymbols = [...new Set(toFetch.map(p => normalizeSymbolForStats(p.symbol)))];
    
    console.info(`[fetchPatternSymbolStats] Fetching from DB: ${toFetch.length} pairs, timeframe=${timeframe}, rrTier=${rrTier}`);
    
    // Determine which columns to select based on R:R tier
    const outcomeCol = rrTier === 2 ? 'outcome' : `outcome_rr${rrTier}`;
    const pnlCol = rrTier === 2 ? 'outcome_pnl_percent' : `outcome_pnl_percent_rr${rrTier}`;
    const barsCol = rrTier === 2 ? 'bars_to_outcome' : `bars_to_outcome_rr${rrTier}`;
    
    // Fetch ALL records with pagination.
    // NOTE: PostgREST/Supabase often enforces a server-side max rows limit (commonly 1000).
    // Using a larger page size can cause us to incorrectly think there are no more pages.
    const PAGE_SIZE = 1000;
    let allData: any[] = [];
    let page = 0;
    let hasMore = true;
    
    while (hasMore) {
      try {
        const { data: pageData, error } = await supabase
          .from('historical_pattern_occurrences')
          .select(`pattern_id, symbol, ${outcomeCol}, ${pnlCol}, ${barsCol}, detected_at`)
          .in('pattern_id', uniquePatternIds)
          .in('symbol', uniqueSymbols)
          .eq('timeframe', timeframe)
          .not(outcomeCol, 'is', null)
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        
        if (error) {
          // If timeout, return what we have so far instead of failing completely
          const isTimeout = error.message?.includes('statement timeout') || error.code === '57014';
          if (isTimeout) {
            console.warn(`[fetchPatternSymbolStats] Timeout on page ${page}, using ${allData.length} rows collected so far`);
            hasMore = false;
            break;
          }
          console.error('[fetchPatternSymbolStats] Query error:', error.message);
          return statsMap;
        }
        
        if (!pageData?.length) {
          hasMore = false;
        } else {
          allData = allData.concat(pageData);
          hasMore = pageData.length === PAGE_SIZE;
          page++;
          // Safety: cap at 5 pages to prevent runaway queries
          if (page >= 5) {
            console.warn(`[fetchPatternSymbolStats] Capped at ${page} pages (${allData.length} rows)`);
            hasMore = false;
          }
        }
      } catch (err: any) {
        console.warn(`[fetchPatternSymbolStats] Exception on page ${page}: ${err.message}`);
        hasMore = false;
      }
    }
    
    if (!allData.length) {
      console.warn(`[fetchPatternSymbolStats] No exact-timeframe data found for rrTier=${rrTier}, will try cross-timeframe fallback`);
      // Don't return early - fall through to cross-timeframe fallback below
    }
    
    if (allData.length) {
    console.info(`[fetchPatternSymbolStats] Found ${allData.length} historical occurrences for rrTier=${rrTier}`);
    
    const nowDate = new Date();
    const threeMonthsAgo = new Date(nowDate); threeMonthsAgo.setMonth(nowDate.getMonth() - 3);
    const sixMonthsAgo = new Date(nowDate); sixMonthsAgo.setMonth(nowDate.getMonth() - 6);
    const oneYearAgo = new Date(nowDate); oneYearAgo.setFullYear(nowDate.getFullYear() - 1);
    const threeYearsAgo = new Date(nowDate); threeYearsAgo.setFullYear(nowDate.getFullYear() - 3);
    const fiveYearsAgo = new Date(nowDate); fiveYearsAgo.setFullYear(nowDate.getFullYear() - 5);
    
    // Group by pattern_id|symbol
    const grouped = new Map<string, any>();
    for (const row of allData) {
      const key = `${row.pattern_id}|${row.symbol}`;
      if (!grouped.has(key)) {
        grouped.set(key, { wins: 0, total: 0, pnlSum: 0, durationSum: 0, durationCount: 0,
          roi3m: 0, roi6m: 0, roi1y: 0, roi3y: 0, roi5y: 0,
          count3m: 0, count6m: 0, count1y: 0, count3y: 0, count5y: 0 });
      }
      const e = grouped.get(key)!;
      
      // Access the dynamically named columns
      const outcome = row[outcomeCol];
      const pnl = row[pnlCol] ?? 0;
      const bars = row[barsCol];
      
      if (outcome === 'hit_tp' || outcome === 'hit_sl') {
        e.total++;
        if (outcome === 'hit_tp') e.wins++;
        e.pnlSum += pnl;
        if (bars != null) { e.durationSum += bars; e.durationCount++; }
        const d = new Date(row.detected_at);
        if (d >= threeMonthsAgo) { e.roi3m += pnl; e.count3m++; }
        if (d >= sixMonthsAgo) { e.roi6m += pnl; e.count6m++; }
        if (d >= oneYearAgo) { e.roi1y += pnl; e.count1y++; }
        if (d >= threeYearsAgo) { e.roi3y += pnl; e.count3y++; }
        if (d >= fiveYearsAgo) { e.roi5y += pnl; e.count5y++; }
      }
    }
    
    // Build stats for each pair (key now includes timeframe + rrTier)
    for (const [baseKey, e] of grouped) {
      if (e.total > 0) {
        const stats: PatternStats = {
          winRate: Math.round((e.wins / e.total) * 1000) / 10,
          avgRMultiple: Math.round((e.pnlSum / e.total / 100) * 100) / 100,
          sampleSize: e.total,
          avgDurationBars: e.durationCount > 0 ? Math.round(e.durationSum / e.durationCount) : 0,
          accumulatedRoi: {
            threeMonth: e.count3m > 0 ? Math.round(e.roi3m * 10) / 10 : null,
            sixMonth: e.count6m > 0 ? Math.round(e.roi6m * 10) / 10 : null,
            oneYear: e.count1y > 0 ? Math.round(e.roi1y * 10) / 10 : null,
            threeYear: e.count3y > 0 ? Math.round(e.roi3y * 10) / 10 : null,
            fiveYear: e.count5y > 0 ? Math.round(e.roi5y * 10) / 10 : null,
          },
        };
        const fullKey = `${baseKey}|${timeframe}|${rrTier}`;
        statsMap.set(fullKey, stats);
        patternSymbolStatsCache.set(fullKey, { stats, ts: now });
      }
    }
    
    // For requested pairs that didn't get stats, check if we need to map Yahoo symbols
    for (const pair of toFetch) {
      const yahooKey = getStatsKey(pair.patternId, pair.symbol, timeframe, rrTier);
      if (statsMap.has(yahooKey)) continue;
      
      // Try with normalized symbol
      const normalizedSymbol = normalizeSymbolForStats(pair.symbol);
      const normalizedKey = `${pair.patternId}|${normalizedSymbol}|${timeframe}|${rrTier}`;
      const normalizedStats = statsMap.get(normalizedKey);
      if (normalizedStats) {
        statsMap.set(yahooKey, normalizedStats);
        patternSymbolStatsCache.set(yahooKey, { stats: normalizedStats, ts: now });
      }
    }
    
    console.info(`[fetchPatternSymbolStats] Computed stats for ${statsMap.size} pattern-symbol pairs at timeframe=${timeframe}, rrTier=${rrTier}`);
    } // end if (allData.length)
    
    // Cross-timeframe fallback: for pairs with no stats at the requested timeframe,
    // try the closest available timeframe so users still see win rates.
    const pairsWithoutStats = toFetch.filter(pair => {
      const key = getStatsKey(pair.patternId, pair.symbol, timeframe, rrTier);
      return !statsMap.has(key);
    });
    
    if (pairsWithoutStats.length > 0) {
      console.info(`[fetchPatternSymbolStats] ${pairsWithoutStats.length} pairs missing stats at ${timeframe}, trying cross-timeframe fallback`);
      const fallbackStats = await fetchCrossTimeframeFallback(supabase, pairsWithoutStats, timeframe, rrTier);
      for (const [key, stats] of fallbackStats) {
        statsMap.set(key, stats);
        patternSymbolStatsCache.set(key, { stats, ts: now });
      }
      if (fallbackStats.size > 0) {
        console.info(`[fetchPatternSymbolStats] Cross-timeframe fallback enriched ${fallbackStats.size} additional pairs`);
      }
    }
    
    return statsMap;
  } catch (err: any) {
    console.error('[fetchPatternSymbolStats] Exception:', err.message);
    return statsMap;
  }
}


// Timeframe proximity order for cross-timeframe fallback.
// When exact timeframe has no data, try the closest alternative.
const TIMEFRAME_FALLBACK_ORDER: Record<string, string[]> = {
  '1h':  ['4h', '8h', '1d', '1wk'],
  '4h':  ['8h', '1h', '1d', '1wk'],
  '8h':  ['4h', '1d', '1h', '1wk'],
  '1d':  ['8h', '4h', '1wk', '1h'],
  '1wk': ['1d', '8h', '4h'],
};

async function fetchCrossTimeframeFallback(
  supabase: any,
  pairs: Array<{ patternId: string; symbol: string }>,
  originalTimeframe: string,
  rrTier: RRTier = DEFAULT_RR_TIER
): Promise<Map<string, PatternStats>> {
  const result = new Map<string, PatternStats>();
  const fallbackTimeframes = TIMEFRAME_FALLBACK_ORDER[originalTimeframe];
  if (!pairs.length) return result;

  const uniquePatternIds = [...new Set(pairs.map(p => p.patternId))];
  const uniqueSymbols = [...new Set(pairs.map(p => normalizeSymbolForStats(p.symbol)))];
  const outcomeCol = rrTier === 2 ? 'outcome' : `outcome_rr${rrTier}`;
  const pnlCol = rrTier === 2 ? 'outcome_pnl_percent' : `outcome_pnl_percent_rr${rrTier}`;

  // Phase 1: Try per-symbol stats at alternative timeframes
  if (fallbackTimeframes?.length) {
    for (const tf of fallbackTimeframes) {
      const remainingPairs = pairs.filter(p => !result.has(getStatsKey(p.patternId, p.symbol, originalTimeframe, rrTier)));
      if (!remainingPairs.length) break;

      try {
        const { data, error } = await supabase
          .from('historical_pattern_occurrences')
          .select(`pattern_id, symbol, ${outcomeCol}, ${pnlCol}, bars_to_outcome`)
          .in('pattern_id', uniquePatternIds)
          .in('symbol', uniqueSymbols)
          .eq('timeframe', tf)
          .not(outcomeCol, 'is', null)
          .limit(2000);

        if (error || !data?.length) continue;

        const grouped = new Map<string, { wins: number; total: number; pnlSum: number; durationSum: number; durationCount: number }>();
        for (const row of data) {
          const outcome = row[outcomeCol];
          if (outcome !== 'hit_tp' && outcome !== 'hit_sl') continue;
          const k = `${row.pattern_id}|${row.symbol}`;
          if (!grouped.has(k)) grouped.set(k, { wins: 0, total: 0, pnlSum: 0, durationSum: 0, durationCount: 0 });
          const e = grouped.get(k)!;
          e.total++;
          if (outcome === 'hit_tp') e.wins++;
          e.pnlSum += row[pnlCol] ?? 0;
          if (row.bars_to_outcome != null) { e.durationSum += row.bars_to_outcome; e.durationCount++; }
        }

        for (const [baseKey, e] of grouped) {
          if (e.total < MIN_SAMPLE_SIZE) continue;
          const [patternId, symbol] = baseKey.split('|');
          const originalKey = getStatsKey(patternId, symbol, originalTimeframe, rrTier);
          if (result.has(originalKey)) continue;
          result.set(originalKey, {
            winRate: Math.round((e.wins / e.total) * 1000) / 10,
            avgRMultiple: Math.round((e.pnlSum / e.total / 100) * 100) / 100,
            sampleSize: e.total,
            avgDurationBars: e.durationCount > 0 ? Math.round(e.durationSum / e.durationCount) : 0,
            accumulatedRoi: { threeMonth: null, sixMonth: null, oneYear: null, threeYear: null, fiveYear: null },
          });
        }
        console.info(`[crossTimeframeFallback] Per-symbol at ${tf}: running total ${result.size} pairs`);
      } catch (err: any) {
        console.warn(`[crossTimeframeFallback] Error querying ${tf}: ${err.message}`);
      }
    }
  }

  // Phase 2: Pattern-level aggregate fallback for remaining pairs.
  // When no per-symbol data exists at any timeframe, use the pattern's global win rate across all symbols.
  const stillMissing = pairs.filter(p => !result.has(getStatsKey(p.patternId, p.symbol, originalTimeframe, rrTier)));
  if (stillMissing.length > 0) {
    const missingPatternIds = [...new Set(stillMissing.map(p => p.patternId))];
    console.info(`[crossTimeframeFallback] Phase 2: ${stillMissing.length} pairs still missing, trying pattern-level aggregate for ${missingPatternIds.length} patterns`);
    
    try {
      // Query aggregate stats across ALL symbols for these patterns (prefer same timeframe, then any)
      const { data, error } = await supabase
        .from('historical_pattern_occurrences')
        .select(`pattern_id, ${outcomeCol}, ${pnlCol}, bars_to_outcome`)
        .in('pattern_id', missingPatternIds)
        .not(outcomeCol, 'is', null)
        .limit(5000);

      if (!error && data?.length) {
        const patternAgg = new Map<string, { wins: number; total: number; pnlSum: number; durationSum: number; durationCount: number }>();
        for (const row of data) {
          const outcome = row[outcomeCol];
          if (outcome !== 'hit_tp' && outcome !== 'hit_sl') continue;
          if (!patternAgg.has(row.pattern_id)) patternAgg.set(row.pattern_id, { wins: 0, total: 0, pnlSum: 0, durationSum: 0, durationCount: 0 });
          const e = patternAgg.get(row.pattern_id)!;
          e.total++;
          if (outcome === 'hit_tp') e.wins++;
          e.pnlSum += row[pnlCol] ?? 0;
          if (row.bars_to_outcome != null) { e.durationSum += row.bars_to_outcome; e.durationCount++; }
        }

        for (const pair of stillMissing) {
          const agg = patternAgg.get(pair.patternId);
          if (!agg || agg.total < MIN_SAMPLE_SIZE) continue;
          const key = getStatsKey(pair.patternId, pair.symbol, originalTimeframe, rrTier);
          result.set(key, {
            winRate: Math.round((agg.wins / agg.total) * 1000) / 10,
            avgRMultiple: Math.round((agg.pnlSum / agg.total / 100) * 100) / 100,
            sampleSize: agg.total,
            avgDurationBars: agg.durationCount > 0 ? Math.round(agg.durationSum / agg.durationCount) : 0,
            accumulatedRoi: { threeMonth: null, sixMonth: null, oneYear: null, threeYear: null, fiveYear: null },
          });
        }
        console.info(`[crossTimeframeFallback] Pattern-level aggregate: total ${result.size} pairs enriched`);
      }
    } catch (err: any) {
      console.warn(`[crossTimeframeFallback] Pattern aggregate error: ${err.message}`);
    }
  }

  return result;
}

/**
 * Convert Yahoo-format symbol to EODHD format
 */
function toEODHDSymbol(symbol: string): string {
  if (symbol.includes('-USD') && !symbol.startsWith('^') && !symbol.includes('=')) {
    return `${symbol.replace('-USD', '')}-USD.CC`;
  }
  if (symbol.includes('=X')) return `${symbol.replace('=X', '')}.FOREX`;
  if (symbol.includes('=F')) return `${symbol.replace('=F', '')}.COMM`;
  if (symbol.startsWith('^')) return `${symbol.replace('^', '')}.INDX`;
  if (symbol.endsWith('.HK')) return symbol;
  if (symbol.endsWith('.SI')) return `${symbol.replace('.SI', '')}.SG`;
  if (symbol.endsWith('.SS')) return `${symbol.replace('.SS', '')}.SHG`;
  if (symbol.endsWith('.SZ')) return `${symbol.replace('.SZ', '')}.SHE`;
  return `${symbol}.US`;
}

/**
 * EODHD-first data fetch with Yahoo as last-resort fallback
 */
async function fetchEODHDDataSingle(symbol: string, startDate: string, endDate: string, interval: string = '1d'): Promise<any[]> {
  const EODHD_API_KEY = Deno.env.get('EODHD_API_KEY');
  if (!EODHD_API_KEY) return [];
  
  try {
    const eodhSymbol = toEODHDSymbol(symbol);
    const isIntraday = ['1m', '5m', '15m', '1h', '4h', '8h'].includes(interval);
    const eodhInterval = (interval === '4h' || interval === '8h') ? '1h' : interval === '15m' ? '5m' : interval;
    
    let url: string;
    if (isIntraday && ['1m', '5m', '1h'].includes(eodhInterval)) {
      const fromTs = Math.floor(new Date(startDate).getTime() / 1000);
      const toTs = Math.floor(new Date(endDate).getTime() / 1000);
      url = `https://eodhd.com/api/intraday/${eodhSymbol}?api_token=${EODHD_API_KEY}&interval=${eodhInterval}&from=${fromTs}&to=${toTs}&fmt=json`;
    } else {
      const start = startDate.split('T')[0];
      const end = endDate.split('T')[0];
      url = `https://eodhd.com/api/eod/${eodhSymbol}?api_token=${EODHD_API_KEY}&from=${start}&to=${end}&period=d&fmt=json`;
    }
    
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) return [];
    
    let bars: any[];
    if (isIntraday && ['1m', '5m', '1h'].includes(eodhInterval)) {
      bars = data
        .filter((bar: any) => bar.close && Number.isFinite(bar.close))
        .map((bar: any) => ({
          date: bar.datetime || new Date(bar.timestamp * 1000).toISOString(),
          open: Number(bar.open), high: Number(bar.high), low: Number(bar.low),
          close: Number(bar.close), volume: Number(bar.volume) || 0,
        }));
    } else {
      bars = data
        .filter((bar: any) => bar.close && Number.isFinite(bar.close))
        .map((bar: any) => ({
          date: new Date(bar.date).toISOString(),
          open: Number(bar.open), high: Number(bar.high), low: Number(bar.low),
          close: Number(bar.adjusted_close || bar.close), volume: Number(bar.volume) || 0,
        }));
    }
    
    // Aggregate 4h/8h from 1h if needed
    if (interval === '4h' && bars.length > 0) {
      bars = aggregateHourlyBars(bars, 4);
    } else if (interval === '8h' && bars.length > 0) {
      bars = aggregateHourlyBars(bars, 8);
    }
    
    return bars;
  } catch { return []; }
}

// Aggregate 1H bars to 4H or 8H (UTC-anchored, skip partial bars)
// 4H boundaries: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC
// 8H boundaries: 00:00, 08:00, 16:00 UTC
//
// OHLCV aggregation rules:
//   Open   = first bar's open
//   High   = max of all highs
//   Low    = min of all lows
//   Close  = last bar's close
//   Volume = sum of all volumes
//   Partial bars at period end are skipped entirely
//
// Expected aggregation test case (4H):
//   Input 1H bars:
//     Bar1: O=1.0800 H=1.0850 L=1.0780 C=1.0820 V=1000
//     Bar2: O=1.0820 H=1.0900 L=1.0810 C=1.0880 V=1200
//     Bar3: O=1.0880 H=1.0920 L=1.0860 C=1.0870 V=800
//     Bar4: O=1.0870 H=1.0890 L=1.0830 C=1.0840 V=1100
//   Expected 4H bar:
//     O=1.0800 (bar1 open)
//     H=1.0920 (max of all highs)
//     L=1.0780 (min of all lows)
//     C=1.0840 (bar4 close)
//     V=4100   (sum of volumes)
function aggregateHourlyBars(bars: any[], period: 4 | 8): any[] {
  const grouped = new Map<string, any[]>();
  for (const bar of bars) {
    const d = new Date(bar.date);
    const periodStart = Math.floor(d.getUTCHours() / period) * period;
    const boundary = new Date(d);
    boundary.setUTCHours(periodStart, 0, 0, 0);
    const key = boundary.toISOString();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(bar);
  }
  const result: any[] = [];
  for (const [k, wBars] of grouped) {
    // Skip partial bars — only emit complete periods
    if (wBars.length < period) continue;
    wBars.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    result.push({
      date: k,
      open: wBars[0].open,
      high: Math.max(...wBars.map((b: any) => b.high)),
      low: Math.min(...wBars.map((b: any) => b.low)),
      close: wBars[wBars.length - 1].close,
      volume: wBars.reduce((s: number, b: any) => s + b.volume, 0),
    });
  }
  result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return result;
}

async function fetchYahooDataSingle(symbol: string, startDate: string, endDate: string, interval: string = '1d'): Promise<any[]> {
  try {
    const yahooInterval = interval === '4h' ? '1h' : interval;
    const period1 = Math.floor(new Date(startDate).getTime() / 1000);
    const period2 = Math.floor(new Date(endDate).getTime() / 1000);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=${yahooInterval}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) return [];
    const data = await response.json();
    const result = data.chart?.result?.[0];
    if (!result?.timestamp) return [];
    const timestamps = result.timestamp;
    const quotes = result.indicators?.quote?.[0];
    if (!quotes) return [];
    const bars: any[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quotes.open[i] != null && quotes.high[i] != null && quotes.low[i] != null && quotes.close[i] != null) {
        bars.push({ date: new Date(timestamps[i] * 1000).toISOString(), open: quotes.open[i], high: quotes.high[i], low: quotes.low[i], close: quotes.close[i], volume: quotes.volume[i] || 0 });
      }
    }
    return bars;
  } catch { return []; }
}

/**
 * EODHD-first external data fetch. Crypto uses Yahoo directly (Binance is primary via different path).
 */
async function fetchExternalDataSingle(symbol: string, startDate: string, endDate: string, interval: string = '1d'): Promise<any[]> {
  const isCrypto = symbol.includes('-USD') && !symbol.includes('=');
  
  if (isCrypto) {
    // Crypto: Yahoo fallback only (Binance is primary via different path)
    return fetchYahooDataSingle(symbol, startDate, endDate, interval);
  }
  
  // Non-crypto: EODHD first, Yahoo last-resort
  const eodhBars = await fetchEODHDDataSingle(symbol, startDate, endDate, interval);
  if (eodhBars.length > 0) return eodhBars;
  
  console.log(`[scan-live-patterns] EODHD empty for ${symbol}, falling back to Yahoo`);
  return fetchYahooDataSingle(symbol, startDate, endDate, interval);
}

async function fetchDataBatchWithDbFallback(
  supabase: any, symbols: string[], startDate: string, endDate: string, interval: string = '1d', concurrency: number = 10, minBarsRequired: number = 20
): Promise<Map<string, any[]>> {
  const results = new Map<string, any[]>();
  const now = Date.now();
  const symbolsAfterMemCache: string[] = [];
  
  for (const symbol of symbols) {
    const cached = symbolDataCache.get(`${symbol}:${interval}`);
    if (cached && now - cached.timestamp < SYMBOL_CACHE_TTL_MS && cached.bars.length >= minBarsRequired) {
      results.set(symbol, cached.bars);
    } else symbolsAfterMemCache.push(symbol);
  }
  if (!symbolsAfterMemCache.length) return results;
  
  const daysRequested = Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)));
  const dbResults = await loadFromDbCache(supabase, symbolsAfterMemCache, interval, daysRequested, minBarsRequired);
  const symbolsNeedingExternal: string[] = [];
  
  for (const symbol of symbolsAfterMemCache) {
    const dbBars = dbResults.get(symbol);
    if (dbBars && dbBars.length >= minBarsRequired) {
      results.set(symbol, dbBars);
      symbolDataCache.set(`${symbol}:${interval}`, { bars: dbBars, timestamp: now });
    } else symbolsNeedingExternal.push(symbol);
  }
  
  for (let i = 0; i < symbolsNeedingExternal.length; i += concurrency) {
    const batch = symbolsNeedingExternal.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(s => fetchExternalDataSingle(s, startDate, endDate, interval)));
    const barsToUpsert: Array<{ symbol: string; date: string; open: number; high: number; low: number; close: number; volume: number; timeframe: string; instrument_type: string }> = [];
    batchResults.forEach((r, idx) => {
      const symbol = batch[idx];
      if (r.status === 'fulfilled' && r.value.length > 0) {
        results.set(symbol, r.value);
        symbolDataCache.set(`${symbol}:${interval}`, { bars: r.value, timestamp: now });
        // Collect bars for DB persistence so future chart loads get fresh data
        const dbSym = getDbSymbol(symbol);
        const instrType = symbol.endsWith('=X') ? 'forex' : symbol.endsWith('-USD') || symbol.endsWith('USDT') ? 'crypto' : symbol.startsWith('^') ? 'index' : 'stock';
        for (const bar of r.value) {
          barsToUpsert.push({
            symbol: dbSym,
            date: bar.date,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
            volume: bar.volume || 0,
            timeframe: interval,
            instrument_type: instrType,
          });
        }
      }
    });
    // Persist Yahoo-fetched bars to historical_prices so DB stays fresh
    if (barsToUpsert.length > 0) {
      try {
        // Batch upsert in chunks of 500
        for (let j = 0; j < barsToUpsert.length; j += 500) {
          const chunk = barsToUpsert.slice(j, j + 500);
          await supabase.from('historical_prices').upsert(chunk, { onConflict: 'symbol,timeframe,date', ignoreDuplicates: false });
        }
        console.info(`[scan-live-patterns] Persisted ${barsToUpsert.length} EODHD/external bars to historical_prices for ${batch.length} symbols at ${interval}`);
      } catch (err: any) {
        console.warn(`[scan-live-patterns] Failed to persist external bars: ${err.message}`);
      }
    }
  }
  return results;
}

function safeComputeTrend(bars: any[], direction: 'long' | 'short'): { trendAlignment: string | null; trendIndicators: any | null } {
  if (!bars || bars.length < 200) return { trendAlignment: null, trendIndicators: null };
  try {
    const ohlcBars: OHLCBar[] = bars.map(b => ({ date: b.date, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume || 0 }));
    const result = analyzePatternTrend(ohlcBars, direction);
    return result ? { trendAlignment: result.alignment, trendIndicators: result.indicators } : { trendAlignment: null, trendIndicators: null };
  } catch { return { trendAlignment: null, trendIndicators: null }; }
}

// Return the close-time of a candle given its open timestamp and the timeframe
function getCandleCloseTime(openTs: string, tf: string): number {
  const intervalMs: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '8h': 8 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1wk': 7 * 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
  };
  return new Date(openTs).getTime() + (intervalMs[tf] || 24 * 60 * 60 * 1000);
}

async function persistPatterns(supabase: any, detectedPatterns: any[], assetType: string, timeframe: string): Promise<Map<string, Date>> {
  const patternKeys = new Map<string, Date>();
  if (!detectedPatterns.length) return patternKeys;
  
  const detectedKeys = new Set(detectedPatterns.map(p => `${p.instrument}|${p.patternId}|${timeframe}`));
  const { data: existingPatterns } = await supabase.from('live_pattern_detections').select('id, instrument, pattern_id, timeframe, first_detected_at')
    .eq('asset_type', assetType).eq('timeframe', timeframe).eq('status', 'active');
  
  const existingMap = new Map<string, { id: string; first_detected_at: string }>();
  for (const ep of existingPatterns || []) {
    existingMap.set(`${ep.instrument}|${ep.pattern_id}|${ep.timeframe}`, { id: ep.id, first_detected_at: ep.first_detected_at });
  }
  
  const toInvalidate = [...existingMap].filter(([k]) => !detectedKeys.has(k)).map(([, v]) => v.id);
  if (toInvalidate.length) await supabase.from('live_pattern_detections').update({ status: 'invalidated', updated_at: new Date().toISOString() }).in('id', toInvalidate);
  
  const now = new Date().toISOString();
  const toUpdate: any[] = [], toInsert: any[] = [];
  
  const nowMs = Date.now();

  for (const p of detectedPatterns) {
    const key = `${p.instrument}|${p.patternId}|${timeframe}`;
    const existing = existingMap.get(key);

    // Determine detection bar's open timestamp from bars or visualSpec
    const detectionBarTs = p.bars?.length
      ? (p.bars[p.bars.length - 1].date || p.bars[p.bars.length - 1].t)
      : p.visualSpec?.signalTs;
    const candleCloseMs = detectionBarTs ? getCandleCloseTime(detectionBarTs, timeframe) : 0;
    const barClosed = candleCloseMs > 0 && candleCloseMs <= nowMs;

    // Candle-close guard: skip NEW inserts when the detection bar hasn't closed yet
    if (!existing && !barClosed) {
      console.info(`[scan-live-patterns] Skipping unclosed-candle detection: ${key} (closeTime=${new Date(candleCloseMs).toISOString()})`);
      continue;
    }

    // Stamp detectionBarClosed into visual_spec
    const visualSpecWithFlag = p.visualSpec
      ? { ...p.visualSpec, detectionBarClosed: barClosed }
      : p.visualSpec;

    if (existing) {
      toUpdate.push({ id: existing.id, pattern: { ...p, visualSpec: visualSpecWithFlag }, key });
      patternKeys.set(key, new Date(existing.first_detected_at));
    } else {
      toInsert.push({
        instrument: p.instrument, pattern_id: p.patternId, pattern_name: p.patternName, direction: p.direction,
        timeframe, asset_type: assetType, first_detected_at: now, last_confirmed_at: now, status: 'active',
        entry_price: p.tradePlan.entry, stop_loss_price: p.tradePlan.stopLoss, take_profit_price: p.tradePlan.takeProfit,
        risk_reward_ratio: p.tradePlan.rr, visual_spec: visualSpecWithFlag, bars: p.bars,
        current_price: p.currentPrice, prev_close: p.prevClose, change_percent: p.changePercent,
        quality_score: p.quality?.score || 'B', quality_reasons: p.quality?.reasons || [],
        trend_alignment: p.trendAlignment, trend_indicators: p.trendIndicators || {},
        validation_status: 'pending', validation_layers_passed: ['bulkowski_engine'],
        exchange: p._exchange || null,
        _key: key,
      });
    }
  }
  
  if (toUpdate.length) {
    await Promise.allSettled(toUpdate.map(({ id, pattern }) =>
      supabase.from('live_pattern_detections').update({
        last_confirmed_at: now, current_price: pattern.currentPrice, prev_close: pattern.prevClose,
        change_percent: pattern.changePercent, bars: pattern.bars, visual_spec: pattern.visualSpec,
        trend_alignment: pattern.trendAlignment, trend_indicators: pattern.trendIndicators || {}, updated_at: now,
        // Recalculate trade plan on each re-confirmation so levels stay actionable
        entry_price: pattern.tradePlan.entry,
        stop_loss_price: pattern.tradePlan.stopLoss,
        take_profit_price: pattern.tradePlan.takeProfit,
        risk_reward_ratio: pattern.tradePlan.rr,
      }).eq('id', id)
    ));
  }
  
  // Track newly inserted IDs for pipeline validation
  const newlyInsertedIds: string[] = [];
  
  if (toInsert.length) {
    const insertData = toInsert.map(({ _key, ...d }) => d);
    const { data: inserted } = await supabase.from('live_pattern_detections').insert(insertData).select('id, instrument, pattern_id, first_detected_at');
    if (inserted) {
      for (const ins of inserted) {
        patternKeys.set(`${ins.instrument}|${ins.pattern_id}|${timeframe}`, new Date(ins.first_detected_at));
        newlyInsertedIds.push(ins.id);
      }
    }
  }
  
  // Trigger async pipeline validation for newly inserted patterns
  if (newlyInsertedIds.length > 0) {
    const validationPromise = triggerPipelineValidation(supabase, newlyInsertedIds, detectedPatterns, toInsert, 'live');
    // @ts-ignore - EdgeRuntime.waitUntil is available in Supabase Edge Functions
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(validationPromise);
    }
    // Don't await — validation runs in background
  }
  
  return patternKeys;
}

// Pipeline validation: sends newly detected patterns to validate-pattern-context
async function triggerPipelineValidation(
  supabase: any, 
  insertedIds: string[], 
  allDetected: any[], 
  insertedRecords: any[],
  source: 'live' | 'historical'
) {
  try {
    // Build detection inputs from the inserted records
    const detections = insertedIds.map((id, idx) => {
      const record = insertedRecords[idx];
      if (!record) return null;
      
      // Find the matching detected pattern to get bars
      const matchingPattern = allDetected.find(
        p => p.instrument === record.instrument && p.patternId === record.pattern_id
      );
      
      if (!matchingPattern?.bars?.length) return null;
      
      return {
        detection_id: id,
        detection_source: source,
        pattern_name: record.pattern_id,
        direction: record.direction === 'long' ? 'bullish' : record.direction === 'short' ? 'bearish' : record.direction,
        entry_price: record.entry_price,
        stop_loss_price: record.stop_loss_price,
        take_profit_price: record.take_profit_price,
        symbol: record.instrument,
        timeframe: record.timeframe,
        bars: matchingPattern.bars,
        quality_score: record.quality_score,
        trend_alignment: record.trend_alignment,
      };
    }).filter(Boolean);
    
    if (!detections.length) {
      console.info('[pipeline] No valid detections to validate');
      return;
    }
    
    console.info(`[pipeline] Sending ${detections.length} detections to validate-pattern-context`);
    
    const { data, error } = await supabase.functions.invoke('validate-pattern-context', {
      body: { detections }
    });
    
    if (error) {
      console.error('[pipeline] Validation invoke error:', error);
    } else {
      console.info(`[pipeline] Validation complete:`, data?.summary);
    }
  } catch (err) {
    console.error('[pipeline] Validation failed:', err);
  }
}

async function readCachedPatternsFromDb(
  supabase: any,
  assetType: string,
  timeframe: string,
  allowedPatterns: string[],
  limit: number,
  maxTickers: number,
  includeDetails: boolean,
  topNWithBars: number = 0,
  rrTier: RRTier = DEFAULT_RR_TIER, // R:R tier for stats aggregation
) {
  try {
    const instruments = getInstrumentsForTier(assetType, maxTickers);
    // Extend staleness window to 24 hours for reliability - patterns don't change that fast on daily timeframe
    const twentyFourHoursAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7-day window to serve cached patterns during seeding gaps
    
    // IMPORTANT: Large JSON payloads (bars, visual_spec) can cause client timeouts.
    // For the screener list we allow a lightweight response to keep loads <1s.
    // However, we now support embedding bars for topNWithBars patterns for instant chart loading.
    const selectColumns = includeDetails
      ? '*'
      : [
          'id',
          'instrument',
          'pattern_id',
          'pattern_name',
          'direction',
          'first_detected_at',
          'entry_price',
          'stop_loss_price',
          'take_profit_price',
          'risk_reward_ratio',
          'current_price',
          'prev_close',
          'change_percent',
          'quality_score',
          'quality_reasons',
          'trend_alignment',
          'trend_indicators',
          'historical_performance',
          'last_confirmed_at',
        ].join(',');

    // Circuit breaker check before expensive DB read
    if (isDbCircuitOpen()) {
      console.warn('[scan-live-patterns] DB circuit breaker OPEN, skipping cache read');
      return null;
    }

    const fetchCached = async () => {
      // First try active patterns within the time window
      const { data: activePatterns, error } = await supabase.from('live_pattern_detections').select(selectColumns)
        .eq('asset_type', assetType).eq('timeframe', timeframe).eq('status', 'active')
        .in('pattern_id', allowedPatterns).in('instrument', instruments)
        .gte('last_confirmed_at', twentyFourHoursAgo).order('last_confirmed_at', { ascending: false }).limit(limit);
      
      if (error) throw new Error(error.message);

      // If active patterns found, return them
      if (activePatterns?.length) return activePatterns;

      // Fallback: serve recently-expired patterns when detector hasn't run recently.
      // This prevents a blank screener during seeding gaps (patterns are still valid signals
      // even if not re-confirmed today).
      console.info(`[scan-live-patterns] No active patterns for ${assetType}, falling back to recent expired patterns`);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: expiredPatterns, error: expiredError } = await supabase.from('live_pattern_detections').select(selectColumns)
        .eq('asset_type', assetType).eq('timeframe', timeframe).in('status', ['expired', 'active'])
        .in('pattern_id', allowedPatterns).in('instrument', instruments)
        .gte('last_confirmed_at', sevenDaysAgo).order('last_confirmed_at', { ascending: false }).limit(limit);
      
      if (expiredError) throw new Error(expiredError.message);
      return expiredPatterns || [];
    };

    const cachedPatterns = await withRetry(fetchCached, 1, 500);
    
    if (!cachedPatterns) {
      console.error('[scan-live-patterns] DB cache read returned null after retry');
      return null;
    }
    
    // Always return cached data if available, even if empty
    if (!cachedPatterns?.length) {
      // Check if we have ANY active data for this asset type (not just any updated row)
      const { data: anyActive } = await supabase.from('live_pattern_detections').select('last_confirmed_at')
        .eq('asset_type', assetType).eq('timeframe', timeframe).eq('status', 'active').limit(1);
      if (anyActive?.length) {
        return { patterns: [], instrumentsScanned: instruments.length, isFresh: true };
      }
      // No active data - trigger background scan but still return empty for fast response
      console.info('[scan-live-patterns] No cached data, returning empty and triggering background scan');
      return { patterns: [], instrumentsScanned: instruments.length, isFresh: true, needsBackgroundScan: true };
    }
    
    // If we need bars for top N patterns AND not including details for all, fetch them separately
    // This is a targeted query for just the IDs we need, much faster than fetching all
    let topPatternBars: Map<string, { bars: any[]; visualSpec: any }> = new Map();
    if (!includeDetails && topNWithBars > 0) {
      const topIds = cachedPatterns.slice(0, topNWithBars).map((r: any) => r.id);
      if (topIds.length > 0) {
        const { data: topData } = await supabase
          .from('live_pattern_detections')
          .select('id, bars, visual_spec')
          .in('id', topIds);
        
        if (topData) {
          for (const row of topData) {
            topPatternBars.set(row.id, {
              bars: row.bars || [],
              visualSpec: row.visual_spec || {},
            });
          }
          console.info(`[scan-live-patterns] Fetched bars for top ${topPatternBars.size} patterns (instant chart load)`);
        }
      }
    }
    
    const nowIso = new Date().toISOString();
    let patterns = cachedPatterns.map((r: any, index: number) => {
      const signalTs = r.first_detected_at || nowIso;
      
      // Check if this pattern is in the top N that got pre-fetched bars
      const preloadedData = topPatternBars.get(r.id);
      const hasBars = preloadedData || includeDetails;
      
      return {
        // Stable DB identifier for lazy-detail fetching
        dbId: r.id,
        instrument: r.instrument,
        patternId: r.pattern_id,
        patternName: r.pattern_name,
        direction: r.direction as 'long' | 'short',
        signalTs,
        quality: { score: r.quality_score || 'B', reasons: r.quality_reasons || [] },
        tradePlan: {
          entryType: 'bar_close',
          entry: r.entry_price,
          stopLoss: r.stop_loss_price,
          takeProfit: r.take_profit_price,
          rr: r.risk_reward_ratio,
        },
        // Include bars if: includeDetails=true OR this is a top N pattern with preloaded data
        bars: hasBars 
          ? (preloadedData?.bars || r.bars || [])
          : [],
        visualSpec: hasBars
          ? (preloadedData?.visualSpec || r.visual_spec || {})
          : {
              version: '2.0.0',
              symbol: r.instrument,
              timeframe,
              patternId: r.pattern_id,
              signalTs,
              window: { startTs: signalTs, endTs: signalTs },
              yDomain: { min: r.entry_price ?? 0, max: r.entry_price ?? 0 },
              overlays: [],
              pivots: [],
            },
        currentPrice: r.current_price,
        prevClose: r.prev_close,
        changePercent: r.change_percent,
        trendAlignment: r.trend_alignment,
        trendIndicators: r.trend_indicators,
        historicalPerformance: r.historical_performance || undefined,
      };
    });
    
    // FAST PATH OPTIMIZATION: Skip stats enrichment if all patterns already have valid cached stats
    // This dramatically reduces response time by avoiding the expensive historical_pattern_occurrences query
    const patternsNeedingStats = patterns.filter((p: any) => isStatsSuspect(p.historicalPerformance));
    
    if (patternsNeedingStats.length === 0) {
      // All patterns have valid cached stats - return immediately (< 200ms)
      console.info(`[scan-live-patterns] Ultra-fast path: all ${patterns.length} patterns have valid cached stats`);
      return { patterns, instrumentsScanned: instruments.length, isFresh: true };
    }
    
    // Only enrich patterns that are missing stats (not all of them)
    const pairsToEnrich = patternsNeedingStats.map((p: any) => ({ 
      patternId: p.patternId, 
      symbol: p.instrument,
      dbId: p.dbId 
    }));
    console.info(`[scan-live-patterns] Enriching ${pairsToEnrich.length}/${patterns.length} patterns with per-asset stats (${patterns.length - pairsToEnrich.length} already cached)`);

    if (pairsToEnrich.length) {
      const stats = await fetchPatternSymbolStats(supabase, pairsToEnrich, timeframe, rrTier);
      console.info(`[scan-live-patterns] Per-asset stats enrichment returned ${stats.size} entries (rrTier=${rrTier})`);

      // Track which DB rows should be updated so future fast-path calls are instant.
      const updatesToPerform: Array<{ id: string; hp: any | null }> = [];

      let enrichedCount = 0;
      let clearedCount = 0;
      patterns = patterns.map((p: any) => {
        // Skip patterns that already have valid stats
        if (!isStatsSuspect(p.historicalPerformance)) {
          return p;
        }
        
        const key = getStatsKey(p.patternId, p.instrument, timeframe, rrTier);
        const s = stats.get(key);
        
        // If we couldn't compute fresh per-symbol stats:
        // - Keep a non-suspect cached value (prevents Win% from showing as "—")
        // - Otherwise clear suspect fallbacks and omit
        if (!s) {
        // Keep existing historicalPerformance if present (even if suspect),
          // so the background scorer (score-agent-detections) can apply its own fallback chain.
          // Only truly null values will be left for the scorer's Bayesian prior.
          return p;
        }

        enrichedCount++;
        const hp = toHistoricalPerformance(s);
        
        // Backfill DB so future requests skip enrichment entirely
        if (p.dbId) {
          updatesToPerform.push({ id: p.dbId, hp });
        }

        return { ...p, historicalPerformance: hp };
      });

      // Best-effort DB backfill/clear of stats (keeps future responses fast).
      // Use EdgeRuntime.waitUntil to not block the response
      if (updatesToPerform.length) {
        const updatePromise = Promise.allSettled(
          updatesToPerform.map(({ id, hp }) => 
            supabase
              .from('live_pattern_detections')
              .update({ historical_performance: hp })
              .eq('id', id)
          )
        );
        
        // @ts-ignore - EdgeRuntime.waitUntil is available in Supabase Edge Functions
        if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
          EdgeRuntime.waitUntil(updatePromise);
        } else {
          await updatePromise;
        }
      }

      console.info(`[scan-live-patterns] Enriched ${enrichedCount}/${pairsToEnrich.length} patterns, cleared ${clearedCount} stale fallbacks`);
    }
    console.info(`[scan-live-patterns] Fast path: returned ${patterns.length} cached patterns for ${assetType}`);
    return { patterns, instrumentsScanned: instruments.length, isFresh: true };
  } catch (err: any) {
    console.error('[scan-live-patterns] DB cache error:', err.message);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const url = new URL(req.url);
    let limit = parseInt(url.searchParams.get('limit') || '30');
    let timeframe = url.searchParams.get('timeframe') || '1d';
    let assetType = url.searchParams.get('assetType') || 'fx';
    let maxTickers = parseInt(url.searchParams.get('maxTickers') || '25');
    let allowedPatterns: string[] = BASE_PATTERNS;
    let forceRefresh = false;
    let includeDetails = true;
    let topNWithBars = 0; // Embed bars for first N patterns for instant chart loading
    let rrTier: RRTier = DEFAULT_RR_TIER; // R:R tier for stats aggregation
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.limit) limit = parseInt(body.limit);
        if (body.timeframe) timeframe = body.timeframe;
        if (body.assetType) assetType = body.assetType;
        if (body.maxTickers) maxTickers = parseInt(body.maxTickers);
        if (body.allowedPatterns?.length) allowedPatterns = body.allowedPatterns;
        if (body.forceRefresh) forceRefresh = true;
        if (typeof body.includeDetails === 'boolean') includeDetails = body.includeDetails;
        if (typeof body.topNWithBars === 'number') topNWithBars = Math.min(body.topNWithBars, 15);
        if (body.rrTier && [2, 3, 4, 5].includes(body.rrTier)) rrTier = body.rrTier as RRTier;
      } catch {}
    }
    // Also check query params for rrTier
    const rrTierParam = url.searchParams.get('rrTier');
    if (rrTierParam && [2, 3, 4, 5].includes(parseInt(rrTierParam))) {
      rrTier = parseInt(rrTierParam) as RRTier;
    }
    
    const instruments = getInstrumentsForTier(assetType, maxTickers);
    const assetMap: Record<string, number> = { fx: ALL_INSTRUMENTS.fx.length, crypto: ALL_INSTRUMENTS.crypto.length, stocks: ALL_INSTRUMENTS.stocks.length, commodities: ALL_INSTRUMENTS.commodities.length, indices: ALL_INSTRUMENTS.indices.length, etfs: ALL_INSTRUMENTS.etfs.length };
    const totalInUniverse = assetMap[assetType] || instruments.length;
    const patternsToScan = ALL_PATTERNS.filter(p => allowedPatterns.includes(p));
    const extendedToScan = [...EXTENDED_PATTERNS, ...PREMIUM_PATTERNS].filter(p => allowedPatterns.includes(p));
    const allPatternsToScan = [...patternsToScan, ...extendedToScan];
    
    // FAST PATH - Only use DB cache when NOT forcing refresh (normal user requests)
    if (!forceRefresh) {
      const dbCached = await readCachedPatternsFromDb(
        supabase,
        assetType,
        timeframe,
        allPatternsToScan,
        limit,
        maxTickers,
        includeDetails,
        topNWithBars,
        rrTier, // Pass R:R tier for stats
      );
      if (dbCached) {
        console.info(`[scan-live-patterns] Fast path success: ${dbCached.patterns.length} patterns`);
        return new Response(JSON.stringify({ 
          success: true, 
          patterns: dbCached.patterns, 
          scannedAt: new Date().toISOString(), 
          instrumentsScanned: dbCached.instrumentsScanned, 
          totalInUniverse, 
          assetType, 
          marketOpen: isMarketOpen(assetType), 
          source: 'db_cache' 
        }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } 
        });
      }
    } else {
      console.info(`[scan-live-patterns] forceRefresh=true, bypassing fast path for ${assetType}@${timeframe}`);
    }
    
    // Only proceed to slow path if forceRefresh is explicitly requested (cron job only)
    if (!forceRefresh) {
      console.info('[scan-live-patterns] No cache, returning empty without slow path');
      return new Response(JSON.stringify({ 
        success: true, 
        patterns: [], 
        scannedAt: new Date().toISOString(), 
        instrumentsScanned: instruments.length, 
        totalInUniverse, 
        assetType, 
        marketOpen: isMarketOpen(assetType), 
        source: 'no_cache' 
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.info('[scan-live-patterns] forceRefresh=true, proceeding to slow path scan');
    
    // MEMORY CACHE (only for slow path)
    const cacheKey = `${assetType}:${timeframe}:${maxTickers}:${allowedPatterns.sort().join(',')}`;
    const cached = scanCache.get(cacheKey);
    const cacheTtl = assetType === 'commodities' ? CACHE_TTL_MS_SLOW : CACHE_TTL_MS;
    if (cached && Date.now() - cached.timestamp < cacheTtl) {
      return new Response(JSON.stringify(cached.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' } });
    }
    
    // SLOW PATH - Live scan
    const endDate = new Date();
    const startDate = new Date();
    // Use the minimum lookback needed for detection + trend alignment to keep scans under runtime limits.
    // 15m and 1h need ~15d (60 days for 200 bar trend); 4h needs ~45d; daily needs ~400d for 200 bars; weekly needs ~5y for 200 bars.
    const lookbackDays = timeframe === '15m'
      ? 15
      : timeframe === '1h' || timeframe === '4h'
        ? 45
        : timeframe === '1wk'
          ? 365 * 5
          : 400;
    startDate.setDate(startDate.getDate() - lookbackDays);
    console.log(`[scan-live-patterns] Slow path: fetching data for ${instruments.length} instruments, timeframe=${timeframe}`);
    const instrumentDataMap = await fetchDataBatchWithDbFallback(supabase, instruments, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], timeframe, 25);
    
    console.log(`[scan-live-patterns] Data fetched for ${instrumentDataMap.size} instruments`);
    const instrumentsWithData = [...instrumentDataMap.entries()].filter(([, bars]) => bars.length >= 20);
    console.log(`[scan-live-patterns] Instruments with >=20 bars: ${instrumentsWithData.length}`);
    
    // Lookup exchange for each instrument from the instruments table
    let instrumentExchangeMap: Map<string, string> | null = null;
    try {
      const { data: exchData } = await supabase.from('instruments').select('symbol, exchange').in('symbol', instruments);
      if (exchData) {
        instrumentExchangeMap = new Map(exchData.map((r: any) => [r.symbol, r.exchange]));
      }
    } catch (e) {
      console.warn('[scan-live-patterns] Exchange lookup failed, continuing without:', e);
    }
    
    const detectedPatterns: any[] = [];
    for (const instrument of instruments) {
      const bars = instrumentDataMap.get(instrument);
      if (!bars || bars.length < 20) continue;
      
      for (const patternId of allPatternsToScan) {
        const pattern = PATTERN_REGISTRY[patternId];
        if (!pattern) continue;
        const detectionResult = pattern.detector(bars.slice(-20), timeframe);
        if (!detectionResult.detected) continue;
        
        // Use detector-returned direction for neutral patterns (e.g. symmetrical triangle), otherwise use config direction
        const effectiveDirection: 'long' | 'short' = detectionResult.detectedDirection || pattern.direction;
        
        const lastBar = bars[bars.length - 1];
        const atr = calculateATR(bars, 14);
        const bracketLevels = computeBracketLevels({ direction: effectiveDirection, entryPrice: lastBar.close, stopPercent: (atr / lastBar.close) * 100 * 2, targetPercent: (atr / lastBar.close) * 100 * 4, atr, atrMultiplier: 2.0, stopLossMethod: 'atr', takeProfitMethod: 'ratio', instrument });
        
        const visualBars = bars.slice(-60);
        const compressedBars = visualBars.map(b => ({ t: b.date, o: +b.open.toFixed(6), h: +b.high.toFixed(6), l: +b.low.toFixed(6), c: +b.close.toFixed(6), v: b.volume || 0 }));
        const allLows = visualBars.map(b => b.low), allHighs = visualBars.map(b => b.high);
        const minPrice = Math.min(...allLows, bracketLevels.stopLossPrice, bracketLevels.takeProfitPrice, lastBar.close);
        const maxPrice = Math.max(...allHighs, bracketLevels.stopLossPrice, bracketLevels.takeProfitPrice, lastBar.close);
        
        const windowOffset = bars.length - 20, visualOffset = bars.length - 60;
        const pivotsWithTs = detectionResult.pivots.map(pivot => {
          const absIdx = windowOffset + pivot.index;
          const visIdx = absIdx - visualOffset;
          return { ...pivot, index: Math.max(0, visIdx), timestamp: bars[absIdx]?.date || lastBar.date };
        }).filter(p => p.index >= 0 && p.index < visualBars.length);

        // Assign structural roles to pivots based on pattern type
        const pivotsWithRoles = assignPivotRoles(pivotsWithTs, patternId);
        
        const visualSpec = { version: '2.0.0', symbol: instrument, timeframe, patternId, signalTs: lastBar.date, window: { startTs: visualBars[0]?.date, endTs: visualBars[visualBars.length - 1]?.date }, yDomain: { min: minPrice * 0.97, max: maxPrice * 1.03 }, overlays: [{ type: 'hline', id: 'entry', price: lastBar.close, label: 'Entry', style: 'primary' }, { type: 'hline', id: 'sl', price: bracketLevels.stopLossPrice, label: 'Stop', style: 'destructive' }, { type: 'hline', id: 'tp', price: bracketLevels.takeProfitPrice, label: 'Target', style: 'positive' }], pivots: pivotsWithRoles };
        
        const prevBar = bars.length >= 2 ? bars[bars.length - 2] : null;
        const changePercent = prevBar?.close ? ((lastBar.close - prevBar.close) / prevBar.close) * 100 : null;
        
        let trendAlignment: string | null = null, trendIndicators: any = null;
        if (bars.length >= 200) {
          const computed = safeComputeTrend(bars, effectiveDirection);
          trendAlignment = computed.trendAlignment;
          trendIndicators = computed.trendIndicators;
        }
        
        // MTF confirmation lookup
        const TIMEFRAME_LADDER = ['1h', '4h', '8h', '1d', '1w'];
        const currentTFIndex = TIMEFRAME_LADDER.indexOf(timeframe);
        const higherTF = currentTFIndex >= 0 && currentTFIndex < TIMEFRAME_LADDER.length - 1
          ? TIMEFRAME_LADDER[currentTFIndex + 1] : null;
        let mtfConfirmed = false;
        if (higherTF) {
          const { data: mtfDetection } = await supabaseService
            .from('live_pattern_detections')
            .select('id')
            .eq('instrument', instrument)
            .eq('pattern_id', patternId)
            .eq('timeframe', higherTF)
            .eq('direction', effectiveDirection)
            .gte('detected_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .limit(1)
            .maybeSingle();
          mtfConfirmed = !!mtfDetection;
        }

        // Calculate professional-grade quality score using Phase 1 enhanced scorer
        const qualityScorerInput: PatternQualityScorerInput = {
          bars: bars.map(b => ({
            date: b.date,
            open: b.open,
            high: b.high,
            low: b.low,
            close: b.close,
            volume: b.volume || 0
          })),
          patternType: patternId,
          patternStartIndex: Math.max(0, bars.length - 20),
          patternEndIndex: bars.length - 1,
          direction: effectiveDirection,
          entryPrice: lastBar.close,
          stopLoss: bracketLevels.stopLossPrice,
          takeProfit: bracketLevels.takeProfitPrice,
          atr,
          trendIndicators: trendIndicators || undefined,
          mtfConfirmed,
          mtfTimeframe: mtfConfirmed && higherTF ? higherTF : undefined,
          touchCount: detectionResult.touchCount,
          leftShoulderPrice: detectionResult.leftShoulderPrice,
          rightShoulderPrice: detectionResult.rightShoulderPrice,
          headPrice: detectionResult.headPrice,
          // historicalPerformance will be added after stats enrichment
        };
        
        const qualityResult = calculatePatternQualityScore(qualityScorerInput);
        
        detectedPatterns.push({ 
          instrument, 
          patternId, 
          patternName: pattern.displayName, 
          direction: effectiveDirection, 
          quality: { 
            score: qualityResult.grade, 
            numericScore: qualityResult.score,
            confidence: qualityResult.confidence,
            reasons: qualityResult.factors.filter(f => f.passed).map(f => f.description),
            warnings: qualityResult.warnings,
            tradeable: qualityResult.tradeable,
            factors: qualityResult.factors
          }, 
          tradePlan: { 
            entryType: 'bar_close', 
            entry: lastBar.close, 
            stopLoss: bracketLevels.stopLossPrice, 
            takeProfit: bracketLevels.takeProfitPrice, 
            rr: bracketLevels.riskRewardRatio 
          }, 
          bars: compressedBars, 
          visualSpec, 
          currentPrice: lastBar.close, 
          prevClose: prevBar?.close, 
          changePercent: changePercent != null ? +changePercent.toFixed(2) : null, 
          trendAlignment, 
          trendIndicators,
          _exchange: instrumentExchangeMap?.get(instrument) || null,
        });
      }
    }
    
    // Enrich missing trend data
    const needTrend = [...new Set(detectedPatterns.filter(p => !p.trendAlignment).map(p => p.instrument))];
    if (needTrend.length) {
      const trendBars = await fetchDataBatchWithDbFallback(supabase, needTrend, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], timeframe, 6, 200);
      for (const p of detectedPatterns) {
        if (p.trendAlignment) continue;
        const fullBars = trendBars.get(p.instrument);
        if (fullBars?.length >= 200) Object.assign(p, safeComputeTrend(fullBars, p.direction));
      }
    }
    
    const patternTimestamps = await persistPatterns(supabase, detectedPatterns, assetType, timeframe);
    
    // Fetch per-(pattern, symbol) stats for unique ROI per asset
    const patternSymbolPairs = detectedPatterns.map(p => ({ patternId: p.patternId, symbol: p.instrument }));
    const patternStats = await fetchPatternSymbolStats(supabase, patternSymbolPairs, timeframe, rrTier);
    console.info(`[scan-live-patterns] Slow path: per-asset patternStats size=${patternStats.size}, detected=${detectedPatterns.length}, rrTier=${rrTier}`);
    
    // Fetch Edge Atlas aggregate stats for repeatability gate
    const uniquePatternIds = [...new Set(detectedPatterns.map(p => p.patternId))];
    const repeatabilityStats = await fetchRepeatabilityStats(supabase, uniquePatternIds, timeframe, assetType);
    
    let statsAttachedCount = 0;
    let repeatabilityAppliedCount = 0;
    const setups = detectedPatterns.slice(0, limit).map(pattern => {
      const key = `${pattern.instrument}|${pattern.patternId}|${timeframe}`;
      const firstDetectedAt = patternTimestamps.get(key);
      const statsKey = getStatsKey(pattern.patternId, pattern.instrument, timeframe, rrTier);
      const stats = patternStats.get(statsKey);
      if (stats) statsAttachedCount++;
      
      // Apply repeatability gate: re-score with Edge Atlas proof
      const edgeAtlas = repeatabilityStats.get(pattern.patternId);
      if (edgeAtlas) {
        repeatabilityAppliedCount++;
        const rescoredInput: PatternQualityScorerInput = {
          bars: pattern.bars?.map((b: any) => ({ date: b.t || b.date, open: b.o ?? b.open, high: b.h ?? b.high, low: b.l ?? b.low, close: b.c ?? b.close, volume: b.v ?? b.volume ?? 0 })) || [],
          patternType: pattern.patternId,
          patternStartIndex: Math.max(0, (pattern.bars?.length || 20) - 20),
          patternEndIndex: (pattern.bars?.length || 1) - 1,
          direction: pattern.direction,
          entryPrice: pattern.tradePlan.entry,
          stopLoss: pattern.tradePlan.stopLoss,
          takeProfit: pattern.tradePlan.takeProfit,
          atr: 0, // ATR not needed for re-grading, score structure is preserved
          trendIndicators: pattern.trendIndicators || undefined,
          repeatabilityProof: {
            sampleSize: edgeAtlas.total_trades,
            winRate: edgeAtlas.win_rate_pct,
            expectancyR: edgeAtlas.expectancy_r,
          },
        };
        const rescored = calculatePatternQualityScore(rescoredInput);
        // Update the quality object with gate-adjusted grade
        pattern.quality = {
          ...pattern.quality,
          score: rescored.grade,
          numericScore: rescored.score,
          confidence: rescored.confidence,
          reasons: rescored.factors.filter((f: any) => f.passed).map((f: any) => f.description),
          warnings: rescored.warnings,
          tradeable: rescored.tradeable,
          factors: rescored.factors,
        };
      }
      
      return { 
        ...pattern, 
        signalTs: firstDetectedAt?.toISOString() || pattern.visualSpec.signalTs, 
        visualSpec: { ...pattern.visualSpec, signalTs: firstDetectedAt?.toISOString() || pattern.visualSpec.signalTs }, 
        historicalPerformance: stats ? toHistoricalPerformance(stats) : undefined 
      };
    });
    console.info(`[scan-live-patterns] Repeatability gate applied to ${repeatabilityAppliedCount}/${setups.length} patterns`);
    console.info(`[scan-live-patterns] Slow path: attached per-asset stats to ${statsAttachedCount}/${setups.length} patterns`);
    
    // Persist gate-adjusted quality scores back to DB
    const gradeUpdates = setups
      .filter((s: any) => repeatabilityStats.has(s.patternId))
      .map((s: any) => {
        const key = `${s.instrument}|${s.patternId}|${timeframe}`;
        const ts = patternTimestamps.get(key);
        return ts ? { instrument: s.instrument, patternId: s.patternId, grade: s.quality?.score } : null;
      })
      .filter(Boolean);
    
    if (gradeUpdates.length) {
      Promise.allSettled(
        gradeUpdates.map((u: any) =>
          supabase.from('live_pattern_detections')
            .update({ quality_score: u.grade })
            .eq('instrument', u.instrument)
            .eq('pattern_id', u.patternId)
            .eq('timeframe', timeframe)
            .eq('status', 'active')
        )
      ).then(() => console.info(`[scan-live-patterns] Persisted ${gradeUpdates.length} gate-adjusted grades`))
       .catch(() => {});
    }
    
    const responseData = { success: true, patterns: setups, scannedAt: new Date().toISOString(), instrumentsScanned: instruments.length, totalInUniverse, assetType, marketOpen: isMarketOpen(assetType) };
    scanCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
    
    return new Response(JSON.stringify(responseData), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' } });
  } catch (error) {
    console.error('[scan-live-patterns] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
