import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isForexSymbol, calcForexPnl } from '@/utils/forexUtils';

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
  const [needManualPrice, setNeedManualPrice] = useState<string | null>(null);

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
      let priceSource = 'manual';

      if (exitPrice == null) {
        // Layer 1: live_pattern_detections (must be <4h old)
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
        const { data: liveDetection } = await supabase
          .from('live_pattern_detections')
          .select('current_price, updated_at')
          .eq('instrument', symbol)
          .gte('updated_at', fourHoursAgo)
          .order('first_detected_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (liveDetection?.current_price) {
          exitPrice = Number(liveDetection.current_price);
          priceSource = 'live_detections';
        }
      }

      if (exitPrice == null) {
        // Layer 2: latest_price cached on the trade row (must be <30min old)
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: tradeCache } = await supabase
          .from('paper_trades')
          .select('latest_price, latest_price_at')
          .eq('id', tradeId)
          .maybeSingle();

        if (tradeCache?.latest_price && tradeCache?.latest_price_at && tradeCache.latest_price_at > thirtyMinAgo) {
          exitPrice = Number(tradeCache.latest_price);
          priceSource = 'trade_cache';
        }
      }

      if (exitPrice == null) {
        // Layer 3: fresh API call to get-live-price
        try {
          const { data: liveQuote, error: quoteError } = await supabase.functions.invoke('get-live-price', {
            body: { symbol }
          });
          if (!quoteError && liveQuote?.price) {
            exitPrice = Number(liveQuote.price);
            priceSource = 'live_api';
          }
        } catch (e) {
          console.warn('[PaperTrading] get-live-price failed:', e);
        }
      }

      const { data: trade } = await supabase
        .from('paper_trades')
        .select('entry_price, quantity, trade_type, stop_loss, user_id, instrument_type, forex_lot_size')
        .eq('id', tradeId)
        .single();

      if (!trade) { toast.error('Could not load trade data'); return; }

      // Layer 4: if all automated layers failed, signal UI for manual price input
      if (exitPrice == null) {
        setNeedManualPrice(tradeId);
        return;
      }

      const isLong = trade.trade_type === 'long' || trade.trade_type === 'buy';
      const isForex = trade.instrument_type === 'forex' || isForexSymbol(symbol);
      const forexLotSize = isForex ? Number(trade.forex_lot_size || 0.01) : 0;

      const signedMove = isLong
        ? exitPrice - Number(trade.entry_price)
        : Number(trade.entry_price) - exitPrice;

      const pnl = isForex
        ? calcForexPnl(symbol, isLong ? exitPrice - Number(trade.entry_price) : Number(trade.entry_price) - exitPrice, forexLotSize)
        : signedMove * Number(trade.quantity);

      const riskAmount = Math.abs(Number(trade.entry_price) - Number(trade.stop_loss ?? trade.entry_price));
      const priceMove = isLong ? exitPrice - Number(trade.entry_price) : Number(trade.entry_price) - exitPrice;
      const outcomeR = riskAmount > 0 ? Math.round((priceMove / riskAmount) * 100) / 100 : 0;

      const updateData: Record<string, any> = {
        status: 'closed',
        exit_price: exitPrice,
        pnl: Math.round(pnl * 100) / 100,
        closed_at: new Date().toISOString(),
        close_reason: overrideData?.manualPrice ? 'manual_price_override' : overrideData ? `Override: ${overrideData.reason}` : 'Manually closed by trader',
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
