-- Add 'behavior' to allowed rule_type values
ALTER TABLE public.copilot_learned_rules DROP CONSTRAINT copilot_learned_rules_rule_type_check;
ALTER TABLE public.copilot_learned_rules ADD CONSTRAINT copilot_learned_rules_rule_type_check 
  CHECK (rule_type = ANY (ARRAY['translation','fallback','correction','few_shot','guardrail','behavior']));

-- Insert the two new learned rules
INSERT INTO public.copilot_learned_rules (rule_type, trigger_pattern, rule_content, confidence, source)
VALUES (
  'behavior',
  'user asks for pattern performance or ROI on a specific instrument',
  'CRITICAL: When a user asks for pattern performance, ROI, or rankings on a specific instrument/timeframe, call the query_edge_atlas tool IMMEDIATELY with the parameters given. Do NOT ask clarifying questions unless the query is genuinely ambiguous (e.g., missing instrument entirely). If the first query returns 0 results, automatically retry with progressively relaxed filters IN THE SAME response rather than asking the user for permission to broaden. Show whatever data you find.',
  0.95,
  'rlvr_failure_analysis'
),
(
  'behavior',
  'tool call returns zero results',
  'When a tool call returns 0 results, do NOT just report the failure. Instead: (1) Immediately retry with the most restrictive filter relaxed, (2) If still 0, try removing another filter, (3) Present whatever results you find with a note about which filters were relaxed. Complete this entire fallback chain in a single response.',
  0.9,
  'rlvr_failure_analysis'
);