-- Verify the figures in src/config/outcomeStats.ts
-- Run against the production Supabase database after every backfill and
-- update src/config/outcomeStats.ts if any figure has drifted.
-- Baseline captured 2026-07-30 (shown as `expected` in comments).

-- Total rows                                  expected: 660,143
select count(*) as total_rows
from historical_pattern_occurrences;

-- Resolved vs timeout    expected: resolved 509,881 / timeout 150,261
select
  count(*) filter (where outcome in ('hit_tp','hit_sl')) as resolved,
  count(*) filter (where outcome not in ('hit_tp','hit_sl') or outcome is null) as timeout
from historical_pattern_occurrences;

-- Distinct symbols with outcomes              expected: 770
select count(distinct symbol) as symbols_with_outcomes
from historical_pattern_occurrences
where outcome in ('hit_tp','hit_sl');

-- Active instrument universe                  expected: 821
select count(*) as active_instruments
from instruments
where is_active;

-- Asset types actually stored (drives ASSET_CLASS_TO_DB in
-- src/config/patternStatsConstants.ts)
-- expected: commodities, crypto, etfs, fx, indices, stocks
select distinct asset_type
from historical_pattern_occurrences
order by 1;

-- Timeframes actually stored (drives BARS_PER_YEAR)   expected: 6 values incl. 15m
select timeframe, count(*) as resolved
from historical_pattern_occurrences
where outcome in ('hit_tp','hit_sl')
group by 1
order by 2 desc;

-- Pattern coverage                            expected: 17
select count(distinct pattern_id) as patterns
from historical_pattern_occurrences;

-- History start                               expected: 2006-05-06
select min(detected_at)::date as history_start
from historical_pattern_occurrences;

-- Aggregate performance
-- expected: win rate 0.306, avg R:R 1.83, expectancy -0.136R
select
  round(avg((outcome = 'hit_tp')::int)::numeric, 3) as win_rate,
  round(avg(risk_reward_ratio)::numeric, 2)         as avg_rr,
  round((
    avg((outcome = 'hit_tp')::int) * avg(risk_reward_ratio)
    - avg((outcome = 'hit_sl')::int)
  )::numeric, 3)                                    as expectancy_r
from historical_pattern_occurrences
where outcome in ('hit_tp','hit_sl');