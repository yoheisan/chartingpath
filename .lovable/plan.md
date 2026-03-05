

# Add ROT Column to Live Patterns Screener Page

## Problem
The ROT (Return on Time) column was added to the homepage teaser table (`TeaserSignalsTable.tsx`) and `PatternScreenerTable.tsx`, but was never added to the main screener page at `/patterns/live` (`LivePatternsPage.tsx`).

## Changes — Single file: `src/pages/LivePatternsPage.tsx`

### 1. Add ROT column header (between Exp. and Age)
Insert a new sortable `<TableHead>` for ROT with the same tooltip pattern used on the other tables ("Return on Time — R earned per bar of exposure. Higher = more capital-efficient.").

### 2. Add ROT sort key to `handleSort`
Add a `'rot'` sort key that sorts by `avgRMultiple / avgDurationBars`, with nulls sorted to bottom.

### 3. Add ROT data cell (between Exp. cell and Age cell)
Insert a `<TableCell>` that computes `avgRMultiple / avgDurationBars` from `setup.historicalPerformance`, showing the value in mono font with amber highlight when ROT ≥ 0.01, or "—" when data is unavailable.

### 4. Update colspan
The group header row uses `colSpan={7}` — update to `colSpan={8}` to account for the new column.

