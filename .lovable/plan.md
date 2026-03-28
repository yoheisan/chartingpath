

# Ensure Pattern Lab and DB Seeding Use EODHD (Not Yahoo)

## Current State — Yahoo Still Primary in Key Services

| Service | Yahoo Usage | Role |
|---|---|---|
| `seed-historical-patterns/index.ts` | `fetchYahooData()` — **primary and only source** | Seeds historical pattern OHLCV |
| `seed-historical-patterns-mtf/index.ts` | Yahoo **primary for FX intraday**, fallback for everything else | Seeds MTF historical patterns |
| `seed-price-timeseries/index.ts` | Yahoo **primary for FX**, fallback for stocks/ETFs/indices | Seeds intraday price cache |
| `scan-live-patterns/index.ts` | `fetchYahooDataSingle()` — **primary on DB miss** | Live pattern detection |
| `validate-mtf-confluence/index.ts` | `fetch-yahoo-finance` — **primary fallback** | MTF confluence checks |
| `get-cached-market-report/index.ts` | Yahoo — **primary for stocks, forex, commodities quotes** | Daily market report |
| `fetch-market-breadth/index.ts` | Yahoo — **primary for VIX, A/D data** | Market breadth widget |
| `DynamicArticle.tsx` | `fetch-yahoo-finance` — **primary fallback** | Blog article charts |

Pattern Lab backtest engine (`projects-run`) is already clean — no Yahoo.

## Implementation Plan

### 1. `seed-historical-patterns/index.ts` — Replace Yahoo with EODHD
- Replace `fetchYahooData()` with a new `fetchEODHDData()` that calls the EODHD EOD API directly using `Deno.env.get('EODHD_API_KEY')`
- Convert Yahoo-format symbols to EODHD format (reuse `toEODHDSymbol` logic from `fetch-eodhd`)
- Keep Yahoo as last-resort fallback only

### 2. `seed-historical-patterns-mtf/index.ts` — Fix FX intraday routing
- Change FX intraday path (lines 1511-1519) from Yahoo-first to **EODHD-first**
- EODHD covers FX intraday (1h) for 120 days; Yahoo has 729 days but should only be fallback
- Keep Yahoo as fallback if EODHD returns nothing

### 3. `seed-price-timeseries/index.ts` — Fix FX routing
- Change FX path (lines 218-222) from Yahoo-first to **EODHD-first**
- Keep Yahoo as fallback only

### 4. `scan-live-patterns/index.ts` — Replace primary Yahoo fetch
- Replace `fetchYahooDataSingle()` with `fetchEODHDDataSingle()` that calls EODHD API directly
- Rename `symbolsNeedingYahoo` → `symbolsNeedingExternal`
- Try EODHD first, fall back to Yahoo only if EODHD returns empty
- Crypto symbols route to Binance/Yahoo (not EODHD)

### 5. `validate-mtf-confluence/index.ts` — Replace Yahoo fallback
- Change `fetch-yahoo-finance` invoke to `fetch-eodhd` invoke
- Add Yahoo as second fallback if EODHD returns nothing

### 6. `get-cached-market-report/index.ts` — Replace Yahoo quote fetching
- Replace `fetchYahooQuote()` with `fetchEODHDQuote()` using EODHD's real-time/EOD endpoint
- EODHD supports stocks (`.INDX`), forex (`.FOREX`), commodities (`.COMM`)
- Keep Finnhub for US stocks (already in place) and crypto (Binance, already in place)
- Yahoo becomes last-resort only

### 7. `fetch-market-breadth/index.ts` — Replace where possible
- VIX: use EODHD (`VIX.INDX`)
- A/D data (`^ADV`, `^DECL`, `^UNCH`): these are NYSE breadth indicators — EODHD may not cover them. Keep Yahoo for these specific symbols only, with a comment explaining why
- Put/Call ratio: same — Yahoo may be the only free source

### 8. `DynamicArticle.tsx` — Replace Yahoo fallback
- Change `fetch-yahoo-finance` invoke to `fetch-eodhd` invoke
- Add Yahoo as second fallback if EODHD returns nothing

## Scope
- 8 files modified
- 2 edge functions need redeployment (`scan-live-patterns`, `validate-mtf-confluence`, `seed-historical-patterns`, `seed-historical-patterns-mtf`, `seed-price-timeseries`, `get-cached-market-report`, `fetch-market-breadth`)
- No DB changes
- No UI changes
- Symbol conversion logic (Yahoo→EODHD format) will be duplicated inline in each edge function since they can't import from `fetch-eodhd` (each function is self-contained)

## Data Source After Fix

```text
Crypto             →  Binance (primary) → Yahoo fallback
Everything else    →  DB-first → EODHD → Yahoo (last resort only)
Market breadth A/D →  Yahoo (only source for ^ADV/^DECL/^UNCH)
4H / 8H            →  Fetch 1H from EODHD → aggregate
```

