import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useCopilotInsight(userId: string | undefined) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) return;

      const res = await supabase.functions.invoke('generate-insight', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.insight) {
        setInsight(res.data.insight);
      }
    } catch (e) {
      console.error('Failed to generate insight:', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial load: check cache first
  useEffect(() => {
    if (!userId) return;

    const loadCached = async () => {
      const { data } = await supabase
        .from('insight_cache' as any)
        .select('insight, generated_at')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const age = Date.now() - new Date((data as any).generated_at).getTime();
        setInsight((data as any).insight);
        // Refresh if older than 1 hour
        if (age > 60 * 60 * 1000) {
          generate();
        }
      } else {
        generate();
      }
    };

    loadCached();
  }, [userId, generate]);

  // Realtime: listen for paper_trades outcome changes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('insight-trade-watcher')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'paper_trades',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const oldOutcome = payload.old?.outcome;
          const newOutcome = payload.new?.outcome;
          if (oldOutcome === 'open' && (newOutcome === 'win' || newOutcome === 'loss')) {
            // Trade just closed — regenerate insight
            generate();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, generate]);

  // Realtime: listen for insight_cache updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('insight-cache-watcher')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'insight_cache',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new?.insight) {
            setInsight(payload.new.insight);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return { insight, loading, regenerate: generate };
}
