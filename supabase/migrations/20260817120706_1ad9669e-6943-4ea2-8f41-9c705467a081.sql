CREATE OR REPLACE VIEW public.v_live_detections_with_edge AS
WITH cells AS (
  SELECT DISTINCT d_1.pattern_id, d_1.timeframe, d_1.asset_type,
    CASE lower(d_1.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish' ELSE lower(d_1.direction) END AS dir
  FROM live_pattern_detections d_1
  WHERE d_1.status = 'active'
), grouped AS (
  SELECT c.pattern_id, c.timeframe, c.asset_type, c.dir,
    count(h.id) AS total,
    count(h.id) FILTER (WHERE h.outcome = 'hit_tp') AS wins,
    count(h.id) FILTER (WHERE h.outcome = 'hit_sl') AS losses,
    avg(h.risk_reward_ratio) FILTER (WHERE h.risk_reward_ratio IS NOT NULL) AS avg_rr_val,
    avg(h.bars_to_outcome) AS avg_bars_val
  FROM cells c
  LEFT JOIN historical_pattern_occurrences h
    ON h.pattern_id = c.pattern_id AND h.timeframe = c.timeframe AND h.asset_type = c.asset_type
   AND CASE lower(h.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish' ELSE lower(h.direction) END = c.dir
   AND h.outcome = ANY (ARRAY['hit_tp','hit_sl'])
   AND h.bars_to_outcome IS NOT NULL
   AND h.detected_at >= '2024-01-01'::date
   AND h.geometry_source = 'pivot'
   AND h.execution_status = 'valid'
  GROUP BY c.pattern_id, c.timeframe, c.asset_type, c.dir
), edge AS (
  SELECT g.pattern_id, g.timeframe, g.asset_type, g.dir,
    g.total AS total_trades,
    CASE WHEN g.total > 0 THEN g.wins::numeric / g.total::numeric ELSE 0 END AS wr_frac,
    CASE WHEN g.total > 0 THEN round(g.wins::numeric / g.total::numeric * 100, 1) ELSE 0 END AS win_rate_pct,
    CASE WHEN g.total > 0 THEN round(g.wins::numeric / g.total::numeric * COALESCE(g.avg_rr_val, 0) - g.losses::numeric / g.total::numeric, 3) ELSE 0 END AS expectancy_r,
    CASE WHEN COALESCE(g.avg_rr_val, 0) > 0 THEN 1.0 / (1.0 + g.avg_rr_val) ELSE NULL END AS baseline,
    round(COALESCE(g.avg_rr_val, 0), 2) AS avg_rr,
    round(COALESCE(g.avg_bars_val, 0), 1) AS avg_bars
  FROM grouped g
)
SELECT d.id, d.instrument, d.pattern_id, d.pattern_name, d.timeframe, d.asset_type, d.direction, d.status,
  d.entry_price, d.stop_loss_price, d.take_profit_price, d.risk_reward_ratio, d.current_price,
  d.quality_score, d.exchange, d.first_detected_at, d.last_confirmed_at, d.geometry_source,
  'pivot'::text AS edge_geometry_source,
  e.total_trades, e.win_rate_pct, e.expectancy_r,
  COALESCE(get_detection_cost_r(d.entry_price, d.stop_loss_price, d.instrument, d.asset_type, NULL::uuid), get_est_cost_r(d.asset_type, d.timeframe)) AS est_cost_r,
  round(e.expectancy_r - COALESCE(get_detection_cost_r(d.entry_price, d.stop_loss_price, d.instrument, d.asset_type, NULL::uuid), get_est_cost_r(d.asset_type, d.timeframe)), 3) AS expectancy_r_net,
  e.avg_rr, e.avg_bars,
  round((e.wr_frac - e.baseline) * 100, 2) AS edge_points,
  round(e.baseline * 100, 1) AS baseline_win_rate_pct,
  COALESCE(v.status = 'validated', false) AS is_validated,
  COALESCE(v.status, 'unvalidated') AS validation_status,
  COALESCE(cs.status, 'active') AS cell_status,
  cs.suspended_reason,
  COALESCE(e.total_trades >= 100, false)
    AND e.baseline IS NOT NULL AND e.wr_frac > e.baseline
    AND COALESCE((e.expectancy_r - COALESCE(get_detection_cost_r(d.entry_price, d.stop_loss_price, d.instrument, d.asset_type, NULL::uuid), get_est_cost_r(d.asset_type, d.timeframe))) > 0, false)
    AND COALESCE(cs.status, 'active') <> 'suspended'
    AND COALESCE(v.status = 'validated', false) AS qualifies
FROM live_pattern_detections d
LEFT JOIN edge e ON e.pattern_id = d.pattern_id AND e.timeframe = d.timeframe AND e.asset_type = d.asset_type
  AND e.dir = CASE lower(d.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish' ELSE lower(d.direction) END
LEFT JOIN cell_status cs ON cs.pattern_id = d.pattern_id AND cs.timeframe = d.timeframe AND cs.asset_type = d.asset_type
  AND cs.direction = CASE lower(d.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish' ELSE lower(d.direction) END
LEFT JOIN v_cell_validation_latest v ON v.pattern_id = d.pattern_id AND v.timeframe = d.timeframe AND v.asset_type = d.asset_type
  AND v.direction = CASE lower(d.direction) WHEN 'long' THEN 'bullish' WHEN 'short' THEN 'bearish' ELSE lower(d.direction) END
  AND v.entry_mode = 'next_open'
WHERE d.status = 'active';

INSERT INTO public.data_health_checks (check_name, category, description, severity, expected_result, is_enabled)
VALUES ('live_detections_unique_rows', 'live_detections',
  'The live detections view must return exactly one row per active detection. More than one means an edge or validation join fanned out.',
  'critical', '0 rows', true)
ON CONFLICT (check_name) DO NOTHING;

DO $mig$
DECLARE src text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO src
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname='public' AND p.proname='run_extra_health_check';

  IF src IS NOT NULL AND position('live_detections_unique_rows' in src) = 0 THEN
    src := replace(src,
      'ELSIF p_name = ''validation_pool_single_current'' THEN',
      'ELSIF p_name = ''live_detections_unique_rows'' THEN
    SELECT count(*)::int INTO v_dupes FROM (
      SELECT id FROM public.v_live_detections_with_edge GROUP BY id HAVING count(*) > 1
    ) dd;
    passed := v_dupes = 0;
    observed_value := v_dupes || '' live detections returned more than one row'';
    detail := jsonb_build_object(''duplicate_detections'', v_dupes);
    RETURN NEXT; RETURN;

  ELSIF p_name = ''validation_pool_single_current'' THEN');
    EXECUTE src;
  END IF;
END
$mig$;