

## Analysis: Pattern Performance Varies by Ticker

Yes — pattern results **absolutely differ** from ticker to ticker. Your `instrument_pattern_stats_mv` materialized view already proves this, storing per-instrument, per-pattern, per-timeframe win rates, expectancy, and sample sizes. A Double Bottom on AAPL may have a 62% win rate while the same pattern on TSLA shows 41%.

The Scripts page currently ignores this data entirely. Users configure patterns blindly without knowing which patterns actually work on their target instrument.

## Plan: Add "Edge Insights" Panel to Scripts Page

### What it does
When a user arrives at the Scripts page (especially from the Screener with a `symbol` param), show a data-driven panel that reveals which patterns have historically performed best on that instrument — helping them make smarter pattern selections for their script.

### Components

**1. Ticker Input (new, top of page)**
- Add a simple instrument search/select field at the top of the Scripts config
- Pre-fill from `symbol` or `instrument` URL param if present
- Optional — scripts still work without it, but the insights panel only appears when a ticker is selected

**2. "Edge Insights" Panel (new section, below pattern selector)**
- When a ticker is selected, query `instrument_pattern_stats_mv` for that symbol
- Display a compact table/card grid showing:
  - Pattern name, timeframe, win rate %, expectancy (R), sample size
  - Color-coded: green for positive expectancy, red for negative
  - Sort by expectancy descending
- One-click "Select Winners" button: auto-selects only patterns with positive expectancy and n≥10 trades
- One-click "Deselect Losers" button: removes patterns with negative expectancy

**3. Smart Pattern Badges (enhance existing pattern selector)**
- When ticker is set, overlay small badges on each pattern chip:
  - Green dot + "62% WR" if positive expectancy with sufficient data
  - Red dot + "38% WR" if negative expectancy
  - Grey "No data" if insufficient history
- Users can visually see which patterns have edge before selecting

### Data flow
```text
User enters ticker → query instrument_pattern_stats_mv
                   → aggregate across timeframes
                   → display insights + annotate pattern chips
                   → user clicks "Select Winners"
                   → only proven patterns feed into script generation
```

### Files to modify
- `src/pages/MemberScripts.tsx` — add ticker input, edge insights panel, smart badges
- Create `src/components/scripts/EdgeInsightsPanel.tsx` — the insights table component
- Reuse existing Supabase client to query `instrument_pattern_stats_mv` directly

### Scope
- No new edge functions needed — direct client query to the materialized view
- No schema changes — data already exists
- Estimated: ~3 files touched, medium effort

