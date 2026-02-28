import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ContentType = 'backtest' | 'detection';

export interface EdgeCardData {
  id: string;
  type: ContentType;
  instrument: string;
  patternName: string;
  direction?: string;
  timeframe: string;
  createdAt: string;
  shareToken?: string;
  // Backtest-specific
  winRate?: number;
  profitFactor?: number;
  sharpeRatio?: number;
  totalTrades?: number;
  netPnl?: number;
  maxDrawdown?: number;
  equityCurve?: any[];
  // Detection-specific
  entryPrice?: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  riskRewardRatio?: number;
  qualityScore?: string;
  assetType?: string;
  // Engagement
  likeCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface CommunityFilters {
  assetType?: string;
  pattern?: string;
  direction?: string;
}

export function useCommunityFeed(filters: CommunityFilters = {}) {
  const [cards, setCards] = useState<EdgeCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current user for like/bookmark status
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch community-shared backtests
      let backtestQuery = supabase
        .from('backtest_runs')
        .select('id, instrument, strategy_name, timeframe, win_rate, profit_factor, sharpe_ratio, total_trades, net_pnl, max_drawdown, equity_curve_data, share_token, created_at, parameters')
        .eq('is_community_shared', true)
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch community-shared live detections
      let detectionQuery = supabase
        .from('live_pattern_detections')
        .select('id, instrument, pattern_name, direction, timeframe, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, quality_score, asset_type, share_token, first_detected_at')
        .not('share_token', 'is', null)
        .order('first_detected_at', { ascending: false })
        .limit(50);

      if (filters.assetType) {
        detectionQuery = detectionQuery.eq('asset_type', filters.assetType);
      }
      if (filters.direction) {
        detectionQuery = detectionQuery.eq('direction', filters.direction);
      }
      if (filters.pattern) {
        detectionQuery = detectionQuery.ilike('pattern_name', `%${filters.pattern}%`);
      }

      const [backtestRes, detectionRes] = await Promise.all([
        backtestQuery,
        detectionQuery,
      ]);

      // Fetch likes counts
      const allBacktestIds = (backtestRes.data || []).map(b => b.id);
      const allDetectionIds = (detectionRes.data || []).map(d => d.id);

      const [backtestLikes, detectionLikes, userLikes, userBookmarks] = await Promise.all([
        allBacktestIds.length > 0
          ? supabase.from('community_likes').select('content_id').eq('content_type', 'backtest').in('content_id', allBacktestIds)
          : { data: [] },
        allDetectionIds.length > 0
          ? supabase.from('community_likes').select('content_id').eq('content_type', 'detection').in('content_id', allDetectionIds)
          : { data: [] },
        user
          ? supabase.from('community_likes').select('content_id, content_type').eq('user_id', user.id)
          : { data: [] },
        user
          ? supabase.from('community_bookmarks').select('content_id, content_type').eq('user_id', user.id)
          : { data: [] },
      ]);

      // Count likes per content_id
      const likeCounts: Record<string, number> = {};
      for (const l of (backtestLikes.data || [])) {
        likeCounts[l.content_id] = (likeCounts[l.content_id] || 0) + 1;
      }
      for (const l of (detectionLikes.data || [])) {
        likeCounts[l.content_id] = (likeCounts[l.content_id] || 0) + 1;
      }

      const userLikeSet = new Set((userLikes.data || []).map(l => `${l.content_type}:${l.content_id}`));
      const userBookmarkSet = new Set((userBookmarks.data || []).map(b => `${b.content_type}:${b.content_id}`));

      // Map to EdgeCardData
      const backtestCards: EdgeCardData[] = (backtestRes.data || []).map(b => ({
        id: b.id,
        type: 'backtest' as ContentType,
        instrument: b.instrument,
        patternName: b.strategy_name,
        timeframe: b.timeframe,
        createdAt: b.created_at,
        shareToken: b.share_token || undefined,
        winRate: b.win_rate || undefined,
        profitFactor: b.profit_factor || undefined,
        sharpeRatio: b.sharpe_ratio || undefined,
        totalTrades: b.total_trades || undefined,
        netPnl: b.net_pnl || undefined,
        maxDrawdown: b.max_drawdown || undefined,
        equityCurve: b.equity_curve_data as any[] || undefined,
        likeCount: likeCounts[b.id] || 0,
        isLiked: userLikeSet.has(`backtest:${b.id}`),
        isBookmarked: userBookmarkSet.has(`backtest:${b.id}`),
      }));

      const detectionCards: EdgeCardData[] = (detectionRes.data || []).map(d => ({
        id: d.id,
        type: 'detection' as ContentType,
        instrument: d.instrument,
        patternName: d.pattern_name,
        direction: d.direction || undefined,
        timeframe: d.timeframe,
        createdAt: d.first_detected_at,
        shareToken: d.share_token || undefined,
        entryPrice: d.entry_price || undefined,
        stopLossPrice: d.stop_loss_price || undefined,
        takeProfitPrice: d.take_profit_price || undefined,
        riskRewardRatio: d.risk_reward_ratio || undefined,
        qualityScore: d.quality_score || undefined,
        assetType: d.asset_type || undefined,
        likeCount: likeCounts[d.id] || 0,
        isLiked: userLikeSet.has(`detection:${d.id}`),
        isBookmarked: userBookmarkSet.has(`detection:${d.id}`),
      }));

      // Merge and sort by date
      const merged = [...backtestCards, ...detectionCards].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setCards(merged);
    } catch (err: any) {
      console.error('[useCommunityFeed]', err);
      setError(err.message || 'Failed to load community feed');
    } finally {
      setLoading(false);
    }
  }, [filters.assetType, filters.direction, filters.pattern]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return { cards, loading, error, refetch: fetchFeed };
}
