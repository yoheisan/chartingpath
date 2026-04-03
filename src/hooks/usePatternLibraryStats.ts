import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PatternLibraryStat {
  pattern_name: string;
  total_detections: number;
  win_rate: number;
  best_timeframe: string;
  best_instrument: string;
}

export function usePatternLibraryStats() {
  return useQuery<PatternLibraryStat[]>({
    queryKey: ['pattern-library-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pattern_library_stats');
      if (error) throw error;
      return (data ?? []) as unknown as PatternLibraryStat[];
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
