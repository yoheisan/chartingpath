import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { track } from '@/services/analytics';

export function useSharePattern() {
  const [sharing, setSharing] = useState(false);

  const sharePattern = useCallback(async (dbId: string, instrument: string, patternName: string) => {
    if (!dbId) {
      toast.error('Cannot share this pattern');
      return;
    }

    setSharing(true);
    try {
      const { data, error } = await supabase.functions.invoke('share-pattern', {
        body: { id: dbId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate share link');

      const shareUrl = `${window.location.origin}/s/${data.shareToken}`;

      // Try native share API first (mobile), fallback to clipboard
      if (navigator.share) {
        await navigator.share({
          title: `${patternName} on ${instrument}`,
          text: `Check out this ${patternName} pattern on ${instrument}`,
          url: shareUrl,
        });
        toast.success('Shared successfully');
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied to clipboard!');
      }

      track('pattern_shared', {
        instrument,
        pattern_name: patternName,
        share_token: data.shareToken,
        method: navigator.share ? 'native' : 'clipboard',
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') return; // User cancelled native share
      console.error('[useSharePattern]', err);
      toast.error('Failed to create share link');
    } finally {
      setSharing(false);
    }
  }, []);

  return { sharePattern, sharing };
}
