import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { track } from '@/services/analytics';

export type ShareMethod = 'twitter' | 'whatsapp' | 'clipboard';

export function useSharePattern() {
  const [sharing, setSharing] = useState(false);

  /**
   * Generate a share URL for a pattern (calls edge function once, caches token).
   * Returns the share URL or null on failure.
   */
  const getShareUrl = useCallback(async (dbId: string): Promise<string | null> => {
    if (!dbId) {
      toast.error('Cannot share this pattern');
      return null;
    }

    setSharing(true);
    try {
      const { data, error } = await supabase.functions.invoke('share-pattern', {
        body: { id: dbId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate share link');

      return `${window.location.origin}/s/${data.shareToken}`;
    } catch (err: any) {
      console.error('[useSharePattern]', err);
      toast.error('Failed to create share link');
      return null;
    } finally {
      setSharing(false);
    }
  }, []);

  /**
   * Share a pattern via a specific method.
   */
  const sharePattern = useCallback(async (
    dbId: string,
    instrument: string,
    patternName: string,
    method: ShareMethod = 'clipboard',
  ) => {
    const shareUrl = await getShareUrl(dbId);
    if (!shareUrl) return;

    const text = `Check out this ${patternName} pattern on ${instrument}`;

    switch (method) {
      case 'twitter': {
        const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
        toast.success('Opening X (Twitter)…');
        break;
      }
      case 'whatsapp': {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        toast.success('Opening WhatsApp…');
        break;
      }
      case 'clipboard':
      default: {
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Share link copied to clipboard!');
        } catch {
          // Fallback: prompt user
          prompt('Copy this share link:', shareUrl);
        }
        break;
      }
    }

    track('pattern_shared', {
      instrument,
      pattern_name: patternName,
      method,
    });
  }, [getShareUrl]);

  return { sharePattern, sharing };
}
