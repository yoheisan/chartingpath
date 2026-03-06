

# Efficient & Stable Dashboard Chart Loading Strategy

## Problem Analysis

The dashboard currently suffers from slow chart loading due to several compounding issues:

1. **Sequential waterfall fetches**: When `CommandCenterChart` mounts, it hits the DB first, finds insufficient data (e.g., 0 bars for ABBV on 15m), then sequentially tries EODHD (which returns 403/empty), then finally Yahoo — each with its own network round-trip.

2. **Redundant parallel requests**: `CommandCenterChart`, `DashboardPatternStudy`, and `MorningBriefing` all independently query Supabase on mount, creating 5+ concurrent requests before the chart even renders.

3. **No request deduplication across components**: Switching symbols triggers fresh fetches in both the chart AND the pattern study panel independently.

4. **Background revalidation competes with initial load**: The SWR logic in `CommandCenterChart` schedules a `setTimeout` revalidation at 1s that can conflict with still-loading initial data.

5. **60-second polling intervals** for `fetchAutoPatterns` adds unnecessary load.

6. **`minBarsRequired: 250` for daily timeframe** is too aggressive — the chart shows "no data" when the DB has 50–249 bars, forcing an external API call.

## Plan

### 1. Optimize `CommandCenterChart` fetch pipeline

**File**: `src/components/command-center/CommandCenterChart.tsx`

- **Lower `minBarsRequired` for 1d from 250 to 50** in `getChartDataLimits` — if the DB has 50+ daily bars, render them immediately instead of calling external APIs. This alone eliminates the slowest path for most symbols.
- **Skip EODHD for intraday timeframes** (15m, 1h) — EODHD consistently returns 403/empty for these. Go directly to Yahoo to save one network round-trip (~2-3s).
- **Add an `AbortController` + 8s timeout** on the initial external fetch (currently 15s) — if the first provider is slow, fail faster to the fallback.
- **Remove the 1-second background revalidation `setTimeout`** on cache hits — it triggers a DB query immediately after rendering, competing with other mount-time fetches. Replace with the existing 60s polling interval which already covers staleness.

### 2. Parallelize chart data + pattern fetch

**File**: `src/components/command-center/CommandCenterChart.tsx`

- Combine `fetchChartData` and `fetchAutoPatterns` into a single `useEffect` that runs them with `Promise.allSettled` instead of two separate effects. This prevents the pattern query from waiting for the chart data to complete.
- Move the 60s pattern poll to only start AFTER the initial fetch settles.

### 3. Defer `DashboardPatternStudy` fetch until panel opens

**File**: `src/components/command-center/CommandCenterLayout.tsx` + `DashboardPatternStudy.tsx`

- The study panel starts **collapsed** (`studyPanelCollapsed = true`), but `DashboardPatternStudy` still fires its `useEffect` fetch on mount because it's rendered in the DOM (just `hidden`).
- Add a `active` prop to `DashboardPatternStudy` tied to `!studyPanelCollapsed`. Skip the fetch when `active === false`. This eliminates 2 DB queries on initial dashboard load.

### 4. Smart provider routing in `fetchMarketBars`

**File**: `src/lib/fetchMarketBars.ts`

- For intraday intervals (15m, 1h), skip EODHD entirely for non-crypto symbols (it doesn't support them reliably). Call Yahoo directly.
- Add a simple in-memory "provider health" tracker: if a provider returned 0 bars or errors 3+ times in the last 5 minutes, skip it and go directly to the fallback. This implements the "max resilience" strategy with adaptive routing.

### 5. Reduce `minBarsRequired` thresholds

**File**: `src/config/dataCoverageContract.ts`

- Change `1d` `minBarsRequired` from `250` to `50`. Most symbols have 50+ daily bars seeded locally; the 250 threshold forces unnecessary external calls.
- Change `1wk` `minBarsRequired` from `100` to `30`.
- These changes mean the DB-first path succeeds far more often, avoiding external API latency entirely.

### 6. Stabilize `MorningBriefing` loading

**File**: `src/components/command-center/MorningBriefing.tsx`

- Increase the `localStorage` cache validity from 5 minutes to **15 minutes** for initial paint. The background auto-refresh at 5 minutes still runs, but the cached data renders instantly on mount without blocking.
- This ensures the briefing strip never shows skeletons on page reload within 15 minutes.

### 7. Configure `QueryClient` with sensible defaults

**File**: `src/main.tsx`

- Set `staleTime: 60_000` and `gcTime: 300_000` on the global `QueryClient` to prevent React Query from refetching on every component mount. Currently it uses defaults (staleTime: 0), meaning every mount triggers a refetch.

## Technical Details

```text
BEFORE (waterfall):
  Mount → MorningBriefing DB query (200ms)
        → CommandCenterChart DB query (200ms)
          → DB returns <250 bars → EODHD call (2-3s, returns empty)
            → Yahoo call (2-4s)
        → DashboardPatternStudy 2x DB queries (400ms)
        → fetchAutoPatterns 2x DB queries (400ms)
        → Background revalidation at 1s (200ms)
  Total: ~5-8 seconds, 8+ network requests

AFTER (parallel, optimized):
  Mount → MorningBriefing (from localStorage cache, 0ms)
        → CommandCenterChart DB query (200ms)
          → DB returns ≥50 bars → render immediately ✓
          → OR Yahoo direct (skip EODHD for intraday)
        → fetchAutoPatterns (parallel with chart, 200ms)
        → DashboardPatternStudy DEFERRED until panel opened
  Total: ~200-500ms for cached, ~2-3s for cache miss, 3-4 requests
```

## Files Modified

| File | Change |
|------|--------|
| `src/config/dataCoverageContract.ts` | Lower `minBarsRequired` for 1d (250→50), 1wk (100→30) |
| `src/components/command-center/CommandCenterChart.tsx` | Merge fetch effects, remove 1s revalidation, parallelize chart+patterns |
| `src/components/command-center/DashboardPatternStudy.tsx` | Add `active` prop, skip fetch when hidden |
| `src/components/command-center/CommandCenterLayout.tsx` | Pass `active={!studyPanelCollapsed}` to DashboardPatternStudy |
| `src/lib/fetchMarketBars.ts` | Skip EODHD for intraday non-crypto, add provider health tracking |
| `src/components/command-center/MorningBriefing.tsx` | Extend cache validity to 15min for instant paint |
| `src/main.tsx` | Set QueryClient staleTime/gcTime defaults |

