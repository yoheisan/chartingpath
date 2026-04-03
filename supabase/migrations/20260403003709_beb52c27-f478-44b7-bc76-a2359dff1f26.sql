
-- Add columns to copilot_training_pairs
ALTER TABLE public.copilot_training_pairs
  ADD COLUMN IF NOT EXISTS quality_weight integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_rescored_at timestamptz;

-- Create the rescoring function
CREATE OR REPLACE FUNCTION public.rescore_copilot_training_pairs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_updated integer := 0;
  v_positive integer := 0;
  v_negative integer := 0;
  v_neutral integer := 0;
  rec RECORD;
  v_trade RECORD;
  v_direction text;
  v_new_weight integer;
BEGIN
  FOR rec IN
    SELECT ctp.id, ctp.user_id, ctp.session_id, ctp.created_at,
           ctp.response, ctp.intent_classification, ctp.parameters_used
    FROM public.copilot_training_pairs ctp
    WHERE ctp.created_at < now() - interval '7 days'
      AND (ctp.last_rescored_at IS NULL OR ctp.last_rescored_at < now() - interval '24 hours')
    ORDER BY ctp.created_at DESC
    LIMIT 500
  LOOP
    -- Try to extract direction hint from the response
    v_direction := CASE
      WHEN rec.response ILIKE '%long%' OR rec.response ILIKE '%buy%' OR rec.response ILIKE '%bullish%' THEN 'long'
      WHEN rec.response ILIKE '%short%' OR rec.response ILIKE '%sell%' OR rec.response ILIKE '%bearish%' THEN 'short'
      ELSE NULL
    END;

    -- Find the closest paper trade by the same user within a 2-hour window after the copilot message
    SELECT pt.status, pt.pnl, pt.outcome_r, pt.trade_type, pt.outcome
    INTO v_trade
    FROM public.paper_trades pt
    WHERE pt.user_id = rec.user_id
      AND pt.created_at BETWEEN rec.created_at AND rec.created_at + interval '2 hours'
    ORDER BY pt.created_at ASC
    LIMIT 1;

    IF v_trade IS NULL THEN
      -- No associated trade found — neutral
      v_new_weight := 0;
      v_neutral := v_neutral + 1;
    ELSIF v_trade.status = 'open' THEN
      -- Trade still open — neutral
      v_new_weight := 0;
      v_neutral := v_neutral + 1;
    ELSE
      -- Trade is closed — check if copilot direction matched the outcome
      IF v_direction IS NULL THEN
        -- Copilot gave no directional advice — score by outcome only
        IF COALESCE(v_trade.pnl, 0) > 0 THEN
          v_new_weight := 1;
          v_positive := v_positive + 1;
        ELSE
          v_new_weight := -1;
          v_negative := v_negative + 1;
        END IF;
      ELSE
        -- Copilot gave directional advice
        IF (v_direction = v_trade.trade_type AND COALESCE(v_trade.pnl, 0) > 0)
           OR (v_direction != v_trade.trade_type AND COALESCE(v_trade.pnl, 0) <= 0) THEN
          -- Copilot was right (matched winning direction, or opposed losing direction)
          v_new_weight := 1;
          v_positive := v_positive + 1;
        ELSE
          v_new_weight := -1;
          v_negative := v_negative + 1;
        END IF;
      END IF;
    END IF;

    UPDATE public.copilot_training_pairs
    SET quality_weight = v_new_weight,
        last_rescored_at = now()
    WHERE id = rec.id;

    v_updated := v_updated + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'rescored', v_updated,
    'positive', v_positive,
    'negative', v_negative,
    'neutral', v_neutral,
    'ran_at', now()
  );
END;
$$;
