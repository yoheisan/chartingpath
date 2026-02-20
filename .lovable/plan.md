
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

## Seeding Pipeline ✅ (Fully Scheduled & Active)

41 cron jobs active in pg_cron (40 seeding + 1 purge). Verified via `cron.job` query.
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
