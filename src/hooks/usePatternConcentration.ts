import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ConcentrationCell {
  asset_type: string;
  timeframe: string;
  pattern_count: number;
  grade_a: number;
  grade_b: number;
  grade_c: number;
  grade_d: number;
  avg_grade_score: number;
}

export function usePatternConcentration() {
  return useQuery<ConcentrationCell[]>({
    queryKey: ['pattern-concentration'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pattern_concentration');
      if (error) throw error;
      return (data ?? []) as unknown as ConcentrationCell[];
    },
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
