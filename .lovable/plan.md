

# Long-Tail Asset/Pattern SEO Pages

## Goal
Create auto-generated, SEO-optimized landing pages for every instrument+pattern combination, targeting searches like "Bull Flag win rate on AAPL" or "Head and Shoulders BTCUSD statistics." This creates a massive moat of ~100K+ indexable pages built from existing `historical_pattern_occurrences` data.

## Architecture

```text
/patterns/:patternId/statistics           (existing -- pattern-level stats)
/patterns/:patternId/:instrument/statistics  (NEW -- instrument+pattern stats)
```

Each new page shows:
- KPI cards (win rate, expectancy, sample size, avg duration) for that specific instrument+pattern combo
- Timeframe breakdown table (reusing existing UI from PatternStatisticsPage)
- FAQ JSON-LD (e.g., "What is the Bull Flag win rate on AAPL?")
- Internal links to the pattern's global stats page, live screener, and Pattern Lab
- "Related instruments" grid linking to sibling instrument pages for the same pattern

## Implementation Steps

### 1. Database: Create a materialized view for fast queries
A migration to create `instrument_pattern_stats_mv` that pre-aggregates `historical_pattern_occurrences` by `(pattern_id, symbol, timeframe)`. This avoids scanning millions of rows per page load. A DB function refreshes it periodically (can piggyback on existing cron).

Columns: `pattern_id`, `symbol`, `asset_type`, `timeframe`, `total_trades`, `wins`, `losses`, `win_rate_pct`, `expectancy_r`, `avg_rr`, `avg_bars`, `last_updated`.

### 2. Edge function: `get-instrument-pattern-stats`
Accepts `{ pattern_id, instrument }` and returns aggregated stats from the materialized view. Includes a `related_instruments` array (top 8 instruments with the most trades for this pattern).

### 3. New page: `InstrumentPatternStatsPage.tsx`
- Reuses the `KpiCard` component pattern from `PatternStatisticsPage`
- Dynamic `PageMeta` with title like "Bull Flag on AAPL -- Win Rate, Expectancy & Stats"
- `FAQPage` JSON-LD with instrument-specific questions and data-driven answers
- Canonical URL at `/patterns/bull-flag/AAPL/statistics`
- Breadcrumb: Home > Edge Atlas > Bull Flag Stats > AAPL
- "Related Instruments" grid linking to other instrument pages
- CTA buttons: "View Live Signals" (screener), "Backtest This" (Pattern Lab pre-filled)

### 4. Route registration in `App.tsx`
Add route: `/patterns/:patternId/:instrument/statistics`

### 5. Sitemap expansion
Update the `sitemap` edge function to query the materialized view for all instrument+pattern combos with sufficient data (e.g., >= 10 trades) and include them in the XML sitemap.

### 6. Internal linking
- Add links from the existing `PatternStatisticsPage` breakdown rows to the instrument-specific pages
- Add links from the pattern auto-linker context where relevant

## Technical Details

### Materialized View SQL
```sql
CREATE MATERIALIZED VIEW instrument_pattern_stats_mv AS
SELECT
  pattern_id, pattern_name, symbol, asset_type, timeframe,
  COUNT(*) AS total_trades,
  COUNT(*) FILTER (WHERE outcome = 'hit_tp') AS wins,
  COUNT(*) FILTER (WHERE outcome = 'hit_sl') AS losses,
  ROUND((COUNT(*) FILTER (WHERE outcome='hit_tp'))::numeric / COUNT(*) * 100, 1) AS win_rate_pct,
  ROUND(AVG(COALESCE(risk_reward_ratio,2))::numeric, 2) AS avg_rr,
  ROUND(AVG(bars_to_outcome)::numeric, 1) AS avg_bars
FROM historical_pattern_occurrences
WHERE outcome IN ('hit_tp','hit_sl') AND bars_to_outcome IS NOT NULL
GROUP BY pattern_id, pattern_name, symbol, asset_type, timeframe
HAVING COUNT(*) >= 10;

CREATE UNIQUE INDEX ON instrument_pattern_stats_mv (pattern_id, symbol, timeframe);
```

Refresh function called by existing hourly cron:
```sql
CREATE OR REPLACE FUNCTION refresh_instrument_pattern_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY instrument_pattern_stats_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Edge Function Response Shape
```json
{
  "success": true,
  "instrument": "AAPL",
  "pattern_id": "bull-flag",
  "pattern_name": "Bull Flag",
  "breakdowns": [
    { "timeframe": "1d", "total_trades": 45, "wins": 28, "win_rate_pct": 62.2, "expectancy_r": 0.244, "avg_rr": 2.1, "avg_bars": 8.3 }
  ],
  "aggregates": { "total_trades": 120, "win_rate_pct": 58.3, "expectancy_r": 0.166 },
  "related_instruments": ["MSFT", "GOOGL", "TSLA", "AMZN", "META", "NVDA", "SPY", "QQQ"]
}
```

### SEO Impact Estimate
With ~8,500 instruments x 17 patterns, even filtering to combinations with >= 10 trades should yield thousands of unique, data-rich pages -- each targeting a distinct long-tail keyword that no competitor currently serves.

