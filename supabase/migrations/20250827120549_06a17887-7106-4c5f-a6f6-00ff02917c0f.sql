-- Fix search path for initialize_paper_portfolio function
CREATE OR REPLACE FUNCTION public.initialize_paper_portfolio()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.paper_portfolios (user_id)
  VALUES (NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Fix search path for update_portfolio_balance function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';