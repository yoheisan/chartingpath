

## Plan: Upgrade outcome count marketing copy

### Current state
- `useOutcomeCount` fetches total from `historical_pattern_occurrences` → currently returns 465,342 → displays as **"465K+"**
- Various components reference "labeled detections" or "backtested outcomes" inconsistently
- The number will keep growing as backfills continue — it may cross 500K or 1M soon

### Changes

**1. Round up the fallback in `useOutcomeCount.ts`**
- Change fallback from `'460K+'` to `'465K+'` (closer to real number while loading)

**2. Improve hero subheadline in `Index.tsx`**
- Current: "...real results from {outcomeCount} labeled detections. Not theory. Not Bulkowski. Our data."
- Proposed: "...win rates, R-multiples, and outcome data from {outcomeCount} pattern detections across FX and US equities. Not textbook stats — real data from our engine."

**3. Update MetricStrip label**
- Current label: "Backtested Outcomes"
- Proposed: "Labeled Outcomes" (more accurate — these are detected + tracked, not just backtested)

**4. Update `PageMeta` description in `Index.tsx`**
- Include the dynamic count with stronger phrasing: "{outcomeCount} labeled pattern outcomes across FX and US equities"

**5. Update OutcomeStatsStrip label**
- "Total patterns tracked" → "Total labeled outcomes" for consistency

### Files to edit
- `src/hooks/useOutcomeCount.ts` — update fallback
- `src/pages/Index.tsx` — hero copy and PageMeta
- `src/components/landing/MetricStrip.tsx` — label tweak
- `src/components/landing/OutcomeStatsStrip.tsx` — label tweak
- `src/i18n/locales/en.json` — update any affected i18n keys

### What stays the same
- The hook logic and query remain unchanged
- The formatting logic (K+/M+) stays as-is
- All other components already consuming `useOutcomeCount` will automatically reflect the live number

