

## Plan: Add Exchange Metadata to Ticker Data

### Problem
Tickers have no exchange association stored in the database. The Copilot, screener, and all queries cannot filter or group by exchange (NYSE, NASDAQ, HKEX, SET, etc.).

### Approach

#### 1. Create an `instruments` reference table
A new lookup table that maps every ticker to its exchange, sector, and country:

```sql
CREATE TABLE public.instruments (
  symbol TEXT PRIMARY KEY,
  name TEXT,
  exchange TEXT NOT NULL,       -- 'NYSE', 'NASDAQ', 'HKEX', 'SET', 'SGX', 'BINANCE', etc.
  asset_type TEXT NOT NULL,     -- 'stocks', 'crypto', 'fx', 'commodities', etc.
  country TEXT,                 -- 'US', 'HK', 'TH', 'SG', 'CN'
  sector TEXT,                  -- 'Technology', 'Financials', etc. (stocks only)
  currency TEXT,                -- 'USD', 'HKD', 'THB'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2. Populate from existing screener instruments
Seed the table by deriving exchange from symbol suffix conventions already in `screenerInstruments.ts`:
- No suffix → US (infer NYSE/NASDAQ from a static mapping or default to US)
- `.HK` → HKEX
- `.BK` → SET
- `.SI` → SGX
- `.SS` → SSE, `.SZ` → SZSE
- `-USD` → BINANCE/crypto
- `=X` → FOREX, `=F` → COMEX/NYMEX/CME

#### 3. Add `exchange` column to detection tables
Add a nullable `exchange` column to:
- `live_pattern_detections`
- `historical_pattern_occurrences`

Backfill from the `instruments` table and update the scan pipeline to write exchange on insert.

#### 4. Update scan pipeline
Modify `scan-live-patterns` to look up and persist `exchange` when writing new detections.

#### 5. Expose to Copilot
Update the Copilot's `search_patterns` tool schema to accept an optional `exchange` filter, and wire it into the query.

### Scope
- 1 new table (`instruments`)
- 2 ALTER TABLE migrations
- 1 edge function update (`scan-live-patterns`)
- 1 Copilot tool schema update
- Seed script for ~800 existing instruments

### What this enables
- Copilot can answer "Show me NASDAQ stocks with bullish patterns"
- Screener can add an Exchange filter dropdown
- Market reports can group by exchange
- Users can search/filter by specific exchanges

