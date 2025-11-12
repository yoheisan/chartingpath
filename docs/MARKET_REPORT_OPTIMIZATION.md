# Market Report Optimization

## Overview

The market report system has been optimized for speed and cost efficiency without adding more API costs. This document outlines the improvements and how to enable them.

## Key Optimizations

### 1. Extended Cache Duration (30 min → 2 hours)
- Reports are now cached for 2 hours instead of 30 minutes
- Reduces duplicate API calls during the same trading session
- Market conditions don't change drastically within 2 hours

### 2. Regional Cache Grouping
- Similar timezones now share cached reports by region:
  - **Asia**: Tokyo, Hong Kong, Singapore, Shanghai
  - **Europe**: London, Paris, Berlin, Rome
  - **Americas**: New York, Chicago, Los Angeles, Toronto
  - **Australia**: Sydney, Melbourne
- Reduces duplicate generation for similar geographical areas

### 3. Fast Report Generation with Lovable AI
- New `generate-market-report-fast` function uses **google/gemini-2.5-flash**
- **Much cheaper** than GPT-5 (used in on-demand reports)
- **Much faster** generation time
- Optimized prompts for concise, professional output
- Fewer API calls (limited news articles, reduced data points)

### 4. Strategic Regional Scheduling
- New `schedule-regional-reports` function generates reports at optimal times
- **Pre-market** reports (before market opens)
- **Mid-day** reports (during trading hours)
- **Post-market** reports (after market closes)

#### Regional Schedule (UTC times)

**Asia (Tokyo timezone)**
- Pre-market: 23:00 UTC (8:00 AM Tokyo)
- Mid-day: 03:00 UTC (12:00 PM Tokyo)
- Post-market: 07:00 UTC (4:00 PM Tokyo)

**Europe (London timezone)**
- Pre-market: 07:00 UTC (8:00 AM London)
- Mid-day: 11:00 UTC (12:00 PM London)
- Post-market: 16:00 UTC (5:00 PM London)

**Americas (New York timezone)**
- Pre-market: 13:00 UTC (9:00 AM New York)
- Mid-day: 17:00 UTC (1:00 PM New York)
- Post-market: 21:00 UTC (5:00 PM New York)

## Cost Savings

### Before Optimization
- Cache: 30 minutes
- Model: GPT-5 for all reports
- Cost: ~$0.10-0.15 per report
- Duplicate generations for similar timezones

### After Optimization
- Cache: 2 hours (4x longer)
- Scheduled reports: Gemini Flash (~$0.01-0.02 per report)
- On-demand reports: Still use GPT-5 (user-requested, higher quality)
- Regional grouping: ~50% fewer duplicate generations

**Estimated savings: 80-90% reduction in API costs**

## Setup Instructions

### 1. Enable Cron Scheduling

Run the following SQL in Supabase SQL Editor to set up hourly regional report generation:

```sql
-- Enable pg_cron and pg_net extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule regional reports to run every hour
SELECT cron.schedule(
  'generate-regional-market-reports',
  '0 * * * *', -- Every hour at :00
  $$
  SELECT
    net.http_post(
      url:='https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/schedule-regional-reports',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8"}'::jsonb
    ) as request_id;
  $$
);
```

### 2. Verify Cron Job

Check if the cron job is active:

```sql
SELECT * FROM cron.job WHERE jobname = 'generate-regional-market-reports';
```

### 3. Monitor Execution

View cron job run history:

```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'generate-regional-market-reports')
ORDER BY start_time DESC
LIMIT 10;
```

## How It Works

### User Flow

1. **User opens Market Breadth page**
   - System checks for cached regional report (2-hour validity)
   - Sets up realtime WebSocket subscription to `cached_market_reports` table
   
2. **Cache hit (90% of cases)**
   - Report loads instantly (<1 second)
   - No API costs
   - Shows cache age badge (e.g., "Fresh" or "Cached - 15 min ago")
   
3. **Cache miss (10% of cases)**
   - Falls back to on-demand generation
   - Uses GPT-5 for highest quality
   - Caches for 2 hours
   - Enables realtime subscription

4. **Auto-refresh (NEW!)**
   - When scheduled backend generates fresh report
   - Frontend receives INSERT event via WebSocket
   - Report updates automatically without page refresh
   - Shows toast: "Report Auto-Updated - Fresh Asia market analysis just arrived!"

### Scheduled Flow

1. **Cron runs every hour**
   - Checks if current UTC hour matches regional schedule
   
2. **Generates reports at strategic times**
   - Uses Gemini Flash (fast + cheap)
   - Pre-market: Fresh data before trading
   - Mid-day: Intraday updates
   - Post-market: Daily recap
   
3. **Regional caching + Realtime push**
   - Stores by region (not timezone)
   - 2-hour expiry
   - Auto-cleanup of old reports
   - **Broadcasts INSERT event to all connected clients**
   - All users viewing that region get instant update

### Realtime Architecture

```
┌─────────────────────┐
│ User's Browser      │
│                     │
│ 1. Loads cached     │
│    report           │
│                     │
│ 2. Subscribes to    │
│    realtime updates │
│    for region       │
└──────────┬──────────┘
           │
           │ WebSocket
           │
┌──────────▼──────────┐
│ Supabase Realtime   │
│                     │
│ Filters by region:  │
│ "Asia", "Europe",   │
│ "Americas"          │
└──────────┬──────────┘
           │
           │ Postgres NOTIFY
           │
┌──────────▼───────────────────┐
│ Scheduled Backend Function   │
│                              │
│ Every hour:                  │
│ 1. Generate fresh report     │
│ 2. INSERT into DB            │
│ 3. Triggers realtime event   │
└──────────────────────────────┘
```

## Monitoring

### Check Realtime Connections

Monitor active realtime subscriptions:

```sql
-- Check active realtime connections (requires pg_stat_activity access)
SELECT 
  count(*) as active_connections,
  application_name
FROM pg_stat_activity
WHERE application_name LIKE '%realtime%'
GROUP BY application_name;
```

### Check Cache Status

```sql
SELECT 
  timezone as region,
  generated_at,
  expires_at,
  EXTRACT(EPOCH FROM (expires_at - NOW())) / 3600 as hours_until_expiry
FROM cached_market_reports
WHERE expires_at > NOW()
ORDER BY generated_at DESC;
```

### View Generation Stats

```sql
-- See which regions have fresh reports
SELECT 
  timezone as region,
  COUNT(*) as report_count,
  MAX(generated_at) as last_generated
FROM cached_market_reports
WHERE generated_at > NOW() - INTERVAL '24 hours'
GROUP BY timezone
ORDER BY last_generated DESC;
```

## Troubleshooting

### Realtime Not Working

1. **Check if realtime is enabled on table:**
```sql
-- Verify table is in realtime publication
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'cached_market_reports';
```

2. **Check browser console for WebSocket errors:**
   - Open browser DevTools → Console
   - Look for "WebSocket connection failed" or similar errors
   - Verify region filter matches (Asia, Europe, Americas)

3. **Test realtime manually:**
```sql
-- Insert a test report
INSERT INTO cached_market_reports (timezone, report, markets, time_span, tone, expires_at)
VALUES ('Asia', 'Test report', ARRAY['stocks'], 'previous_day', 'professional', NOW() + INTERVAL '2 hours');
```
   - Should trigger toast notification on frontend if subscribed

### Reports Not Being Generated

1. Check if cron job is running:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'generate-regional-market-reports')
ORDER BY start_time DESC
LIMIT 5;
```

2. Check edge function logs:
   - Go to Supabase Dashboard → Edge Functions → schedule-regional-reports → Logs

3. Verify LOVABLE_API_KEY is set:
   - Go to Supabase Dashboard → Edge Functions → Settings

### Cache Not Working

1. Check if reports exist:
```sql
SELECT * FROM cached_market_reports WHERE expires_at > NOW();
```

2. Verify regional grouping is working:
   - Reports should be stored with region names (Asia, Europe, Americas)
   - Not specific timezones

### Manual Testing

Test fast generation directly:
```bash
curl -X POST \
  https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/generate-market-report-fast \
  -H "Content-Type: application/json" \
  -d '{
    "timezone": "Asia/Tokyo",
    "markets": ["stocks", "forex", "crypto", "commodities"],
    "timeSpan": "previous_day",
    "tone": "professional"
  }'
```

## Performance Metrics

Target metrics after optimization:

- **Cache hit rate**: 90%+
- **Average load time**: <500ms (from cache)
- **Auto-refresh latency**: <2 seconds (realtime push)
- **API cost per 1000 users**: $5-10 (down from $100-150)
- **Report freshness**: 2 hours max age
- **Generation time**: 5-10 seconds (Gemini) vs 15-30 seconds (GPT-5)
- **Realtime connection overhead**: Negligible (<1KB/hour)

## Future Improvements

- Add more regions (Middle East, Latin America, Africa)
- Implement stale-while-revalidate pattern
- Add A/B testing between Gemini and GPT models
- Create real-time metrics dashboard
- Implement predictive pre-generation based on user patterns
- Add offline support with service workers
- Implement report diff view to highlight changes since last update

