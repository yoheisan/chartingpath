SELECT cron.schedule(
  'manage-trades-every-2min',
  '* * * * *',
  $$SELECT public.invoke_manage_trades_if_needed()$$
);