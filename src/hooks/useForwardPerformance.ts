import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PatternPerformance {
  patternName: string;
  // Paper trading (live) metrics
  liveTrades: number;
  liveWins: number;
  liveWinRate: number;
  liveTotalPnl: number;
  liveAvgPnl: number;
  // Backtest metrics (if available)
  backtestWinRate: number | null;
  backtestExpectancy: number | null;
  backtestTrades: number | null;
  // Confidence
  confidenceScore: number | null; // 0-100, how close live matches backtest
}

export function useForwardPerformance(userId?: string) {
  const [data, setData] = useState<PatternPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      try {
        // Get closed paper trades grouped by pattern
        const { data: trades } = await supabase
          .from('paper_trades')
          .select('symbol, trade_type, pnl, notes, status')
          .eq('user_id', userId)
          .eq('status', 'closed');

        if (!trades || trades.length === 0) {
          setData([]);
          return;
        }

        // Group by pattern name (extracted from notes or trade_type)
        const grouped: Record<string, { wins: number; total: number; totalPnl: number }> = {};
        for (const trade of trades) {
          // Try to extract pattern name from notes
          const patternMatch = trade.notes?.match(/\[pattern:([^\]]+)\]/);
          const patternName = patternMatch?.[1] || trade.trade_type || 'Unknown';
          
          if (!grouped[patternName]) {
            grouped[patternName] = { wins: 0, total: 0, totalPnl: 0 };
          }
          grouped[patternName].total++;
          if ((trade.pnl ?? 0) > 0) grouped[patternName].wins++;
          grouped[patternName].totalPnl += trade.pnl ?? 0;
        }

        // Get backtest results for comparison
        const { data: backtestResults } = await supabase
          .from('backtest_runs')
          .select('strategy_name, win_rate, expectancy, total_trades')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false });

        // Map backtest results by strategy name
        const backtestMap: Record<string, { winRate: number; expectancy: number; trades: number }> = {};
        if (backtestResults) {
          for (const bt of backtestResults) {
            if (!backtestMap[bt.strategy_name]) {
              backtestMap[bt.strategy_name] = {
                winRate: bt.win_rate ?? 0,
                expectancy: bt.expectancy ?? 0,
                trades: bt.total_trades ?? 0,
              };
            }
          }
        }

        const result: PatternPerformance[] = Object.entries(grouped).map(([name, stats]) => {
          const liveWinRate = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;
          const bt = backtestMap[name];
          
          let confidenceScore: number | null = null;
          if (bt && stats.total >= 5) {
            // Confidence = 100 - |difference in win rates|
            const winRateDiff = Math.abs(liveWinRate - bt.winRate * 100);
            confidenceScore = Math.max(0, Math.round(100 - winRateDiff * 2));
          }

          return {
            patternName: name,
            liveTrades: stats.total,
            liveWins: stats.wins,
            liveWinRate,
            liveTotalPnl: stats.totalPnl,
            liveAvgPnl: stats.total > 0 ? stats.totalPnl / stats.total : 0,
            backtestWinRate: bt ? bt.winRate * 100 : null,
            backtestExpectancy: bt?.expectancy ?? null,
            backtestTrades: bt?.trades ?? null,
            confidenceScore,
          };
        });

        // Sort by trade count descending
        result.sort((a, b) => b.liveTrades - a.liveTrades);
        setData(result);
      } catch (err) {
        console.error('[ForwardPerformance] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [userId]);

  return { data, loading };
}
