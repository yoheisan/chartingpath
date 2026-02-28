

# Autonomous Learning Copilot: Close the Feedback Loop

## Summary

The Trading Copilot currently logs data to `copilot_training_pairs` and `copilot_feedback` but **never reads it back** to improve itself. This plan implements the missing automated pipeline: a scheduled function that analyzes failures and generates corrective rules, a platform knowledge snapshot for data-lake awareness, and temporal/user context injection into the system prompt.

## What Gets Built

### 1. New Edge Function: `build-copilot-context`
**Purpose:** Pre-compute a "platform knowledge snapshot" every 6 hours so the Copilot knows what data exists.

**What it computes:**
- Total active patterns by asset class and timeframe
- Data freshness timestamps (last pattern scan, last market report, last price update)
- Market session status (weekend, holiday, open/closed per region)
- Top queried symbols from `copilot_feedback`
- Coverage stats (total historical trades, instruments covered)

**Storage:** New `copilot_platform_context` table with `context_type`, `context_data` (JSONB), `computed_at`, and `expires_at` columns.

**Schedule:** Cron job every 6 hours.

### 2. New Edge Function: `copilot-learn`
**Purpose:** Daily automated feedback-to-rules pipeline. This is the missing link.

**Process:**
1. Query `copilot_training_pairs` from the last 7 days where `reward_score < 0` (failed interactions)
2. Query `copilot_feedback` entries where `content_gap_identified = true`
3. Batch these to Gemini with a meta-prompt: "Analyze these failed interactions and extract corrective rules"
4. Parse the AI output into structured rules
5. Insert validated rules into `copilot_learned_rules` with `source = 'auto_feedback_loop'`
6. Deactivate stale auto-generated rules (no usage in 30 days)

**Schedule:** Daily cron job.

### 3. Modify `trading-copilot/index.ts` -- Inject Context Layers

**a) Temporal Context (inline computation, no external call):**
```text
Current time: 2026-02-28T14:30:00Z (Saturday)
Market status: Weekend -- all major markets closed
Last trading session: Friday Feb 27, 2026
Next open: Monday Mar 2, 2026
```
This is computed at request time using simple day-of-week and hour-of-day logic for US, EU, and APAC sessions.

**b) Platform Knowledge Snapshot (from `copilot_platform_context`):**
```text
Active patterns: 342 (stocks: 180, crypto: 85, fx: 52, indices: 25)
Last scan: 2h ago | Last market report: Friday 16:30 UTC
Data coverage: 8,500 instruments, 380,000+ historical trades
```

**c) User Behavioral Context (for authenticated users):**
- Fetch last 5 queries from `copilot_feedback` for the same user
- Extract preferred symbols and timeframes
- Inject as: "User recently asked about BTCUSD, AAPL; prefers 4h and 1d timeframes"

**d) Intent Disambiguation Rules (from learned rules + hardcoded fallbacks):**
- "How did the market end?" on weekends -> use Friday's report
- Price queries outside hours -> show last close + note market is closed
- Empty pattern results -> retry with broader filters before responding

### 4. Database Changes

**New table: `copilot_platform_context`**

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid (PK) | Primary key |
| context_type | text | e.g. 'platform_snapshot', 'market_session' |
| context_data | jsonb | The computed snapshot |
| computed_at | timestamptz | When refreshed |
| expires_at | timestamptz | When to consider stale |

**Modify `copilot_learned_rules`:** Add a `source` column (text, default 'manual') to distinguish manual rules from auto-generated ones, and an `auto_expires_at` column for auto-cleanup.

### 5. Config Updates

Register both new functions in `supabase/config.toml`:
- `build-copilot-context` (verify_jwt = false)
- `copilot-learn` (verify_jwt = false)

Set up two cron jobs (via SQL insert):
- `build-copilot-context`: every 6 hours
- `copilot-learn`: daily at 06:00 UTC

## Technical Details

### `build-copilot-context` Logic
```text
1. Query live_pattern_detections: COUNT(*) GROUP BY asset_type, timeframe WHERE status='active'
2. Query cached_market_reports: MAX(generated_at)
3. Query historical_pattern_occurrences: COUNT(*)
4. Query copilot_feedback: top 10 symbols by frequency (last 7 days)
5. Compute market session status from current UTC time
6. Upsert into copilot_platform_context
```

### `copilot-learn` Logic
```text
1. SELECT * FROM copilot_training_pairs WHERE reward_score < 0 AND created_at > now() - '7 days'
2. SELECT * FROM copilot_feedback WHERE content_gap_identified = true AND created_at > now() - '7 days'
3. Batch into groups of 10, send to Gemini with extraction prompt
4. Parse returned rules, validate format
5. INSERT INTO copilot_learned_rules (source='auto_feedback_loop', confidence=0.7)
6. UPDATE copilot_learned_rules SET is_active=false WHERE source='auto_feedback_loop' AND usage_count=0 AND created_at < now() - '30 days'
```

### System Prompt Enhancement in `trading-copilot`
The existing `fetchLearnedRules()` and `fetchRAGContext()` calls remain. Three new fetches are added in parallel before the Gemini call:
1. `fetchPlatformContext(supabase)` -- reads latest `copilot_platform_context`
2. `computeTemporalContext()` -- pure function, no DB call
3. `fetchUserBehavior(supabase, userId)` -- reads last 5 entries from `copilot_feedback`

These are appended to the system prompt before the Gemini API call.

## Expected Outcomes

- **Weekend queries**: Copilot automatically knows markets are closed and references Friday's data
- **Data awareness**: Copilot knows which instruments have data, preventing dead-end responses
- **Self-improving**: Failed interactions automatically generate corrective rules within 24 hours
- **Personalized**: Authenticated users get responses informed by their recent query history
- **Zero manual maintenance**: The rules pipeline runs autonomously

## File Changes Summary

| Action | File | Description |
|--------|------|-------------|
| Create | `supabase/functions/build-copilot-context/index.ts` | Platform knowledge snapshot builder |
| Create | `supabase/functions/copilot-learn/index.ts` | Automated feedback-to-rules pipeline |
| Modify | `supabase/functions/trading-copilot/index.ts` | Inject temporal, platform, and user context |
| Modify | `supabase/config.toml` | Register new functions |
| Migration | New table `copilot_platform_context` | Store platform snapshots |
| Migration | Alter `copilot_learned_rules` | Add `source` and `auto_expires_at` columns |
| SQL Insert | Cron jobs | Schedule both new functions |

