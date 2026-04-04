

# Fix Paper Trade Exit Price: 4-Layer Fallback Chain

## Problem
When closing trades manually, the system often can't find a live price and falls back to entry_price, producing 0R results.

## Solution Overview
Build a resilient 4-layer price resolution chain: Live Detections → Cached Trade Price → EODHD API → Manual Entry.

## Implementation

### Step 1: Database Migration
Add `latest_price` and `latest_price_at` columns to `paper_trades`, plus a partial index on open trades.

```sql
ALTER TABLE paper_trades 
  ADD COLUMN IF NOT EXISTS latest_price numeric,
  ADD COLUMN IF NOT EXISTS latest_price_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_paper_trades_open_status 
  ON paper_trades(status) WHERE status = 'open';
```

### Step 2: Update monitor-paper-trades Edge Function
After `const currentPrice = Number(latestPrice.current_price);` (line 174), write the price back to the trade row so it's cached for exit fallback. Single additional `.update()` call per trade in the monitoring loop.

### Step 3: New Edge Function — get-live-price
Lightweight single-symbol EODHD real-time price fetch:
- POST `{ symbol }` → converts to EODHD format (e.g. `=X` → `.FOREX`)
- Calls `https://eodhd.com/api/real-time/{symbol}?api_token=...&fmt=json`
- Returns `{ price, symbol, timestamp }` or `{ error }`
- Uses `EODHD_API_KEY` secret (already configured)
- Add `[functions.get-live-price] verify_jwt = false` to config.toml (service needs to call it without user JWT)

### Step 4: Update usePaperTrading.ts — 4-Layer Fallback
Replace the current single-query price resolution (lines 92-103) with:

1. **Layer 1**: `live_pattern_detections` with 4-hour staleness check
2. **Layer 2**: `latest_price` from the trade row itself (30-min staleness)
3. **Layer 3**: `supabase.functions.invoke('get-live-price', { body: { symbol } })`
4. **Layer 4**: Signal UI to show manual price input

Add `needManualPrice` state. If all 3 automated layers fail, set it instead of showing a toast error. Export from hook.

Store `priceSource` in `close_reason` for diagnostics.

### Step 5: Update OverrideDialog.tsx
- Add `forcePriceEntry?: boolean` prop
- When true, skip the live price check and show manual price input immediately with warning
- Parent passes `forcePriceEntry={needManualPrice === trade?.id}`

### Step 6: Update Flatten-All Flow
Use `Promise.allSettled` to batch-fetch prices for all open trades via `get-live-price`, then close each with its resolved price. Trades that fail all layers are skipped with a warning toast.

### Step 7: i18n Keys
Add to `en.json`:
- `paperTrading.priceUnavailable`
- `paperTrading.priceSourceManual` (etc. if needed)

## Files Changed
| File | Change |
|------|--------|
| `supabase/migrations/..._add_latest_price.sql` | New columns + index |
| `supabase/functions/monitor-paper-trades/index.ts` | Cache price on trade row |
| `supabase/functions/get-live-price/index.ts` | New edge function |
| `supabase/config.toml` | Register get-live-price |
| `src/hooks/usePaperTrading.ts` | 4-layer fallback + needManualPrice state |
| `src/components/paper-trading/OverrideDialog.tsx` | forcePriceEntry prop |
| `src/pages/PaperTradingPage.tsx` | Wire needManualPrice to OverrideDialog |
| `src/i18n/locales/en.json` | New keys |

