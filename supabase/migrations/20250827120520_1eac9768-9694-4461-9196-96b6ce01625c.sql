-- Create paper trading portfolio table
CREATE TABLE public.paper_portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  initial_balance DECIMAL(15,2) NOT NULL DEFAULT 10000.00,
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 10000.00,
  total_pnl DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create paper trades table
CREATE TABLE public.paper_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  portfolio_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  quantity DECIMAL(15,8) NOT NULL,
  entry_price DECIMAL(15,8) NOT NULL,
  exit_price DECIMAL(15,8),
  stop_loss DECIMAL(15,8),
  take_profit DECIMAL(15,8),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  pnl DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Create watchlists table
CREATE TABLE public.watchlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Create trading achievements table for gamification
CREATE TABLE public.trading_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.paper_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for paper_portfolios
CREATE POLICY "Users can view own portfolio"
ON public.paper_portfolios FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own portfolio"
ON public.paper_portfolios FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio"
ON public.paper_portfolios FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for paper_trades
CREATE POLICY "Users can view own trades"
ON public.paper_trades FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trades"
ON public.paper_trades FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades"
ON public.paper_trades FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for watchlists
CREATE POLICY "Users can manage own watchlist"
ON public.watchlists FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for trading_achievements
CREATE POLICY "Users can view own achievements"
ON public.trading_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create achievements"
ON public.trading_achievements FOR INSERT
WITH CHECK (true);

-- Create function to initialize portfolio for new users
CREATE OR REPLACE FUNCTION public.initialize_paper_portfolio()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.paper_portfolios (user_id)
  VALUES (NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create portfolio when profile is created
CREATE TRIGGER initialize_portfolio_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_paper_portfolio();

-- Create function to update portfolio balance
CREATE OR REPLACE FUNCTION public.update_portfolio_balance()
RETURNS TRIGGER AS $$
DECLARE
  portfolio_record RECORD;
  total_trades_pnl DECIMAL(15,2);
BEGIN
  -- Get the portfolio
  SELECT * INTO portfolio_record 
  FROM public.paper_portfolios 
  WHERE user_id = NEW.user_id;
  
  -- Calculate total PnL from all closed trades
  SELECT COALESCE(SUM(pnl), 0) INTO total_trades_pnl
  FROM public.paper_trades 
  WHERE user_id = NEW.user_id AND status = 'closed';
  
  -- Update portfolio
  UPDATE public.paper_portfolios 
  SET 
    current_balance = initial_balance + total_trades_pnl,
    total_pnl = total_trades_pnl,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update portfolio when trades are closed
CREATE TRIGGER update_portfolio_on_trade_close
  AFTER UPDATE ON public.paper_trades
  FOR EACH ROW
  WHEN (NEW.status = 'closed' AND OLD.status != 'closed')
  EXECUTE FUNCTION public.update_portfolio_balance();

-- Create indexes for better performance
CREATE INDEX idx_paper_trades_user_id ON public.paper_trades(user_id);
CREATE INDEX idx_paper_trades_status ON public.paper_trades(status);
CREATE INDEX idx_paper_trades_symbol ON public.paper_trades(symbol);
CREATE INDEX idx_watchlists_user_id ON public.watchlists(user_id);
CREATE INDEX idx_trading_achievements_user_id ON public.trading_achievements(user_id);