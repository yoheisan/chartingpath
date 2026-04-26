import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RegimeContext {
  date: string;
  vix_close: number;
  vix_regime: 'low' | 'medium' | 'high' | 'extreme';
  spy_above_50ma: boolean;
  market_regime: 'risk_on' | 'risk_off' | 'neutral' | 'trending' | 'ranging';
  breadth_pct_200ma: number;
}

export interface PatternRegimeStat {
  regime: 'risk_on' | 'risk_off' | 'neutral' | 'trending' | 'ranging';
  win_rate: number;
  sample_size: number;
  avg_r: number;
}

export function useRegimeContext() {
  return useQuery({
    queryKey: ['regime-context'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('pattern_macro_context')
        .select('*')
        .order('detection_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        // Table may not exist yet — fail silently so callers can render nothing.
        return null;
      }
      return (data ?? null) as RegimeContext | null;
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
    retry: false,
  });
}

export function usePatternRegimeStats(patternKey: string) {
  return useQuery({
    queryKey: ['pattern-regime-stats', patternKey],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_pattern_regime_stats', {
        p_pattern_id: patternKey,
      });
      if (error) return null;
      return (data ?? null) as PatternRegimeStat[] | null;
    },
    enabled: !!patternKey,
    staleTime: 1000 * 60 * 30,
    retry: false,
  });
}