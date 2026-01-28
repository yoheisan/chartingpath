import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  difficulty_level: string;
  reading_time_minutes: number;
  tags: string[];
  published_at: string;
  view_count: number;
}

// Lightweight fetch - excludes heavy content field
const fetchArticlesList = async (): Promise<ArticleListItem[]> => {
  const { data, error } = await supabase
    .from('learning_articles')
    .select('id, title, slug, excerpt, category, difficulty_level, reading_time_minutes, tags, published_at, view_count')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Hook to prefetch blog articles on hover intent
 * Call prefetchArticles() on mouseEnter of Learn menu
 */
export const usePrefetchArticles = () => {
  const queryClient = useQueryClient();

  const prefetchArticles = useCallback(() => {
    // Only prefetch if not already cached
    const cached = queryClient.getQueryData(['learning-articles']);
    if (cached) return;

    queryClient.prefetchQuery({
      queryKey: ['learning-articles'],
      queryFn: fetchArticlesList,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  }, [queryClient]);

  return { prefetchArticles };
};
