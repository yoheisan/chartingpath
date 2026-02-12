import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface UnreadAlertsState {
  /** Total unread alerts count */
  count: number;
  /** New pattern matches on user's watchlist symbols */
  watchlistCount: number;
  /** Loading state */
  loading: boolean;
  /** Mark all alerts as read */
  markAllRead: () => Promise<void>;
  /** Mark specific alert as read */
  markRead: (alertId: string) => Promise<void>;
  /** Refresh counts manually */
  refresh: () => Promise<void>;
}

/**
 * Hook to track unread alerts with Supabase realtime subscription.
 * Returns counts for badges and methods to mark as read.
 */
export function useUnreadAlerts(userId?: string): UnreadAlertsState {
  const [count, setCount] = useState(0);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    if (!userId) {
      setCount(0);
      setWatchlistCount(0);
      setLoading(false);
      return;
    }

    try {
      // Fetch unread alerts count from alerts_log where email_sent is false or null
      // and triggered within the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: alertCount, error } = await supabase
        .from('alerts_log')
        .select('id, alerts!inner(user_id)', { count: 'exact', head: true })
        .eq('alerts.user_id', userId)
        .gte('triggered_at', sevenDaysAgo.toISOString())
        .is('checked_at', null);

      if (error) {
        console.error('[useUnreadAlerts] Error fetching counts:', error);
      } else {
        setCount(alertCount || 0);
      }

      // Fetch watchlist pattern matches (live patterns matching user watchlist symbols)
      const { data: watchlistData, error: watchlistError } = await supabase
        .from('user_watchlist')
        .select('symbol')
        .eq('user_id', userId);

      if (!watchlistError && watchlistData && watchlistData.length > 0) {
        const symbols = watchlistData.map(w => w.symbol);
        
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const { count: patternCount, error: patternError } = await supabase
          .from('live_pattern_detections')
          .select('id', { count: 'exact', head: true })
          .in('instrument', symbols)
          .gte('first_detected_at', oneDayAgo.toISOString())
          .eq('status', 'active');

        if (!patternError) {
          setWatchlistCount(patternCount || 0);
        }
      }
    } catch (err) {
      console.error('[useUnreadAlerts] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Mark all alerts as read by updating checked_at
  const markAllRead = useCallback(async () => {
    if (!userId) return;

    try {
      // Get all user's alert IDs first
      const { data: userAlerts } = await supabase
        .from('alerts')
        .select('id')
        .eq('user_id', userId);

      if (userAlerts && userAlerts.length > 0) {
        const alertIds = userAlerts.map(a => a.id);
        
        await supabase
          .from('alerts_log')
          .update({ checked_at: new Date().toISOString() })
          .in('alert_id', alertIds);
      }

      setCount(0);
    } catch (err) {
      console.error('[useUnreadAlerts] Error marking all read:', err);
    }
  }, [userId]);

  // Mark specific alert as read
  const markRead = useCallback(async (alertLogId: string) => {
    try {
      await supabase
        .from('alerts_log')
        .update({ checked_at: new Date().toISOString() })
        .eq('id', alertLogId);

      setCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[useUnreadAlerts] Error marking read:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Realtime subscription for new alerts
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('unread-alerts-changes')
      .on<{ alert_id: string; triggered_at: string }>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts_log',
        },
        (payload: RealtimePostgresChangesPayload<{ alert_id: string; triggered_at: string }>) => {
          // Increment count on new alert - we'll verify ownership on next fetch
          setCount(prev => prev + 1);
        }
      )
      .on<{ instrument: string; first_detected_at: string }>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_pattern_detections',
        },
        () => {
          // Refresh watchlist count when new patterns detected
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchCounts]);

  return {
    count,
    watchlistCount,
    loading,
    markAllRead,
    markRead,
    refresh: fetchCounts,
  };
}
