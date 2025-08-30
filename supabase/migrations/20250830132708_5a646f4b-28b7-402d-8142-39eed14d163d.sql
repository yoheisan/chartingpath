-- Create backtest_runs table for storing backtesting results
CREATE TABLE public.backtest_runs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    strategy_id uuid,
    strategy_version text,
    strategy_name text NOT NULL,
    
    -- Backtest parameters
    instrument text NOT NULL,
    timeframe text NOT NULL,
    from_date timestamp with time zone NOT NULL,
    to_date timestamp with time zone NOT NULL,
    initial_capital numeric NOT NULL DEFAULT 10000,
    position_sizing_type text NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
    position_size numeric NOT NULL DEFAULT 10,
    stop_loss numeric,
    take_profit numeric,
    order_type text NOT NULL DEFAULT 'market', -- 'market' or 'limit'
    commission numeric NOT NULL DEFAULT 0,
    slippage numeric NOT NULL DEFAULT 0,
    
    -- Technical parameters
    engine_version text NOT NULL DEFAULT '1.0',
    parameters jsonb NOT NULL DEFAULT '{}',
    
    -- Results (KPIs)
    win_rate numeric,
    profit_factor numeric,
    net_pnl numeric,
    max_drawdown numeric,
    sharpe_ratio numeric,
    sortino_ratio numeric,
    total_trades integer,
    avg_win numeric,
    avg_loss numeric,
    avg_rr numeric, -- Risk/Reward ratio
    exposure_percentage numeric,
    expectancy numeric,
    avg_holding_time_hours numeric,
    cagr numeric,
    
    -- Metadata
    status text NOT NULL DEFAULT 'completed', -- 'queued', 'running', 'completed', 'failed'
    error_message text,
    run_duration_seconds integer,
    bars_processed integer,
    data_granularity text,
    fee_model text,
    
    -- User organization
    tags text[] DEFAULT '{}',
    notes text,
    is_starred boolean DEFAULT false,
    
    -- Artifacts paths (for storing chart data, trade logs, etc.)
    equity_curve_data jsonb,
    drawdown_data jsonb,
    trade_log jsonb,
    
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backtest_runs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own backtest runs"
    ON public.backtest_runs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backtest runs"
    ON public.backtest_runs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backtest runs"
    ON public.backtest_runs
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backtest runs"
    ON public.backtest_runs
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_backtest_runs_user_id ON public.backtest_runs(user_id);
CREATE INDEX idx_backtest_runs_created_at ON public.backtest_runs(created_at DESC);
CREATE INDEX idx_backtest_runs_strategy_id ON public.backtest_runs(strategy_id);
CREATE INDEX idx_backtest_runs_instrument ON public.backtest_runs(instrument);
CREATE INDEX idx_backtest_runs_status ON public.backtest_runs(status);
CREATE INDEX idx_backtest_runs_tags ON public.backtest_runs USING GIN(tags);

-- Create backtest_presets table for storing parameter presets
CREATE TABLE public.backtest_presets (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    parameters jsonb NOT NULL DEFAULT '{}',
    is_public boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for presets
ALTER TABLE public.backtest_presets ENABLE ROW LEVEL SECURITY;

-- Create policies for presets
CREATE POLICY "Users can view their own presets and public ones"
    ON public.backtest_presets
    FOR SELECT
    USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own presets"
    ON public.backtest_presets
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presets"
    ON public.backtest_presets
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presets"
    ON public.backtest_presets
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_backtest_runs_updated_at
    BEFORE UPDATE ON public.backtest_runs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_backtest_presets_updated_at
    BEFORE UPDATE ON public.backtest_presets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();