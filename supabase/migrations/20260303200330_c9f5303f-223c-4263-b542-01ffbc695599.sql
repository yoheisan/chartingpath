
-- Step 1: Delete slash-format rows where a dash-format equivalent already exists
-- This avoids unique constraint violations during the rename
DELETE FROM public.historical_prices old_row
WHERE old_row.symbol LIKE '%/USD'
  AND old_row.symbol NOT LIKE 'AUD/%'
  AND old_row.symbol NOT LIKE 'EUR/%'
  AND old_row.symbol NOT LIKE 'GBP/%'
  AND old_row.symbol NOT LIKE 'NZD/%'
  AND old_row.symbol NOT LIKE 'USD/%'
  AND old_row.symbol NOT LIKE 'CAD/%'
  AND old_row.symbol NOT LIKE 'CHF/%'
  AND old_row.symbol NOT LIKE 'JPY/%'
  AND EXISTS (
    SELECT 1 FROM public.historical_prices dup
    WHERE dup.symbol = REPLACE(old_row.symbol, '/USD', '-USD')
      AND dup.timeframe = old_row.timeframe
      AND dup.date = old_row.date
  );

-- Step 2: Rename remaining slash-format rows to dash format
UPDATE public.historical_prices
SET symbol = REPLACE(symbol, '/USD', '-USD')
WHERE symbol LIKE '%/USD'
  AND symbol NOT LIKE 'AUD/%'
  AND symbol NOT LIKE 'EUR/%'
  AND symbol NOT LIKE 'GBP/%'
  AND symbol NOT LIKE 'NZD/%'
  AND symbol NOT LIKE 'USD/%'
  AND symbol NOT LIKE 'CAD/%'
  AND symbol NOT LIKE 'CHF/%'
  AND symbol NOT LIKE 'JPY/%';
