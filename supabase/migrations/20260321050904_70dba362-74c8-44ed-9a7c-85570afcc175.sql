
-- broker_connections table
CREATE TABLE IF NOT EXISTS public.broker_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  broker text DEFAULT 'alpaca',
  api_key_encrypted text,
  api_secret_encrypted text,
  is_live boolean DEFAULT false,
  is_paused boolean DEFAULT false,
  capital_allocated numeric,
  account_balance numeric,
  connected_at timestamptz
);

ALTER TABLE public.broker_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own broker connections"
  ON public.broker_connections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- live_trades table (mirrors paper_trades + broker fields)
CREATE TABLE IF NOT EXISTS public.live_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  master_plan_id uuid,
  gate_evaluation_id uuid,
  created_at timestamptz DEFAULT now(),
  ticker text,
  entry_price numeric,
  exit_price numeric,
  position_size_pct numeric,
  pnl_r numeric,
  pnl_dollars numeric,
  entry_time timestamptz,
  exit_time timestamptz,
  hold_duration_mins integer,
  setup_type text,
  copilot_reasoning text,
  source text,
  gate_result text,
  gate_reason text,
  user_action text,
  attribution text,
  outcome text DEFAULT 'open',
  stop_price numeric,
  target_price numeric,
  broker text DEFAULT 'alpaca',
  broker_order_id text,
  filled_price numeric,
  slippage_r numeric
);

ALTER TABLE public.live_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own live trades"
  ON public.live_trades FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.broker_connections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_trades;
