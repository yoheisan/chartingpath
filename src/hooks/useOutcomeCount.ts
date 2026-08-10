import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RESOLVED_OUTCOMES_LABEL } from '@/config/outcomeStats';

export function useOutcomeCount() {
  const { data: count } = useQuery({
    queryKey: ['outcome-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('historical_pattern_occurrences')
        .select('*', { count: 'exact', head: true });
        .in('outcome', ['hit_tp', 'hit_sl']);
      return count ?? null;
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const formatted =
    count != null
      ? count >= 1_000_000
        ? `${(count / 1_000_000).toFixed(1)}M+`
        : `${Math.floor(count / 1_000)}K+`
      : RESOLVED_OUTCOMES_LABEL; // soft fallback, real value loads from DB

  return { count, formatted, isLoading: count == null };
}
