import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OutcomeStats {
  total_patterns: number;
  top_win_rate: {
    pattern_name: string;
    timeframe: string;
    win_rate: number;
    sample_count: number;
  } | null;
  most_detected: {
    pattern_name: string;
    count: number;
  } | null;
  instruments_covered: number;
  cached_at: string;
}

export function useOutcomeStats() {
  return useQuery<OutcomeStats>({
    queryKey: ['outcome-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-outcome-stats');
      if (error) throw error;
      return data as OutcomeStats;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 60 * 60 * 1000,
  });
}
