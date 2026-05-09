
INSERT INTO public.translation_keys (key, category) VALUES
  ('paperTrading.todayTitle','paperTrading'),
  ('paperTrading.tradeClosed','paperTrading'),
  ('paperTrading.tradesClosed','paperTrading'),
  ('paperTrading.todayPnl','paperTrading'),
  ('paperTrading.shareOfTotal','paperTrading'),
  ('paperTrading.winsLosses','paperTrading'),
  ('paperTrading.cumulativeLabel','paperTrading'),
  ('paperTrading.moreTrades','paperTrading')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.translations (key, language_code, value, status) VALUES
  ('paperTrading.todayTitle','en','Today','approved'),
  ('paperTrading.tradeClosed','en','trade closed','approved'),
  ('paperTrading.tradesClosed','en','trades closed','approved'),
  ('paperTrading.todayPnl','en','Today''s P&L','approved'),
  ('paperTrading.shareOfTotal','en','Share of total','approved'),
  ('paperTrading.winsLosses','en','Wins / Losses','approved'),
  ('paperTrading.cumulativeLabel','en','Cumulative','approved'),
  ('paperTrading.moreTrades','en','more','approved'),
  ('paperTrading.todayTitle','ja','今日','approved'),
  ('paperTrading.tradeClosed','ja','取引クローズ','approved'),
  ('paperTrading.tradesClosed','ja','取引クローズ','approved'),
  ('paperTrading.todayPnl','ja','今日の損益','approved'),
  ('paperTrading.shareOfTotal','ja','合計に占める割合','approved'),
  ('paperTrading.winsLosses','ja','勝ち / 負け','approved'),
  ('paperTrading.cumulativeLabel','ja','累積','approved'),
  ('paperTrading.moreTrades','ja','件','approved')
ON CONFLICT (key, language_code, version) DO NOTHING;
