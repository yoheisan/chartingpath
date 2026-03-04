

## Plan: Hybrid Instrument Search (Local DB + Live Yahoo Lookup)

### Current State
- `UniversalSymbolSearch` queries only the `instruments` table (817 pre-seeded rows)
- Adding tickers requires editing `screenerInstruments.ts` and running `seed-instruments`
- Users cannot discover or chart instruments outside the pre-seeded universe

### Approach
Build a two-tier search: local DB results first, then a live Yahoo Finance autocomplete fallback for any symbol not in the database. When a user selects a non-seeded result, auto-insert it into `instruments` so it becomes permanently searchable.

### Architecture

```text
User types "PLTR" in search
        │
        ▼
┌──────────────────────┐
│  1. Local DB query   │  ← instant, existing instruments table
│     (current logic)  │
└──────────┬───────────┘
           │ if < 5 results OR query length >= 2
           ▼
┌──────────────────────┐
│  2. Yahoo Search API │  ← edge function, debounced 300ms
│  (quotes/autocomplete)│
└──────────┬───────────┘
           │ merge & deduplicate
           ▼
┌──────────────────────┐
│  3. Display combined │  local results first, then "Web Results"
│     results          │  separator for Yahoo hits
└──────────┬───────────┘
           │ user clicks Yahoo result
           ▼
┌──────────────────────┐
│  4. Auto-upsert into │  ← instruments table, is_active=true
│     instruments      │  so it's local forever after
└──────────────────────┘
```

### Implementation Steps

**1. New Edge Function: `search-symbols`**
- Accepts `{ query: string }`, calls Yahoo Finance autocomplete endpoint (`https://query2.finance.yahoo.com/v1/finance/search?q=...`)
- Returns top 10 matches with symbol, name, exchange, asset type
- On user selection, upserts into `instruments` table so the ticker persists locally
- No new secrets needed (Yahoo search endpoint is unauthenticated)

**2. Update `UniversalSymbolSearch.tsx`**
- Add debounced (300ms) call to `search-symbols` when query length >= 2
- Merge Yahoo results below local results, deduplicated by symbol
- Show a "Web Results" section divider for non-local hits
- Mark web results with a subtle badge so users know these are live lookups
- On selection of a web result, call the edge function's upsert path before firing `onSelect`

**3. No database migration needed**
- The `instruments` table already supports upsert on `symbol` conflict
- New tickers auto-populate with exchange, asset_type, country, currency derived server-side (reusing logic from `seed-instruments`)

### Key Details

- **No compute/seeding impact**: On-demand lookups don't touch the seeding pipeline. The ticker just gets added to `instruments` for future local search
- **No pattern data**: Newly added tickers won't have historical pattern data or live scans until they're included in the scan universe. The search makes them chartable and researchable immediately
- **Rate limiting**: Yahoo autocomplete is lightweight and rate-limit-friendly. The 300ms debounce prevents excessive calls
- **Searchable universe becomes unbounded**: Users can find any Yahoo-supported ticker (~100,000+), while the seeded 817 remain the core for pattern scanning

### What This Does NOT Do
- It does not add tickers to the live scanning pipeline (that still requires `screenerInstruments.ts` updates)
- It does not seed historical data for newly discovered tickers
- Those are separate, opt-in expansions that can be built later (e.g., "Request scan for this ticker" button)

