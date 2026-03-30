import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PaperPortfolio {
  id: string;
  current_balance: number;
  initial_balance: number;
  total_pnl: number;
}

export interface PaperTrade {
  id: string;
  symbol: string;
  trade_type: string;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  pnl: number | null;
  status: string;
  stop_loss: number | null;
  take_profit: number | null;
  notes: string | null;
  created_at: string;
  closed_at: string | null;
  close_reason: string | null;
  outcome_r: number | null;
  override_reason: string | null;
  override_notes: string | null;
  user_id: string;
}

const OVERRIDE_REASONS = [
  'Market conditions changed',
  'News event risk',
  'Pattern invalidated',
  'Taking partial profit',
  'Risk management',
  'Changed my mind',
] as const;

export { OVERRIDE_REASONS };

export function usePaperTrading(userId?: string) {
  const [portfolio, setPortfolio] = useState<PaperPortfolio | null>(null);
  const [openTrades, setOpenTrades] = useState<PaperTrade[]>([]);
  const [closedTrades, setClosedTrades] = useState<PaperTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [portfolioRes, tradesRes] = await Promise.all([
        supabase.from('paper_portfolios').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('paper_trades').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(500),
      ]);
      console.log('[PaperTrading] portfolioRes:', portfolioRes.error?.message ?? 'ok', portfolioRes.data ? 'has data' : 'no data');
      console.log('[PaperTrading] tradesRes:', tradesRes.error?.message ?? 'ok', tradesRes.data?.length ?? 0, 'trades');
      if (portfolioRes.error) console.error('[PaperTrading] portfolio error:', portfolioRes.error);
      if (tradesRes.error) console.error('[PaperTrading] trades error:', tradesRes.error);
      if (portfolioRes.data) setPortfolio(portfolioRes.data as any);
      if (tradesRes.data) {
        setOpenTrades((tradesRes.data as any[]).filter((t: any) => t.status === 'open'));
        setClosedTrades((tradesRes.data as any[]).filter((t: any) => t.status === 'closed'));
      }
    } catch (err) {
      console.error('[PaperTrading] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
    if (!userId) return;

    const channel = supabase
      .channel('paper-trades-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paper_trades', filter: `user_id=eq.${userId}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paper_portfolios', filter: `user_id=eq.${userId}` }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchData]);

  const handleCloseTrade = useCallback(async (tradeId: string, symbol: string, overrideData?: { reason: string; notes: string; manualPrice?: number }) => {
    setClosingTradeId(tradeId);
    try {
      let exitPrice: number | null = overrideData?.manualPrice ?? null;

      if (exitPrice == null) {
        const { data: latest } = await supabase
          .from('live_pattern_detections')
          .select('current_price')
          .eq('instrument', symbol)
          .order('first_detected_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        exitPrice = latest?.current_price ? Number(latest.current_price) : null;
      }

      const { data: trade } = await supabase
        .from('paper_trades')
        .select('entry_price, quantity, trade_type, stop_loss, user_id')
        .eq('id', tradeId)
        .single();

      if (!trade || exitPrice == null) { toast.error('Could not fetch current price'); return; }

      const isLong = trade.trade_type === 'long' || trade.trade_type === 'buy';
      const pnl = isLong
        ? (exitPrice - Number(trade.entry_price)) * Number(trade.quantity)
        : (Number(trade.entry_price) - exitPrice) * Number(trade.quantity);
      const riskAmount = Math.abs(Number(trade.entry_price) - Number(trade.stop_loss ?? trade.entry_price));
      const priceMove = isLong ? exitPrice - Number(trade.entry_price) : Number(trade.entry_price) - exitPrice;
      const outcomeR = riskAmount > 0 ? Math.round((priceMove / riskAmount) * 100) / 100 : 0;

      const updateData: Record<string, any> = {
        status: 'closed',
        exit_price: exitPrice,
        pnl: Math.round(pnl * 100) / 100,
        closed_at: new Date().toISOString(),
        close_reason: overrideData ? `Override: ${overrideData.reason}` : 'Manually closed by trader',
        outcome_r: outcomeR,
      };

      if (overrideData) {
        updateData.override_reason = overrideData.reason;
        updateData.override_notes = overrideData.notes || null;
      }

      await supabase.from('paper_trades').update(updateData).eq('id', tradeId);

      if (overrideData && userId) {
        await supabase.from('user_signal_actions').insert({
          user_id: userId,
          instrument: symbol,
          pattern_id: 'manual_close',
          timeframe: 'n/a',
          action: 'override',
          paper_trade_id: tradeId,
        });
      }

      toast.success(`Trade closed at ${exitPrice} | ${outcomeR > 0 ? '+' : ''}${outcomeR}R`);
    } catch (err) {
      console.error('[PaperTrading] close error', err);
      toast.error('Failed to close trade');
    } finally {
      setClosingTradeId(null);
    }
  }, [userId]);

  const flattenAll = useCallback(async () => {
    if (!userId || openTrades.length === 0) return;
    try {
      for (const trade of openTrades) {
        await handleCloseTrade(trade.id, trade.symbol);
      }
    } catch (err) {
      console.error('[PaperTrading] flatten error', err);
      throw err;
    }
  }, [userId, openTrades, handleCloseTrade]);

  const resetPortfolio = useCallback(async () => {
    if (!userId) return;
    try {
      // Close all open trades first
      for (const trade of openTrades) {
        await supabase.from('paper_trades').update({
          status: 'closed',
          exit_price: trade.entry_price,
          pnl: 0,
          closed_at: new Date().toISOString(),
          close_reason: 'Portfolio reset',
        }).eq('id', trade.id);
      }
      // Delete all trade history
      await supabase.from('paper_trades').delete().eq('user_id', userId);
      // Reset portfolio balance
      await supabase.from('paper_portfolios').update({
        current_balance: 100000,
        total_pnl: 0,
      } as any).eq('user_id', userId);
      await fetchData();
    } catch (err) {
      console.error('[PaperTrading] reset error', err);
      throw err;
    }
  }, [userId, openTrades, fetchData]);

  const winCount = closedTrades.filter((t) => (t.pnl ?? 0) > 0).length;
  const winRate = closedTrades.length > 0 ? ((winCount / closedTrades.length) * 100) : 0;

  return {
    portfolio,
    openTrades,
    closedTrades,
    loading,
    closingTradeId,
    handleCloseTrade,
    flattenAll,
    resetPortfolio,
    winRate,
    winCount,
    refetch: fetchData,
  };
}
