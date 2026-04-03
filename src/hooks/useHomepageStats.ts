import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HomepageStats {
  patterns_this_week: number;
  instruments_tracked: number;
  top_pattern: string;
  top_instrument: string;
  top_win_rate: number;
}

export function useHomepageStats() {
  return useQuery<HomepageStats>({
    queryKey: ['homepage-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_homepage_stats');
      if (error) throw error;
      return data as unknown as HomepageStats;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000,
  });
}
