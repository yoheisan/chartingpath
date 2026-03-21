import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BrokerConnection {
  id: string;
  broker: string;
  is_live: boolean;
  is_paused: boolean;
  capital_allocated: number | null;
  account_balance: number | null;
  connected_at: string | null;
}

export function useBrokerConnection(userId?: string) {
  const [connection, setConnection] = useState<BrokerConnection | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const { data } = await supabase
      .from('broker_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setConnection(data as any);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
    if (!userId) return;
    const ch = supabase
      .channel('broker-conn-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'broker_connections', filter: `user_id=eq.${userId}` }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, fetch]);

  const setLive = useCallback(async (isLive: boolean) => {
    if (!connection) return;
    await supabase.from('broker_connections').update({ is_live: isLive } as any).eq('id', connection.id);
    fetch();
  }, [connection, fetch]);

  const setPaused = useCallback(async (isPaused: boolean) => {
    if (!connection) return;
    await supabase.from('broker_connections').update({ is_paused: isPaused } as any).eq('id', connection.id);
    fetch();
  }, [connection, fetch]);

  return { connection, loading, refetch: fetch, setLive, setPaused };
}
