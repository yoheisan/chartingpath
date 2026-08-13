import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Which pattern_ids the detection engine actually produces.
 *
 * Source of truth is public.supported_patterns, seeded from the distinct
 * pattern_id values present in historical_pattern_occurrences (derived, not
 * hardcoded) so it stays correct if the engine gains detectors later.
 *
 * Candlestick patterns (hammer, doji, engulfing, star formations) ARE detectable
 * from the OHLC data we already hold. They are deliberately not built yet because
 * our outcome measurement has an unresolved bias (win rates sit below the ~50%
 * coin-flip benchmark at 1R and we have not quantified how much comes from
 * same-bar stop/target ambiguity). This omission is a decision, not an oversight.
 */
export function useSupportedPatterns() {
  const [supported, setSupported] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("supported_patterns")
        .select("pattern_id, is_supported")
        .eq("is_supported", true);
      if (cancelled) return;
      setSupported(new Set((data ?? []).map((r: { pattern_id: string }) => r.pattern_id)));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // While loading, treat everything as supported so the UI never flickers
  // options out from under the user.
  const isSupported = (patternId: string) =>
    loading || supported.size === 0 || supported.has(patternId);

  return { supported, isSupported, loading };
}
