CREATE OR REPLACE FUNCTION public.get_pattern_concentration()
RETURNS TABLE(
  asset_type text,
  timeframe text,
  pattern_count bigint,
  grade_a bigint,
  grade_b bigint,
  grade_c bigint,
  grade_d bigint,
  avg_grade_score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.asset_type,
    d.timeframe,
    COUNT(*) AS pattern_count,
    COUNT(*) FILTER (WHERE d.quality_score = 'A') AS grade_a,
    COUNT(*) FILTER (WHERE d.quality_score = 'B') AS grade_b,
    COUNT(*) FILTER (WHERE d.quality_score = 'C') AS grade_c,
    COUNT(*) FILTER (WHERE d.quality_score IN ('D', 'F')) AS grade_d,
    ROUND(AVG(CASE d.quality_score
      WHEN 'A' THEN 4
      WHEN 'B' THEN 3
      WHEN 'C' THEN 2
      WHEN 'D' THEN 1
      WHEN 'F' THEN 0
      ELSE 2
    END), 2) AS avg_grade_score
  FROM live_pattern_detections d
  WHERE d.status = 'active'
  GROUP BY d.asset_type, d.timeframe
  ORDER BY avg_grade_score DESC, pattern_count DESC;
$$;