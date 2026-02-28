import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ContentType } from './useCommunityFeed';

export function useCommunityEngagement(onUpdate?: () => void) {
  const toggleLike = useCallback(async (contentType: ContentType, contentId: string, isCurrentlyLiked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Sign in to like setups');
      return;
    }

    try {
      if (isCurrentlyLiked) {
        await supabase
          .from('community_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('content_type', contentType)
          .eq('content_id', contentId);
      } else {
        await supabase
          .from('community_likes')
          .insert({ user_id: user.id, content_type: contentType, content_id: contentId });
      }
      onUpdate?.();
    } catch (err) {
      console.error('[toggleLike]', err);
      toast.error('Failed to update like');
    }
  }, [onUpdate]);

  const toggleBookmark = useCallback(async (contentType: ContentType, contentId: string, isCurrentlyBookmarked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Sign in to bookmark setups');
      return;
    }

    try {
      if (isCurrentlyBookmarked) {
        await supabase
          .from('community_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('content_type', contentType)
          .eq('content_id', contentId);
      } else {
        await supabase
          .from('community_bookmarks')
          .insert({ user_id: user.id, content_type: contentType, content_id: contentId });
      }
      onUpdate?.();
    } catch (err) {
      console.error('[toggleBookmark]', err);
      toast.error('Failed to update bookmark');
    }
  }, [onUpdate]);

  return { toggleLike, toggleBookmark };
}
