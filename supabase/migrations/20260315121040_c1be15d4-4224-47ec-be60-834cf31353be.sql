
-- Extend existing paper_trades table with missing columns
ALTER TABLE public.paper_trades
  ADD COLUMN IF NOT EXISTS detection_id uuid REFERENCES public.live_pattern_detections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS outcome_r numeric,
  ADD COLUMN IF NOT EXISTS close_reason text,
  ADD COLUMN IF NOT EXISTS override_reason text,
  ADD COLUMN IF NOT EXISTS override_notes text,
  ADD COLUMN IF NOT EXISTS notified_at timestamptz;

-- Fix trade_type constraint to accept long/short in addition to buy/sell
ALTER TABLE public.paper_trades
  DROP CONSTRAINT IF EXISTS paper_trades_trade_type_check;

ALTER TABLE public.paper_trades
  ADD CONSTRAINT paper_trades_trade_type_check
  CHECK (trade_type IN ('buy', 'sell', 'long', 'short'));

-- User signal actions table for outcome feedback loop
CREATE TABLE IF NOT EXISTS public.user_signal_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  detection_id uuid REFERENCES public.live_pattern_detections(id) ON DELETE SET NULL,
  instrument text NOT NULL,
  pattern_id text NOT NULL,
  timeframe text NOT NULL,
  action text NOT NULL CHECK (action IN (
    'paper_trade', 'watchlisted', 'dismissed', 'override'
  )),
  paper_trade_id uuid REFERENCES public.paper_trades(id) ON DELETE SET NULL,
  actioned_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_signal_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own signal actions"
  ON public.user_signal_actions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_signal_actions_user
  ON public.user_signal_actions(user_id, actioned_at DESC);
