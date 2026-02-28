import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { track } from '@/services/analytics';

export type ShareMethod = 'twitter' | 'whatsapp' | 'clipboard';

export interface ShareTradePlan {
  entry: number;
  stopLoss: number;
  takeProfit: number;
  rr: number;
}

export function useSharePattern() {
  const [sharing, setSharing] = useState(false);

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

      // Generate OG share image (non-blocking — don't wait for it)
      supabase.functions.invoke('generate-share-image', {
        body: { token: data.shareToken, pattern_id: dbId },
      }).catch(() => { /* silent — OG image is best-effort */ });

      return `${window.location.origin}/s/${data.shareToken}`;
    } catch (err: any) {
      console.error('[useSharePattern]', err);
      toast.error('Failed to create share link');
      return null;
    } finally {
      setSharing(false);
    }
  }, []);

  const sharePattern = useCallback(async (
    dbId: string,
    instrument: string,
    patternName: string,
    method: ShareMethod = 'clipboard',
    tradePlan?: ShareTradePlan,
    direction?: string,
    shareToCommunity?: boolean,
  ) => {
    const shareUrl = await getShareUrl(dbId);
    if (!shareUrl) return;

    const displaySymbol = instrument.replace('=X', '').replace('=F', '').replace('-USD', '');
    const arrow = direction === 'long' ? '📈' : direction === 'short' ? '📉' : '📊';

    // Build rich text with trade details
    let text = `${arrow} ${patternName} on ${displaySymbol}`;
    if (direction) {
      text += ` (${direction === 'long' ? 'Long' : 'Short'})`;
    }

    if (tradePlan) {
      text += `\n\n🎯 Entry: ${tradePlan.entry}`;
      text += `\n🛑 Stop Loss: ${tradePlan.stopLoss}`;
      text += `\n✅ Take Profit: ${tradePlan.takeProfit}`;
      text += `\n⚖️ R:R 1:${tradePlan.rr.toFixed(2)}`;
    }

    switch (method) {
      case 'twitter': {
        // Twitter has 280 char limit, use a concise version
        let tweet = `${arrow} ${patternName} on #${displaySymbol}`;
        if (direction) tweet += ` ${direction === 'long' ? 'Long' : 'Short'}`;
        if (tradePlan) {
          tweet += ` | Entry ${tradePlan.entry} | SL ${tradePlan.stopLoss} | TP ${tradePlan.takeProfit} | R:R 1:${tradePlan.rr.toFixed(1)}`;
        }
        const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
        toast.success('Opening X (Twitter)…');
        break;
      }
      case 'whatsapp': {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        toast.success('Opening WhatsApp…');
        break;
      }
      case 'clipboard':
      default: {
        try {
          await navigator.clipboard.writeText(`${text}\n\n${shareUrl}`);
          toast.success('Share link copied to clipboard!');
        } catch {
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
