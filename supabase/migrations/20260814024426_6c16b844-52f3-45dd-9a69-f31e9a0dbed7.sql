CREATE TABLE IF NOT EXISTS public.geometry_resolve_progress (
  id integer PRIMARY KEY DEFAULT 1,
  last_id uuid,
  processed bigint NOT NULL DEFAULT 0,
  set_atr bigint NOT NULL DEFAULT 0,
  set_pivot bigint NOT NULL DEFAULT 0,
  left_unknown bigint NOT NULL DEFAULT 0,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT geometry_resolve_progress_singleton CHECK (id = 1)
);

GRANT ALL ON public.geometry_resolve_progress TO service_role;

ALTER TABLE public.geometry_resolve_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read geometry resolve progress" ON public.geometry_resolve_progress;
CREATE POLICY "admins read geometry resolve progress"
ON public.geometry_resolve_progress FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.geometry_resolve_progress (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.resolve_geometry_source(p_batch_size integer DEFAULT 20000)
RETURNS TABLE(processed integer, set_atr integer, set_pivot integer, left_unknown integer, last_id uuid, finished boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cursor uuid;
  v_processed int := 0;
  v_atr int := 0;
  v_pivot int := 0;
  v_unknown int := 0;
  v_max uuid;
BEGIN
  SELECT p.last_id INTO v_cursor FROM public.geometry_resolve_progress p WHERE p.id = 1;

  CREATE TEMP TABLE _geo_batch ON COMMIT DROP AS
  WITH batch AS (
    SELECT o.id, o.symbol, o.timeframe, o.detected_at, o.entry_price, o.stop_loss_price
    FROM public.historical_pattern_occurrences o
    WHERE o.geometry_source = 'unknown'
      AND (v_cursor IS NULL OR o.id > v_cursor)
    ORDER BY o.id
    LIMIT p_batch_size
  )
  SELECT
    b.id,
    CASE
      WHEN a.n = 14 AND a.atr14 > 0 AND b.entry_price IS NOT NULL AND b.stop_loss_price IS NOT NULL THEN
        CASE
          WHEN abs(abs(b.entry_price - b.stop_loss_price) - (2 * a.atr14)) <= 0.02 * (2 * a.atr14) THEN 'atr_fallback'
          WHEN abs(abs(b.entry_price - b.stop_loss_price) - (2 * a.atr14)) >  0.10 * (2 * a.atr14) THEN 'pivot'
          ELSE 'unknown'
        END
      ELSE 'unknown'
    END AS label
  FROM batch b
  LEFT JOIN LATERAL (
    SELECT avg(h.high - h.low) AS atr14, count(*) AS n
    FROM (
      SELECT hp.high, hp.low
      FROM public.historical_prices hp
      WHERE hp.symbol = b.symbol
        AND hp.timeframe = b.timeframe
        AND hp.date < b.detected_at
      ORDER BY hp.date DESC
      LIMIT 14
    ) h
  ) a ON true;

  SELECT count(*)::int, max(g.id) INTO v_processed, v_max FROM _geo_batch g;

  IF v_processed = 0 THEN
    UPDATE public.geometry_resolve_progress SET done = true, updated_at = now() WHERE id = 1;
    RETURN QUERY SELECT 0, 0, 0, 0, v_cursor, true;
    RETURN;
  END IF;

  UPDATE public.historical_pattern_occurrences o
  SET geometry_source = g.label
  FROM _geo_batch g
  WHERE o.id = g.id AND g.label <> 'unknown';

  SELECT
    count(*) FILTER (WHERE g.label = 'atr_fallback')::int,
    count(*) FILTER (WHERE g.label = 'pivot')::int,
    count(*) FILTER (WHERE g.label = 'unknown')::int
  INTO v_atr, v_pivot, v_unknown
  FROM _geo_batch g;

  UPDATE public.geometry_resolve_progress p
  SET last_id = v_max,
      processed = p.processed + v_processed,
      set_atr = p.set_atr + v_atr,
      set_pivot = p.set_pivot + v_pivot,
      left_unknown = p.left_unknown + v_unknown,
      updated_at = now()
  WHERE p.id = 1;

  RETURN QUERY SELECT v_processed, v_atr, v_pivot, v_unknown, v_max, false;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_geometry_source(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_geometry_source(integer) TO service_role;

SELECT cron.schedule(
  'resolve-geometry-source',
  '* * * * *',
  $cron$
  DO $inner$
  DECLARE r record;
  BEGIN
    IF EXISTS (SELECT 1 FROM public.geometry_resolve_progress WHERE id = 1 AND done) THEN
      PERFORM cron.unschedule('resolve-geometry-source');
      RETURN;
    END IF;
    SET LOCAL statement_timeout = '55s';
    SELECT * INTO r FROM public.resolve_geometry_source(10000);
  END
  $inner$;
  $cron$
);