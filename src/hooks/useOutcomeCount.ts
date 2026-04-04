import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useOutcomeCount() {
  const { data: count } = useQuery({
    queryKey: ['outcome-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('historical_pattern_occurrences')
        .select('*', { count: 'exact', head: true });
      return count ?? null;
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const formatted = count
    ? count >= 1_000_000
      ? `${(count / 1_000_000).toFixed(1)}M+`
      : `${Math.floor(count / 1_000)}K+`
    : '460K+';

  return { count, formatted };
}
