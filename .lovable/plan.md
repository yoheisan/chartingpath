

# Reposition Landing Page Value Proposition: Discovery → Validation

## Problem
High traffic (~180/day) but near-zero signups. Current messaging ("Find high-probability chart patterns before they break") competes head-on with TradingView on discovery. The actual moat — **320K+ backtested outcomes with win rates, expectancy, and quality grading** — is buried below the fold.

## Changes

### 1. Hero Section Rewrite (`src/pages/Index.tsx`)
- **Headline**: "Know if a pattern works — before you trade it" / "backed by 320,000+ real outcomes"
- **Subtitle**: Shift from "find patterns" to "validate with historical proof" — emphasize the data-backed edge
- **Primary CTA**: Keep "See Live Patterns Free" but add a secondary inline proof stat (e.g., live count of backtests run from DB)
- **Social proof line**: Replace generic "Used by traders in 20+ countries" with concrete metric: "320,000+ pattern outcomes analyzed"
- **Trust block**: Reword to emphasize data integrity: "Every signal backtested" / "Win rates shown upfront" / "No black-box indicators"
- **Mid-page CTA**: Change from "Ready to find your next setup?" to "See the data behind the pattern"

### 2. Add "Live Proof" Stat Above the Fold (`src/pages/Index.tsx`)
- Add a small inline proof element between headline and CTA showing a real aggregate stat (e.g., average win rate across all A-grade setups) fetched from Supabase
- Simple format: "A-grade setups average **62% win rate** across 320K+ trades"

### 3. TradingView Companion Positioning (`src/components/landing/HowItWorks.tsx`)
- Add a subtle tagline: "Works alongside TradingView — validate what you see on your charts"
- Reframe Step 1 from pure discovery to "Spot a pattern on your chart? Validate it here."

### 4. MetricStrip Enhancement (`src/components/landing/MetricStrip.tsx`)
- Replace "1h Refresh Cycle" (operational detail) with "Avg Win Rate" or "Backtests Run" — outcome-focused metrics that demonstrate the validation value

### 5. Translation Keys (`src/i18n/locales/en.json`)
- Update all changed hero/HowItWorks/MetricStrip keys with new copy
- Existing non-English locale files will pick up changes on next sync

### 6. SEO Meta Update (`src/pages/Index.tsx`)
- Update `<PageMeta>` title and description to lead with validation angle: "Validate chart patterns with 320K+ backtested outcomes"

## Files Modified
1. `src/pages/Index.tsx` — Hero copy, proof stat, meta, mid-page CTA
2. `src/components/landing/HowItWorks.tsx` — TradingView companion framing
3. `src/components/landing/MetricStrip.tsx` — Swap refresh metric for outcome metric
4. `src/i18n/locales/en.json` — Updated translation keys

