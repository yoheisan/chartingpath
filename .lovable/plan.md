

# Unify All Non-Crypto Data to EODHD

## What changes and why

Currently, all intraday requests (1h, 4h, 8h) for non-crypto symbols bypass EODHD and go straight to Yahoo Finance. This creates data parity issues between the pattern detector and the chart display. The fix is simple: remove the Yahoo bypass for intraday and route everything through EODHD first.

**EODHD coverage confirmed** (from their docs):
- **Stocks (US + global)**: 1m since 2004, 5m/1h since Oct 2020 — up to 7200 days for 1h
- **Forex**: 1m since 2009, 5m/1h since Oct 2020
- **Commodities** (GC=F → GC.COMM): Supported via `.COMM` exchange
- **Indices** (^GSPC → GSPC.INDX): Supported via `.INDX` exchange
- **ETFs**: Supported same as stocks (e.g., SPY.US)

4H and 8H are not natively available from EODHD — the existing aggregation from 1h bars (already implemented in both `fetch-eodhd` and `fetchMarketBars.ts`) will continue to handle these.

## Implementation

### File 1: `src/lib/fetchMarketBars.ts`
**Remove the intraday Yahoo bypass** (lines 162-172). Instead, route non-crypto intraday through EODHD-first with Yahoo as last-resort fallback only.

- Delete the block that says "Non-crypto intraday: skip EODHD entirely, go straight to Yahoo"
- Let intraday requests fall through to the existing EODHD-first → Yahoo-fallback path (lines 174-209)
- Keep the crypto path unchanged (Binance-first → Yahoo-fallback)

### File 2: `supabase/functions/scan-live-patterns/index.ts`
- Verify no direct Yahoo calls remain for non-crypto instruments (already clean based on search)

### File 3: Backend callers audit
- `validate-mtf-confluence/index.ts` — calls Yahoo directly for bar fetching; update to call `fetch-eodhd` first
- `trading-copilot/index.ts` — calls Yahoo directly; update to call `fetch-eodhd` first
- `TickerStudy.tsx` — calls Yahoo for candlestick data; update to call `fetch-eodhd` first
- `SupabaseDBFirstAdapter.ts` — uses Yahoo as external fallback; update fallback to `fetch-eodhd`

### No changes needed
- `fetch-eodhd/index.ts` — already handles intraday (1h), forex (`.FOREX`), commodities (`.COMM`), indices (`.INDX`), ETFs (`.US`), and aggregation for 4h/8h/15m/30m
- Crypto path stays Binance-first (unchanged)
- `dataCoverageContract.ts` — coverage limits remain valid for EODHD

## Summary of routing after fix

```text
Crypto (BTC-USD, ETH-USD)  →  Binance → Yahoo fallback
Everything else (all TFs)  →  DB-first → EODHD → Yahoo fallback (last resort only)
4H / 8H                   →  Fetch 1H from EODHD → aggregate client/server-side
```

## Scope
- ~4-6 files modified
- Primary change is removing one `if` block in `fetchMarketBars.ts`
- Secondary changes are updating direct Yahoo calls in edge functions and pages to prefer EODHD
- Deploy updated edge functions (`validate-mtf-confluence`, `trading-copilot`)

