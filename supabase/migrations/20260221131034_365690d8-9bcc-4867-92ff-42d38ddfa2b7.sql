INSERT INTO scheduled_posts (account_id, post_type, platform, content, scheduled_time, timezone, recurrence_pattern, report_config, status, link_back_url)
VALUES (
  '444515a1-d102-4142-886a-5d333392f9dc',
  'market_report',
  'twitter',
  'Shanghai/HK Open report',
  '2026-02-23 01:30:00+00',
  'Asia/Shanghai',
  'weekdays',
  '{"markets": ["stocks", "forex", "crypto", "commodities"], "timeSpan": "pre_market", "tone": "professional", "sessionName": "Shanghai/HK Open"}'::jsonb,
  'scheduled',
  'https://chartingpath.com/tools/market-breadth'
);