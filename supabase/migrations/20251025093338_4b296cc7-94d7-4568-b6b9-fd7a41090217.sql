-- Add unsubscribe token to market report subscriptions
ALTER TABLE public.market_report_subscriptions 
ADD COLUMN unsubscribe_token uuid DEFAULT gen_random_uuid() UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_market_report_subscriptions_unsubscribe_token 
ON public.market_report_subscriptions(unsubscribe_token);

-- Backfill tokens for existing subscriptions
UPDATE public.market_report_subscriptions 
SET unsubscribe_token = gen_random_uuid() 
WHERE unsubscribe_token IS NULL;