import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LiveTrade {
  id: string;
  ticker: string;
  entry_price: number;
  exit_price: number | null;
  pnl_r: number | null;
  pnl_dollars: number | null;
  outcome: string;
  attribution: string | null;
  setup_type: string | null;
  copilot_reasoning: string | null;
  broker_order_id: string | null;
  filled_price: number | null;
  slippage_r: number | null;
  entry_time: string | null;
  exit_time: string | null;
  source: string | null;
  gate_result: string | null;
  user_action: string | null;
}

export function useLiveTrades(userId?: string) {
  const [trades, setTrades] = useState<LiveTrade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('live_trades')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00`)
      .order('created_at', { ascending: false });
    setTrades((data as any[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchTrades();
    if (!userId) return;
    const ch = supabase
      .channel('live-trades-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_trades', filter: `user_id=eq.${userId}` }, () => fetchTrades())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, fetchTrades]);

  const stats = useMemo(() => {
    const aiTrades = trades.filter(t => t.attribution === 'ai_approved');
    const humanTrades = trades.filter(t => t.attribution === 'human_overwrite');
    const closedAi = aiTrades.filter(t => t.outcome !== 'open');
    const closedHuman = humanTrades.filter(t => t.outcome !== 'open');
    const aiPnlR = aiTrades.reduce((s, t) => s + (t.pnl_r ?? 0), 0);
    const humanPnlR = humanTrades.reduce((s, t) => s + (t.pnl_r ?? 0), 0);
    const aiWins = closedAi.filter(t => (t.pnl_r ?? 0) > 0).length;
    const humanWins = closedHuman.filter(t => (t.pnl_r ?? 0) > 0).length;
    return {
      aiPnlR: Math.round(aiPnlR * 100) / 100,
      aiWinRate: closedAi.length > 0 ? Math.round((aiWins / closedAi.length) * 100) : 0,
      aiTradeCount: aiTrades.length,
      humanPnlR: Math.round(humanPnlR * 100) / 100,
      humanWinRate: closedHuman.length > 0 ? Math.round((humanWins / closedHuman.length) * 100) : 0,
      humanTradeCount: humanTrades.length,
    };
  }, [trades]);

  return { trades, stats, loading, refetch: fetchTrades };
}
