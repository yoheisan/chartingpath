import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CopilotTrade {
  id: string;
  symbol: string;
  trade_type: string;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  pnl: number | null;
  outcome_r: number | null;
  status: string;
  stop_loss: number | null;
  take_profit: number | null;
  created_at: string;
  closed_at: string | null;
  close_reason: string | null;
  attribution: string | null;
  source: string | null;
  gate_result: string | null;
  setup_type: string | null;
  copilot_reasoning: string | null;
  outcome: string | null;
  user_action: string | null;
  timeframe: string | null;
  detection_id: string | null;
}

export interface CopilotStats {
  aiPnlR: number;
  aiWinRate: number;
  aiTradeCount: number;
  humanPnlR: number;
  humanWinRate: number;
  humanTradeCount: number;
  aiAvgR: number;
  humanAvgR: number;
}

export function useCopilotTrades(userId?: string) {
  const [todayTrades, setTodayTrades] = useState<CopilotTrade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch all open trades (regardless of date) + today's closed trades
      const [openRes, closedRes] = await Promise.all([
        supabase
          .from('paper_trades')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'open')
          .order('created_at', { ascending: false }),
        supabase
          .from('paper_trades')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'closed')
          .gte('closed_at', `${today}T00:00:00`)
          .order('created_at', { ascending: false }),
      ]);

      if (openRes.error) console.error('[CopilotTrades] open fetch error:', openRes.error);
      if (closedRes.error) console.error('[CopilotTrades] closed fetch error:', closedRes.error);

      const allTrades = [
        ...((openRes.data as any[]) || []),
        ...((closedRes.data as any[]) || []),
      ];
      setTodayTrades(allTrades);
    } catch (err) {
      console.error('[CopilotTrades] error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTrades();
    if (!userId) return;

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchTrades, 60_000);

    const channel = supabase
      .channel('copilot-trades-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'paper_trades',
        filter: `user_id=eq.${userId}`,
      }, () => fetchTrades())
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [userId, fetchTrades]);

  const stats = useMemo((): CopilotStats => {
    const aiTrades = todayTrades.filter(t => t.attribution === 'ai_approved' || t.attribution === 'ai_partial');
    const humanTrades = todayTrades.filter(t => t.attribution === 'human_overwrite');

    const closedAi = aiTrades.filter(t => t.status === 'closed');
    const closedHuman = humanTrades.filter(t => t.status === 'closed');

    const aiPnlR = aiTrades.reduce((sum, t) => sum + (t.outcome_r ?? 0), 0);
    const humanPnlR = humanTrades.reduce((sum, t) => sum + (t.outcome_r ?? 0), 0);

    const aiWins = closedAi.filter(t => (t.outcome_r ?? 0) > 0).length;
    const humanWins = closedHuman.filter(t => (t.outcome_r ?? 0) > 0).length;

    return {
      aiPnlR: Math.round(aiPnlR * 100) / 100,
      aiWinRate: closedAi.length > 0 ? Math.round((aiWins / closedAi.length) * 100) : 0,
      aiTradeCount: aiTrades.length,
      humanPnlR: Math.round(humanPnlR * 100) / 100,
      humanWinRate: closedHuman.length > 0 ? Math.round((humanWins / closedHuman.length) * 100) : 0,
      humanTradeCount: humanTrades.length,
      aiAvgR: aiTrades.length > 0 ? Math.round((aiPnlR / aiTrades.length) * 100) / 100 : 0,
      humanAvgR: humanTrades.length > 0 ? Math.round((humanPnlR / humanTrades.length) * 100) / 100 : 0,
    };
  }, [todayTrades]);

  const openTrades = useMemo(() => todayTrades.filter(t => t.status === 'open'), [todayTrades]);
  const closedTrades = useMemo(() => todayTrades.filter(t => t.status === 'closed'), [todayTrades]);

  return {
    todayTrades,
    openTrades,
    closedTrades,
    stats,
    loading,
    refetch: fetchTrades,
  };
}
