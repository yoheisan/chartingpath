-- Create table for user strategies
CREATE TABLE public.user_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  strategy_code TEXT NOT NULL,
  strategy_type TEXT NOT NULL DEFAULT 'custom', -- 'custom', 'template'
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_strategies ENABLE ROW LEVEL SECURITY;

-- Create policies for user strategies
CREATE POLICY "Users can view their own strategies" 
ON public.user_strategies 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own strategies" 
ON public.user_strategies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own strategies" 
ON public.user_strategies 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own strategies" 
ON public.user_strategies 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for strategy performance tracking
CREATE TABLE public.strategy_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID NOT NULL,
  user_id UUID NOT NULL,
  execution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_trades INTEGER NOT NULL DEFAULT 0,
  winning_trades INTEGER NOT NULL DEFAULT 0,
  losing_trades INTEGER NOT NULL DEFAULT 0,
  total_pnl DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  max_drawdown DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  win_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  avg_win DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  avg_loss DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.strategy_performance ENABLE ROW LEVEL SECURITY;

-- Create policies for strategy performance
CREATE POLICY "Users can view their own strategy performance" 
ON public.strategy_performance 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create strategy performance records" 
ON public.strategy_performance 
FOR INSERT 
WITH CHECK (true);

-- Create table for strategy execution logs
CREATE TABLE public.strategy_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID NOT NULL,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL, -- 'long', 'short', 'exit'
  price DECIMAL(15,4) NOT NULL,
  quantity DECIMAL(15,2) NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paper_trade_id UUID, -- Reference to paper_trades table
  execution_reason TEXT, -- What triggered the signal
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.strategy_executions ENABLE ROW LEVEL SECURITY;

-- Create policies for strategy executions
CREATE POLICY "Users can view their own strategy executions" 
ON public.strategy_executions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create strategy execution records" 
ON public.strategy_executions 
FOR INSERT 
WITH CHECK (true);

-- Add updated_at trigger to user_strategies
CREATE TRIGGER update_user_strategies_updated_at
BEFORE UPDATE ON public.user_strategies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_user_strategies_user_id ON public.user_strategies(user_id);
CREATE INDEX idx_strategy_performance_strategy_id ON public.strategy_performance(strategy_id);
CREATE INDEX idx_strategy_performance_user_id ON public.strategy_performance(user_id);
CREATE INDEX idx_strategy_executions_strategy_id ON public.strategy_executions(strategy_id);
CREATE INDEX idx_strategy_executions_user_id ON public.strategy_executions(user_id);