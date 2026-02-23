import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for prefetching article content on hover.
 * All articles are now served dynamically from the database via /blog/:slug.
 */
export function usePrefetchArticle() {
  const queryClient = useQueryClient();
  
  const prefetch = useCallback((slug: string) => {
    // Prefetch the DB article data into React Query cache
    queryClient.prefetchQuery({
      queryKey: ['article', slug],
      queryFn: async () => {
        const { data } = await supabase.rpc('get_article_by_slug', { p_slug: slug });
        return data;
      },
      staleTime: 5 * 60 * 1000, // 5 min
    });
  }, [queryClient]);
  
  return prefetch;
}
