import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CopilotAlert {
  id: string;
  user_id: string;
  pattern_occurrence_id: string | null;
  alert_type: string;
  symbol: string;
  pattern_type: string | null;
  timeframe: string | null;
  direction: string | null;
  entry_price: number | null;
  target_price: number | null;
  stop_price: number | null;
  rr_ratio: number | null;
  alert_message: string;
  full_context: Record<string, any> | null;
  status: string;
  created_at: string;
}

export function useCopilotAlerts() {
  const { user } = useAuth();
  const [pendingAlerts, setPendingAlerts] = useState<CopilotAlert[]>([]);

  // Initial fetch of pending alerts
  useEffect(() => {
    if (!user) return;

    const fetchPending = async () => {
      const { data } = await supabase
        .from('copilot_alerts' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setPendingAlerts(data as unknown as CopilotAlert[]);
    };

    fetchPending();
  }, [user]);

  // Subscribe to Realtime for new alerts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`copilot-alerts-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'copilot_alerts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newAlert = payload.new as unknown as CopilotAlert;
          if (newAlert.status === 'pending') {
            setPendingAlerts((prev) => [newAlert, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const dismissAlert = useCallback(async (alertId: string) => {
    await supabase
      .from('copilot_alerts' as any)
      .update({ status: 'dismissed' })
      .eq('id', alertId);
    setPendingAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  const actOnAlert = useCallback(async (alertId: string) => {
    await supabase
      .from('copilot_alerts' as any)
      .update({ status: 'acted' })
      .eq('id', alertId);
    setPendingAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  return { pendingAlerts, dismissAlert, actOnAlert };
}
