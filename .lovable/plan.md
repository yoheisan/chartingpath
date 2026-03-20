

# Market Pulse Chart — Long vs Short (No Asset Breakdown)

## Rationale

Asset-level breakdown on the public landing page is biased due to uneven ticker coverage (474 stocks vs 28 commodities). FX shows only 5 active detections despite 99 tickers. Showing raw counts by asset would mislead visitors. Keep the landing page chart clean: total long vs short over 30 days.

## What We Build

A single stacked bar chart showing daily long vs short pattern detections across all asset types for the last 30 days.

### New file: `src/components/landing/MarketPulseChart.tsx`
- Query `live_pattern_detections` where `first_detected_at >= now() - 30 days`
- Aggregate client-side: group by date + direction → `{ date, long, short }[]`
- Recharts `BarChart` with stacked bars using existing `ChartContainer` / `ChartTooltip`
- Green for long, red for short
- Section header + subtitle with i18n keys
- Loading skeleton while data fetches

### Edit: `src/pages/Index.tsx`
- Import `MarketPulseChart`
- Place between `LivePatternPreview` and `SocialProof`

### Edit: `src/i18n/locales/en.json`
- Add 4 keys under `landing.marketPulse`: title, subtitle, long, short

## Result
A clean, unbiased visualization showing the market's directional pulse — how many bullish vs bearish patterns are being detected daily — without misleading asset-level comparisons.
