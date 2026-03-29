/**
 * Shared 3-tier stats fallback logic for pattern historical performance.
 *
 * Tier 1: Per-symbol + pattern lookup against historical_pattern_occurrences
 * Tier 2: Cross-symbol pattern aggregate fallback
 * Tier 3: Bayesian prior (50% WR, 0 expectancy, n=10 virtual)
 *
 * Used by: scan-live-patterns, score-agent-detections
 */

// ── Bayesian prior constants ─────────────────────────────────────────────
export const BAYESIAN_PRIOR_WIN_RATE = 0.50;
export const BAYESIAN_PRIOR_EXPECTANCY = 0;
export const BAYESIAN_VIRTUAL_SAMPLE = 10;

const MIN_USABLE_SAMPLE = 5;

export type StatsSource = "per_symbol" | "pattern_aggregate" | "bayesian_prior";

export interface PatternStatsResult {
  winRate: number;
  expectancy: number;
  sampleSize: number;
  source: StatsSource;
}

/**
 * Fetch historical stats for a single (patternId, symbol) combo using the
 * 3-tier fallback chain:
 *   1. Per-symbol exact match
 *   2. Cross-symbol pattern aggregate
 *   3. Bayesian prior
 *
 * @param rrTier - R:R tier (2 = baseline outcome column, 3-5 use outcome_rr{N})
 */
export async function fetchPatternStats(
  supabase: any,
  patternId: string,
  symbol: string,
  timeframe: string,
  rrTier: number = 2
): Promise<PatternStatsResult> {
  const outcomeCol = rrTier === 2 ? "outcome" : `outcome_rr${rrTier}`;
  const pnlCol = rrTier === 2 ? "outcome_pnl_percent" : `outcome_pnl_percent_rr${rrTier}`;

  // ── Tier 1: Per-symbol + pattern exact match ───────────────────────────
  try {
    const { data, error } = await supabase
      .from("historical_pattern_occurrences")
      .select(`${outcomeCol}, ${pnlCol}`)
      .eq("symbol", symbol)
      .eq("pattern_id", patternId)
      .in(outcomeCol, ["hit_tp", "hit_sl"])
      .limit(2000);

    if (!error && data?.length) {
      const { wins, total, pnlSum } = aggregateOutcomes(data, outcomeCol, pnlCol);
      if (total >= MIN_USABLE_SAMPLE) {
        return {
          winRate: Math.round((wins / total) * 1000) / 10,
          expectancy: Math.round((pnlSum / total / 100) * 100) / 100,
          sampleSize: total,
          source: "per_symbol",
        };
      }
    }
  } catch (err: any) {
    console.warn(`[statsEnrichment] Tier 1 error ${symbol}/${patternId}:`, err.message);
  }

  // ── Tier 2: Cross-symbol pattern aggregate ─────────────────────────────
  try {
    const { data, error } = await supabase
      .from("historical_pattern_occurrences")
      .select(`${outcomeCol}, ${pnlCol}`)
      .eq("pattern_id", patternId)
      .in(outcomeCol, ["hit_tp", "hit_sl"])
      .limit(5000);

    if (!error && data?.length) {
      const { wins, total, pnlSum } = aggregateOutcomes(data, outcomeCol, pnlCol);
      if (total >= MIN_USABLE_SAMPLE) {
        return {
          winRate: Math.round((wins / total) * 1000) / 10,
          expectancy: Math.round((pnlSum / total / 100) * 100) / 100,
          sampleSize: total,
          source: "pattern_aggregate",
        };
      }
    }
  } catch (err: any) {
    console.warn(`[statsEnrichment] Tier 2 error ${patternId}:`, err.message);
  }

  // ── Tier 3: Bayesian prior ─────────────────────────────────────────────
  return {
    winRate: BAYESIAN_PRIOR_WIN_RATE,
    expectancy: BAYESIAN_PRIOR_EXPECTANCY,
    sampleSize: BAYESIAN_VIRTUAL_SAMPLE,
    source: "bayesian_prior",
  };
}

/**
 * Batch variant: fetch stats for multiple (patternId, symbol) combos.
 * Returns a Map keyed by "symbol||patternId".
 * Optimised to batch Tier 1 and Tier 2 queries where possible.
 */
export async function fetchPatternStatsBatch(
  supabase: any,
  items: Array<{ patternId: string; symbol: string }>,
  timeframe: string,
  rrTier: number = 2
): Promise<Map<string, PatternStatsResult>> {
  const results = new Map<string, PatternStatsResult>();
  if (!items.length) return results;

  const outcomeCol = rrTier === 2 ? "outcome" : `outcome_rr${rrTier}`;
  const pnlCol = rrTier === 2 ? "outcome_pnl_percent" : `outcome_pnl_percent_rr${rrTier}`;

  const uniquePatternIds = [...new Set(items.map((i) => i.patternId))];
  const uniqueSymbols = [...new Set(items.map((i) => i.symbol))];

  // ── Tier 1 batch: per-symbol lookup ────────────────────────────────────
  try {
    const { data, error } = await supabase
      .from("historical_pattern_occurrences")
      .select(`pattern_id, symbol, ${outcomeCol}, ${pnlCol}`)
      .in("pattern_id", uniquePatternIds)
      .in("symbol", uniqueSymbols)
      .in(outcomeCol, ["hit_tp", "hit_sl"])
      .limit(5000);

    if (!error && data?.length) {
      const grouped = new Map<string, { wins: number; total: number; pnlSum: number }>();
      for (const row of data) {
        const key = `${row.symbol}||${row.pattern_id}`;
        if (!grouped.has(key)) grouped.set(key, { wins: 0, total: 0, pnlSum: 0 });
        const e = grouped.get(key)!;
        e.total++;
        if (row[outcomeCol] === "hit_tp") e.wins++;
        e.pnlSum += row[pnlCol] ?? 0;
      }

      for (const item of items) {
        const key = `${item.symbol}||${item.patternId}`;
        const e = grouped.get(key);
        if (e && e.total >= MIN_USABLE_SAMPLE) {
          results.set(key, {
            winRate: Math.round((e.wins / e.total) * 1000) / 10,
            expectancy: Math.round((e.pnlSum / e.total / 100) * 100) / 100,
            sampleSize: e.total,
            source: "per_symbol",
          });
        }
      }
    }
  } catch (err: any) {
    console.warn("[statsEnrichment] Batch Tier 1 error:", err.message);
  }

  // ── Tier 2 batch: pattern aggregate for unresolved items ───────────────
  const unresolved = items.filter((i) => !results.has(`${i.symbol}||${i.patternId}`));
  if (unresolved.length > 0) {
    const unresolvedPatternIds = [...new Set(unresolved.map((i) => i.patternId))];
    try {
      const { data, error } = await supabase
        .from("historical_pattern_occurrences")
        .select(`pattern_id, ${outcomeCol}, ${pnlCol}`)
        .in("pattern_id", unresolvedPatternIds)
        .in(outcomeCol, ["hit_tp", "hit_sl"])
        .limit(5000);

      if (!error && data?.length) {
        const grouped = new Map<string, { wins: number; total: number; pnlSum: number }>();
        for (const row of data) {
          if (!grouped.has(row.pattern_id)) grouped.set(row.pattern_id, { wins: 0, total: 0, pnlSum: 0 });
          const e = grouped.get(row.pattern_id)!;
          e.total++;
          if (row[outcomeCol] === "hit_tp") e.wins++;
          e.pnlSum += row[pnlCol] ?? 0;
        }

        for (const item of unresolved) {
          const key = `${item.symbol}||${item.patternId}`;
          if (results.has(key)) continue;
          const e = grouped.get(item.patternId);
          if (e && e.total >= MIN_USABLE_SAMPLE) {
            results.set(key, {
              winRate: Math.round((e.wins / e.total) * 1000) / 10,
              expectancy: Math.round((e.pnlSum / e.total / 100) * 100) / 100,
              sampleSize: e.total,
              source: "pattern_aggregate",
            });
          }
        }
      }
    } catch (err: any) {
      console.warn("[statsEnrichment] Batch Tier 2 error:", err.message);
    }
  }

  // ── Tier 3: Bayesian prior for anything still unresolved ───────────────
  for (const item of items) {
    const key = `${item.symbol}||${item.patternId}`;
    if (!results.has(key)) {
      results.set(key, {
        winRate: BAYESIAN_PRIOR_WIN_RATE,
        expectancy: BAYESIAN_PRIOR_EXPECTANCY,
        sampleSize: BAYESIAN_VIRTUAL_SAMPLE,
        source: "bayesian_prior",
      });
    }
  }

  const sources = { per_symbol: 0, pattern_aggregate: 0, bayesian_prior: 0 };
  for (const r of results.values()) sources[r.source]++;
  console.log(`[statsEnrichment] Batch results: ${JSON.stringify(sources)}`);

  return results;
}

// ── Helper ───────────────────────────────────────────────────────────────
function aggregateOutcomes(
  data: any[],
  outcomeCol: string,
  pnlCol: string
): { wins: number; total: number; pnlSum: number } {
  let wins = 0, total = 0, pnlSum = 0;
  for (const row of data) {
    const outcome = row[outcomeCol];
    if (outcome === "hit_tp" || outcome === "hit_sl") {
      total++;
      if (outcome === "hit_tp") wins++;
      pnlSum += row[pnlCol] ?? 0;
    }
  }
  return { wins, total, pnlSum };
}
