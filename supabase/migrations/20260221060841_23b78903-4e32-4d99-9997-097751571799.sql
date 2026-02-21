INSERT INTO public.copilot_learned_rules (rule_type, trigger_pattern, rule_content, confidence, source)
VALUES (
  'behavior',
  'user asks for tickers or active setups after viewing pattern rankings',
  'When a user asks for specific tickers, active setups, or live examples of a pattern after seeing Edge Atlas rankings, DO NOT say you cannot help. Instead: (1) Link them directly to the screener with pre-filtered parameters using markdown like [View active Falling Wedge setups](/patterns/live?pattern=falling_wedge&timeframe=1h&asset=stocks), (2) If possible, query live_pattern_detections to show currently active instances, (3) Always provide the bridge from "what works historically" to "what is tradeable now."',
  0.9,
  'rlvr_failure_analysis'
);