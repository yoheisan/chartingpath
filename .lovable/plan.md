
# System Architecture — Global Operations

## Validation Pipeline (Implemented)

### 5-Shard Parallel Architecture
Replaces single-worker (3,000 records/hr) with 5 concurrent shards totalling **150,000 records/hr**.

| Shard | Asset Types | Cron Job | Throughput |
|-------|------------|----------|------------|
| stocks | stocks, stock, equity | backfill-validation-stocks | 30,000/hr |
| etf | etf, ETF | backfill-validation-etf | 30,000/hr |
| crypto | crypto, cryptocurrency | backfill-validation-crypto | 30,000/hr |
| forex | forex, fx, currency | backfill-validation-forex | 30,000/hr |
| indices | indices, index, indice | backfill-validation-indices | 30,000/hr |

Each shard has its own:
- **Advisory lock** (`pg_try_advisory_lock`) — prevents duplicate execution per shard
- **Watermark** (`last_watermark` in `worker_runs`) — enables resumable, gap-free processing
- **Circuit breaker** — opens for 30 min after 3 consecutive failures; one shard failing does not block others

### Global Market Windows

```
UTC  00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23
     ──────────────────────────────────────────────────────────────────────
     [  APAC session          ]
                    [  EU session             ]
                                        [  US session                    ]
     [VALIDATE]────────────────────────[SEED GATE]──[VALIDATE]───────────
     ^04:00 purge                      ^05:00-12:00  ^12:00 gate opens
```

- **04:00 UTC** — `purge-stale-patterns` truncates historical tables
- **05:00–12:00 UTC** — Seeding gate: validation workers no-op (seeder runs)
- **12:00 UTC** — Gate re-opens; all 5 shards resume at 150,000 records/hr
- **Backlog clearance** — ~300k daily patterns cleared in ~2 hours vs prior 96+ hours

### Shard Isolation & Fault Tolerance

```
pg_cron (every minute)
  │
  ├─► backfill-validation-stocks  ──► lock:stocks  ──► watermark:stocks
  ├─► backfill-validation-etf     ──► lock:etf     ──► watermark:etf
  ├─► backfill-validation-crypto  ──► lock:crypto  ──► watermark:crypto
  ├─► backfill-validation-forex   ──► lock:forex   ──► watermark:forex
  └─► backfill-validation-indices ──► lock:indices ──► watermark:indices
         │
         └─► validate-pattern-context (Layer 2, batch 500)
               └─► historical_pattern_occurrences (indexed: validation_status, created_at)
```

---

## Live Pattern Scanning ✅ (Scheduled & Active — 2026-02-20)

- **Job**: `scan-live-patterns-scheduled` (pg_cron ID: **134**)
- **Schedule**: `*/15 0-4,12-23 * * *` — every 15 min, outside seeding window (05:00–11:59 UTC)
- **Rationale**: Seeding window excluded to prevent OOM on Medium instance (~93% RAM during seeding bursts)
- **Target**: `live_pattern_detections` table — powers the live screener shown to users
- **Edge Function**: `scan-live-patterns`

---

## Seeding Pipeline ✅ (Fully Scheduled & Active)

42 cron jobs active in pg_cron (40 seeding + 1 purge + 1 live scan). Verified via `cron.job` query.
Timeframe Isolation strategy: each partition × timeframe runs in its own isolated job.
Gated 05:00–12:00 UTC to avoid conflicts with the validation workers.

| Window | Jobs |
|--------|------|
| 04:00 UTC | `purge-stale-patterns` — truncates historical tables |
| 05:00–05:40 | FX (1h, 4h, 8h, 1d, 1wk) |
| 05:50–06:30 | Crypto (1h, 4h, 8h, 1d, 1wk) |
| 06:40–07:20 | Commodities (1h, 4h, 8h, 1d, 1wk) |
| 07:30–08:00 | Indices (1h, 4h, 8h, 1d, 1wk) |
| 08:10–09:00 | ETFs (1h, 4h, 8h, 1d, 1wk) |
| 09:10–09:50 | Stocks A–G (1h, 4h, 8h, 1d, 1wk) |
| 10:00–10:40 | Stocks H–O (1h, 4h, 8h, 1d, 1wk) |
| 10:50–11:30 | Stocks P–Z (1h, 4h, 8h, 1d, 1wk) |
| 12:00 UTC | Validation gate re-opens; all 5 shards resume |

---

## APAC Market Expansion — Master Plan (2026-02-21)

### Motivation
Analytics show 69% China, 10% Singapore, 6% Thailand traffic. Expanding APAC coverage
to serve the primary audience with local market instruments and content.

### Phase 1: APAC Ticker Universe Expansion (~58 tickers)
**Status**: ✅ COMPLETED (2026-02-21)
**Risk Level**: LOW — uses existing seeding pipeline, no new cron shards needed
**API Impact**: ~5-8K additional EODHD calls/day (well within 100K quota)

#### What Already Exists (No Changes Needed)
- APAC FX pairs: USD/CNH, USD/CNY, USD/SGD, USD/THB, USD/HKD, etc. ✅
- APAC Indices: ^HSI, ^N225, ^STI, 000001.SS, 399001.SZ, ^KS11, ^TWII ✅
- APAC ETFs: FXI, EWJ, EWY, EWT, MCHI ✅

#### New Tickers to Add
| Market | Count | Examples | Yahoo Symbol Format |
|--------|-------|----------|-------------------|
| Hong Kong (HKEX) | 20 | Tencent, Alibaba HK, HSBC HK, AIA | 0700.HK, 9988.HK |
| Singapore (SGX) | 15 | DBS, OCBC, UOB, SingTel, CapitaLand | D05.SI, O39.SI |
| Thailand (SET) | 10 | PTT, SCB, ADVANC, CPALL | PTT.BK, SCB.BK |
| APAC-specific FX | 5 | CNH/JPY, SGD/CNH, THB/JPY | Already covered |
| China ADRs (US-listed) | 10 | BABA, JD, PDD, BIDU, NIO | Already US stocks |

**Implementation Steps:**
1. Add HK stocks to `STOCK_INSTRUMENTS` in screenerInstruments.ts (tagged with region comment)
2. Add SGX stocks to `STOCK_INSTRUMENTS` 
3. Add SET stocks to `STOCK_INSTRUMENTS`
4. Update `symbolResolver.ts` to handle .HK, .SI, .BK suffixes → asset_type = 'stocks'
5. Update EODHD fetch to map Yahoo .HK → EODHD .HK suffix
6. No new cron shards needed — these fall into existing Stocks A-Z partitions
7. Verify seeding works for new symbols (test with 2-3 tickers first)

**Scheduling Impact**: NONE — new tickers automatically picked up by existing
Stocks A-G / H-O / P-Z seeding windows based on alphabetical sort.

---

### Phase 2: Asia Session Market Report
**Status**: 🔲 Planned
**Risk Level**: VERY LOW — extends existing report infrastructure
**API Impact**: 1 additional Gemini call per day

#### Current Reports (5/day)
| Report | Schedule (UTC) | Markets |
|--------|---------------|---------|
| US Pre-Market | 00:00 | S&P 500, NASDAQ, Crypto |
| Tokyo Pre-Market | 23:30 | Nikkei, USDJPY |
| Tokyo Post-Market | 06:30 | Nikkei |
| US Post-Market | 07:30 | S&P 500, NASDAQ |
| London Post-Market | 08:00 | FTSE, DAX |

#### New Report to Add
| Report | Schedule (UTC) | Markets |
|--------|---------------|---------|
| **Shanghai/HK Open** | **01:30** | HSI, SSE Composite, CSI 300, USD/CNH, AUD/USD |

**Implementation Steps:**
1. Add new content_library entry for Asia session template
2. Add cron job at 01:30 UTC (outside seeding window ✅)
3. Update `generate-market-report` to handle Shanghai/HK session symbols
4. Wire into existing social posting pipeline

**Scheduling Impact**: NONE — 01:30 UTC is well outside the 05:00-12:00 seeding window.

---

### Phase 3: zh-CN Localization (Partial)
**Status**: 🔲 Planned
**Risk Level**: VERY LOW — frontend-only changes, no backend impact
**API Impact**: NONE

#### Scope
- Homepage hero, navigation, footer
- Pattern Screener UI labels
- Edge Atlas UI labels
- Key learning articles (top 5 by traffic)
- SEO meta tags for zh-CN pages

**Implementation Steps:**
1. Create zh-CN translation JSON in existing i18next setup
2. Add language switcher to nav (if not already present)
3. Translate ~200 key UI strings
4. Add hreflang tags for SEO
5. Create 3-5 Chinese blog articles targeting high-intent keywords

**Scheduling Impact**: NONE — pure frontend.

---

### Phase 4: Documentation & Compliance
**Status**: 🔲 Planned
**Risk Level**: VERY LOW — content updates only

#### Updates Required
1. **Internal Audit Docs** (InternalDocs.tsx)
   - Add APAC ticker universe details
   - Document new seeding coverage (HK, SGX, SET)
   - Update API usage projections
   
2. **FAQ Updates**
   - "Which Asian markets are supported?"
   - "What exchanges does ChartingPath cover?"
   - Data freshness expectations for APAC markets
   
3. **Terms & Conditions**
   - Data attribution for HK/SGX/SET market data (EODHD / Yahoo Finance)
   - Clarify that APAC data is delayed (not real-time)
   - Regional regulatory disclaimers for China/Singapore/Thailand users
   
4. **Privacy Policy** (if applicable)
   - No changes needed unless collecting region-specific PII

---

### Resource Budget Summary

| Resource | Current | After Expansion | Headroom |
|----------|---------|----------------|----------|
| EODHD API calls/day | ~85,000 | ~93,000 | 7,000 remaining |
| Seeding cron jobs | 42 | 42 (no new jobs) | N/A |
| RAM usage (peak) | 3.74 GB / 4 GB | ~3.8 GB / 4 GB | 200 MB |
| Universe size | ~1,000 | ~1,060 | — |
| Market reports/day | 5 | 6 | — |

---

## Notification System Plan (Next)

### Phase 1 — VAPID Keys ✅ (secrets already exist)
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` configured

### Phase 2 — Notification Preferences DB
```sql
ALTER TABLE profiles 
ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true,
ADD COLUMN push_notifications_enabled BOOLEAN DEFAULT true;
```

### Phase 3 — Upgrade `send-pattern-alert`
Parallel dispatch using `Promise.allSettled`:
- Email via Resend
- Web Push via `npm:web-push@3.6.6` + VAPID

### Push Payload
```json
{
  "title": "Pattern Alert: Hammer on AAPL",
  "body": "Bullish reversal detected (80% confidence) - $185.42",
  "tag": "pattern-alert-{alertId}",
  "url": "/members/alerts",
  "requireInteraction": true
}
```

### Phase 4 — NotificationSettings UI
Connect to DB: load/save `email_notifications_enabled` and `push_notifications_enabled` from profiles.

### Phase 5 — Pass user_id through pattern-detector → send-pattern-alert

### Files to Modify
| File | Action |
|------|--------|
| `supabase/functions/send-pattern-alert/index.ts` | Add push dispatch |
| `src/components/settings/NotificationSettings.tsx` | Connect to DB |
| `src/hooks/usePushNotifications.ts` | Update VAPID public key |
