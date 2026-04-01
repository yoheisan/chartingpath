

## Plan: Realistic Trade Management — Gap-Aware Exits, Slippage, Latency Logging

### Summary
Four improvements to `manage-trades` to make paper trading simulation more realistic, plus a cron interval reduction.

---

### 1. Database Migration — New Columns on `paper_trades`

Add three columns:
- `slippage_pct` (numeric, default 0) — records the slippage applied to the fill
- `detection_latency_ms` (integer, nullable) — milliseconds between estimated breach time and detection time
- `ideal_exit_price` (numeric, nullable) — the SL/TP price before gap-aware adjustment (for audit trail)

### 2. Cron Job — Reduce to 1 Minute

Update the existing `manage-trades-every-2min` cron job schedule from `*/2 * * * *` to `* * * * *` via SQL insert tool (not migration).

### 3. Edge Function Changes — `supabase/functions/manage-trades/index.ts`

**A. Slippage simulation constant:**
```
SLIPPAGE_PCT = 0.0005 (0.05%)
```
Applied adversely on every exit fill — increases the loss on SL exits, decreases the gain on TP exits.

**B. Gap-aware exit pricing (stop loss):**
- Current: exits at `stopLoss` price regardless of where `currentPrice` actually is
- New: if `currentPrice` has blown past the stop, use `currentPrice` as the fill price (worse than stop), then apply slippage on top
- Store `stopLoss` as `ideal_exit_price` for audit

**C. Gap-aware exit pricing (take profit):**
- If price gapped past TP, still use `currentPrice` (which is better than TP) — but apply adverse slippage
- Store `takeProfit` as `ideal_exit_price`

**D. Slippage application logic:**
```
applySlippage(price, isLong, isExit):
  // For exits: slippage is adverse (fills worse)
  // Long exit: price * (1 - SLIPPAGE_PCT)
  // Short exit: price * (1 + SLIPPAGE_PCT)
```

**E. Latency estimation:**
Since we only poll (no tick-level data), estimate when price crossed the stop:
- Use `lastConfirmed` timestamp from `live_pattern_detections` as the approximate breach time
- `detection_latency_ms = Date.now() - lastConfirmed.getTime()`
- Store on the trade record at close

**F. Updated PnL calculations:**
All PnL math uses the slippage-adjusted `fillPrice` instead of the raw stop/TP price.

### 4. Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/new.sql` | Add 3 columns to `paper_trades` |
| `supabase/functions/manage-trades/index.ts` | Gap-aware fills, slippage, latency logging |
| Cron job (via SQL insert) | `*/2` → `* * * * *` |

