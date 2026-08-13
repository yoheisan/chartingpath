CREATE TABLE public.supported_patterns (
  pattern_id text PRIMARY KEY,
  is_supported boolean NOT NULL DEFAULT false,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.supported_patterns IS
'Which pattern_id values the detection engine actually produces. Seeded from distinct pattern_id in historical_pattern_occurrences (derived, not hardcoded), so it stays correct if the engine gains detectors later.
Candlestick patterns (hammer, doji, engulfing, star formations) ARE detectable from the OHLC data we already hold: 23,530 doji, 6,442 hammers, 4,251 bullish engulfing and 8,010 bearish engulfing were found in 302,054 daily stock bars alone using standard body-to-range definitions. They are deliberately NOT built right now because our outcome measurement has an unresolved bias (win rates sit below the ~50% coin-flip benchmark at 1R and we have not yet quantified how much of that comes from same-bar stop/target ambiguity). Adding seven new patterns into a measurement frame we know is biased would produce seven more numbers of unknown validity. This omission is a decision, not an oversight.';

GRANT SELECT ON public.supported_patterns TO anon, authenticated;
GRANT ALL ON public.supported_patterns TO service_role;

ALTER TABLE public.supported_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supported patterns are publicly readable"
  ON public.supported_patterns FOR SELECT USING (true);

CREATE POLICY "Admins manage supported patterns"
  ON public.supported_patterns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_supported_patterns_updated_at
  BEFORE UPDATE ON public.supported_patterns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: every enum value, marked supported only if the engine has actually produced it
INSERT INTO public.supported_patterns (pattern_id, is_supported, note)
SELECT e.pattern_id,
       EXISTS (SELECT 1 FROM public.historical_pattern_occurrences h WHERE h.pattern_id = e.pattern_id),
       CASE WHEN EXISTS (SELECT 1 FROM public.historical_pattern_occurrences h WHERE h.pattern_id = e.pattern_id)
            THEN NULL
            ELSE 'No detector implemented; see table comment.' END
FROM (SELECT unnest(enum_range(NULL::public.chart_pattern))::text AS pattern_id) e
ON CONFLICT (pattern_id) DO NOTHING;