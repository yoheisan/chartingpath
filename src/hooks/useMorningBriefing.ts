/**
 * useMorningBriefing Hook
 * 
 * Aggregates data for the Morning Briefing panel:
 * - Watchlist signals (active patterns on user's watchlisted symbols)
 * - AI verdict highlights (top TAKE-rated signals)
 * - Paper trade updates (open positions + recently closed)
 * - Market regime summary
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WatchlistSignal {
  id: string;
  instrument: string;
  patternName: string;
  direction: string;
  timeframe: string;
  riskReward: number;
  qualityScore: string | null;
  detectedAt: string;
  trendAlignment: string | null;
}

export interface AIVerdict {
  detectionId: string;
  instrument: string;
  patternName: string;
  direction: string;
  timeframe: string;
  compositeScore: number;
  analystRaw: number;
  riskRaw: number;
  timingRaw: number;
  isProven: boolean;
  winRate: number | null;
  expectancyR: number | null;
}

export interface PaperTradeUpdate {
  id: string;
  symbol: string;
  tradeType: string;
  entryPrice: number;
  exitPrice: number | null;
  pnl: number | null;
  status: string;
  closeReason: string | null;
  closedAt: string | null;
  outcomeR: number | null;
}

export interface RegimeSummary {
  assetClass: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  description: string;
}

export interface MorningBriefingData {
  watchlistSignals: WatchlistSignal[];
  aiVerdicts: AIVerdict[];
  openTrades: PaperTradeUpdate[];
  recentlyClosed: PaperTradeUpdate[];
  portfolioPnl: number;
  portfolioBalance: number;
  regimeSummaries: RegimeSummary[];
  greeting: string;
  lastUpdated: string;
}

export function useMorningBriefing(userId?: string) {
  const [data, setData] = useState<MorningBriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const fetchBriefing = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parallel fetch all data sources
      const [
        watchlistRes,
        paperPortfolioRes,
        openTradesRes,
        closedTradesRes,
      ] = await Promise.all([
        // 1. User watchlist symbols
        supabase
          .from('user_watchlist')
          .select('symbol')
          .eq('user_id', userId),

        // 2. Paper portfolio
        supabase
          .from('paper_portfolios')
          .select('current_balance, total_pnl')
          .eq('user_id', userId)
          .maybeSingle(),

        // 3. Open paper trades
        supabase
          .from('paper_trades')
          .select('id, symbol, trade_type, entry_price, exit_price, pnl, status, close_reason, closed_at, outcome_r')
          .eq('user_id', userId)
          .eq('status', 'open')
          .order('created_at', { ascending: false }),

        // 4. Recently closed paper trades (last 24h)
        supabase
          .from('paper_trades')
          .select('id, symbol, trade_type, entry_price, exit_price, pnl, status, close_reason, closed_at, outcome_r')
          .eq('user_id', userId)
          .eq('status', 'closed')
          .gte('closed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('closed_at', { ascending: false })
          .limit(10),
      ]);

      const watchlistSymbols = (watchlistRes.data || []).map(w => w.symbol);

      // Fetch live patterns on watchlisted symbols
      let watchlistSignals: WatchlistSignal[] = [];
      if (watchlistSymbols.length > 0) {
        const { data: livePatterns } = await supabase
          .from('live_pattern_detections')
          .select('id, instrument, pattern_name, direction, timeframe, risk_reward_ratio, quality_score, first_detected_at, trend_alignment')
          .eq('status', 'active')
          .in('instrument', watchlistSymbols)
          .order('first_detected_at', { ascending: false })
          .limit(20);

        watchlistSignals = (livePatterns || []).map(p => ({
          id: p.id,
          instrument: p.instrument,
          patternName: p.pattern_name,
          direction: p.direction,
          timeframe: p.timeframe,
          riskReward: p.risk_reward_ratio,
          qualityScore: p.quality_score,
          detectedAt: p.first_detected_at,
          trendAlignment: p.trend_alignment,
        }));
      }

      // Fetch top AI verdicts (scored signals with highest composite)
      let aiVerdicts: AIVerdict[] = [];
      const { data: scoreRows } = await supabase
        .from('agent_scores')
        .select(`
          detection_id, instrument, pattern_id, direction, timeframe,
          analyst_raw, risk_raw, timing_raw, portfolio_raw,
          is_proven, win_rate, expectancy_r
        `)
        .eq('is_proven', true)
        .order('scored_at', { ascending: false })
        .limit(50);

      if (scoreRows && scoreRows.length > 0) {
        // Get detection details for pattern names
        const detectionIds = scoreRows.map(s => s.detection_id);
        const { data: detections } = await supabase
          .from('live_pattern_detections')
          .select('id, pattern_name, status')
          .in('id', detectionIds)
          .eq('status', 'active');

        const detectionMap = new Map((detections || []).map(d => [d.id, d]));

        aiVerdicts = scoreRows
          .filter(s => detectionMap.has(s.detection_id))
          .map(s => {
            const detection = detectionMap.get(s.detection_id)!;
            const composite = (s.analyst_raw + s.risk_raw + s.timing_raw + s.portfolio_raw) / 4 * 100;
            return {
              detectionId: s.detection_id,
              instrument: s.instrument,
              patternName: detection.pattern_name,
              direction: s.direction || 'long',
              timeframe: s.timeframe,
              compositeScore: composite,
              analystRaw: s.analyst_raw,
              riskRaw: s.risk_raw,
              timingRaw: s.timing_raw,
              isProven: s.is_proven,
              winRate: s.win_rate,
              expectancyR: s.expectancy_r,
            };
          })
          .sort((a, b) => b.compositeScore - a.compositeScore)
          .slice(0, 5);
      }

      // Build regime summaries from market overview data
      const regimeSummaries: RegimeSummary[] = [];
      // We'll derive regime from instrument_pattern_stats_mv or historical data
      // For now, use a simplified approach based on recent pattern directions
      const assetClasses = ['crypto', 'forex', 'stocks'];
      for (const ac of assetClasses) {
        const { data: recentPatterns } = await supabase
          .from('live_pattern_detections')
          .select('direction')
          .eq('asset_type', ac === 'forex' ? 'fx' : ac)
          .eq('status', 'active')
          .limit(20);

        if (recentPatterns && recentPatterns.length > 0) {
          const longCount = recentPatterns.filter(p => p.direction === 'long').length;
          const shortCount = recentPatterns.filter(p => p.direction === 'short').length;
          const ratio = longCount / (longCount + shortCount);

          let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
          let description = 'Mixed signals, no clear directional bias';
          if (ratio > 0.65) {
            trend = 'bullish';
            description = `${longCount} bullish vs ${shortCount} bearish setups detected`;
          } else if (ratio < 0.35) {
            trend = 'bearish';
            description = `${shortCount} bearish vs ${longCount} bullish setups detected`;
          } else {
            description = `${longCount} bullish, ${shortCount} bearish — balanced market`;
          }

          regimeSummaries.push({
            assetClass: ac,
            trend,
            description,
          });
        }
      }

      const mapTrade = (t: any): PaperTradeUpdate => ({
        id: t.id,
        symbol: t.symbol,
        tradeType: t.trade_type,
        entryPrice: t.entry_price,
        exitPrice: t.exit_price,
        pnl: t.pnl,
        status: t.status,
        closeReason: t.close_reason,
        closedAt: t.closed_at,
        outcomeR: t.outcome_r,
      });

      setData({
        watchlistSignals,
        aiVerdicts,
        openTrades: (openTradesRes.data || []).map(mapTrade),
        recentlyClosed: (closedTradesRes.data || []).map(mapTrade),
        portfolioPnl: paperPortfolioRes.data?.total_pnl ?? 0,
        portfolioBalance: paperPortfolioRes.data?.current_balance ?? 100000,
        regimeSummaries,
        greeting: getGreeting(),
        lastUpdated: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('[MorningBriefing] Error fetching data:', err);
      setError(err.message || 'Failed to load briefing');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  return { data, loading, error, refresh: fetchBriefing };
}
