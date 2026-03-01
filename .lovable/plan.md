

# Auto Paper Trading + Signal Webhook Relay

## Overview
Add two automation layers to `check-alert-matches`: when a pattern matches a user alert, optionally (1) auto-open a paper trade and (2) fire a webhook to an external platform.

---

## 1. Database Migration

### Add columns to `alerts` table
- `auto_paper_trade` (boolean, default false) -- enable auto paper trading for this alert
- `webhook_url` (text, nullable) -- user's webhook endpoint URL
- `webhook_secret` (text, nullable) -- HMAC-SHA256 signing secret
- `risk_percent` (numeric, default 1.0) -- position size as % of paper portfolio

### Create `signal_webhook_log` table
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | default gen_random_uuid() |
| alert_id | uuid FK -> alerts | which alert triggered it |
| detection_id | uuid | live_pattern_detections reference |
| user_id | uuid | alert owner |
| payload | jsonb | full JSON sent |
| response_status | integer | HTTP status returned |
| response_body | text | truncated response |
| latency_ms | integer | round-trip time |
| created_at | timestamptz | default now() |

RLS: users can SELECT their own rows; service_role can INSERT.

---

## 2. New Edge Function: `auto-paper-trade`

Called from `check-alert-matches` when `alert.auto_paper_trade = true`.

Logic:
1. Look up user's paper portfolio (from `paper_portfolios`)
2. Check no existing open trade for same symbol (prevent duplicates)
3. Calculate position size: `(current_balance * risk_percent / 100) / abs(entry - stop_loss)` = quantity
4. Insert into `paper_trades` with status='open', entry_price, stop_loss, take_profit, trade_type (long/short)
5. Return success/skip status

---

## 3. New Edge Function: `fire-signal-webhook`

Called from `check-alert-matches` when `alert.webhook_url` is set.

Logic:
1. Build standardized JSON payload:
```text
{
  "signal": "entry",
  "symbol": "BTCUSDT",
  "direction": "long",
  "timeframe": "4h",
  "entry_price": 67250.00,
  "stop_loss": 65800.00,
  "take_profit": 70150.00,
  "risk_reward": 2.0,
  "pattern": "ascending-triangle",
  "quality_grade": "A",
  "timestamp": "2026-03-01T14:30:00Z"
}
```
2. Sign with HMAC-SHA256 using `webhook_secret` (header: `X-Signature`)
3. POST to `webhook_url` with 5s timeout
4. Log result to `signal_webhook_log` (status, latency, truncated response)

Safeguards:
- URL must start with `https://`
- Max 10 webhook fires per user per hour (checked via count on `signal_webhook_log`)

---

## 4. Update `check-alert-matches`

After the existing notification dispatch, add two new calls inside `processAlert()`:

```text
// After send-pattern-alert...

if (alert.auto_paper_trade) {
  await supabase.functions.invoke('auto-paper-trade', { body: { ... } });
}

if (alert.webhook_url) {
  await supabase.functions.invoke('fire-signal-webhook', { body: { ... } });
}
```

The alert SELECT query updated to also fetch `auto_paper_trade, webhook_url, webhook_secret, risk_percent`.

---

## 5. Frontend: Alert Configuration UI

### MemberAlerts.tsx -- Alert Creation Form
Add below existing form fields:
- **Auto Paper Trade** toggle (Switch component) + risk % slider (1-5%, default 1%)
- **Webhook URL** text input with validation (must be https://)
- **Webhook Secret** field with "Generate" button (creates random 32-char hex string)
- **Test Webhook** button that fires a test payload to the URL

Pass these new fields through the `create-alert` edge function body.

### MemberAlerts.tsx -- Active Alerts List
- Show "Auto-Trade" and "Webhook" badges on alerts that have these enabled
- Add webhook delivery log viewer (expandable section showing recent `signal_webhook_log` entries)

### Paper Trading Dashboard
- Add "Auto" badge on trades where `notes` contains `[auto-trade]` marker

---

## 6. Update `create-alert` Edge Function

Accept new optional fields: `auto_paper_trade`, `webhook_url`, `webhook_secret`, `risk_percent` and pass them through to the `alerts` table insert.

---

## 7. Config Updates

Add to `supabase/config.toml`:
```text
[functions.auto-paper-trade]
verify_jwt = false

[functions.fire-signal-webhook]
verify_jwt = false
```

---

## Implementation Order

1. Database migration (add columns + new table + RLS)
2. `auto-paper-trade` edge function
3. `fire-signal-webhook` edge function
4. Update `check-alert-matches` to call both
5. Update `create-alert` to accept new fields
6. Frontend: alert form + badges + webhook log viewer
7. Config.toml entries

