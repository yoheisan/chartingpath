import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PatternDetailStatsData {
  winRate: number;
  avgRR: number;
  avgBars: number;
  totalDetections: number;
  bestTimeframe: string;
  bestTimeframeWinRate: number;
  bestTimeframeN: number;
  bestAssetClass: string;
  liveSetupsCount: number;
}

/**
 * Map from PatternDetails.ts keys to DB pattern_id values.
 * DB uses "head-and-shoulders", library uses "head-shoulders".
 */
const LIBRARY_TO_DB: Record<string, string> = {
  'head-shoulders': 'head-and-shoulders',
  'inverted-head-shoulders': 'inverse-head-and-shoulders',
  'cup-handle': 'cup-and-handle',
};

function toDbPatternId(libraryKey: string): string {
  return LIBRARY_TO_DB[libraryKey] || libraryKey;
}

export function usePatternDetailStats(patternKey: string) {
  const dbId = toDbPatternId(patternKey);

  return useQuery<PatternDetailStatsData | null>({
    queryKey: ['pattern-detail-stats', dbId],
    queryFn: async () => {
      // 1) Overall stats
      const { data: overall, error: e1 } = await supabase
        .from('historical_pattern_occurrences')
        .select('outcome, risk_reward_ratio, bars_to_outcome, asset_type, timeframe')
        .eq('pattern_id', dbId)
        .in('outcome', ['hit_tp', 'hit_sl']);
      if (e1) throw e1;
      if (!overall || overall.length === 0) return null;

      const total = overall.length;
      const wins = overall.filter(r => r.outcome === 'hit_tp').length;
      const winRate = Math.round((wins / total) * 1000) / 10;
      const avgRR = +(overall.reduce((s, r) => s + (r.risk_reward_ratio || 2), 0) / total).toFixed(1);
      const avgBars = Math.round(overall.reduce((s, r) => s + (r.bars_to_outcome || 0), 0) / total);

      // 2) Best timeframe (n>=20)
      const tfMap = new Map<string, { wins: number; total: number }>();
      for (const r of overall) {
        const tf = r.timeframe;
        const m = tfMap.get(tf) || { wins: 0, total: 0 };
        m.total++;
        if (r.outcome === 'hit_tp') m.wins++;
        tfMap.set(tf, m);
      }
      let bestTf = '', bestTfWr = 0, bestTfN = 0;
      for (const [tf, m] of tfMap.entries()) {
        if (m.total >= 20) {
          const wr = m.wins / m.total;
          if (wr > bestTfWr) { bestTf = tf; bestTfWr = wr; bestTfN = m.total; }
        }
      }

      // 3) Best asset class
      const acMap = new Map<string, number>();
      for (const r of overall) {
        acMap.set(r.asset_type, (acMap.get(r.asset_type) || 0) + 1);
      }
      let bestAc = '';
      let bestAcCount = 0;
      for (const [ac, cnt] of acMap.entries()) {
        if (cnt > bestAcCount) { bestAc = ac; bestAcCount = cnt; }
      }
      const acLabels: Record<string, string> = { fx: 'FX', stock: 'Equities', crypto: 'Crypto', commodity: 'Commodities', index: 'Indices' };

      // 4) Live setups count
      const { count: liveCount } = await supabase
        .from('live_pattern_detections')
        .select('id', { count: 'exact', head: true })
        .eq('pattern_id', dbId)
        .eq('status', 'active');

      return {
        winRate,
        avgRR,
        avgBars,
        totalDetections: total,
        bestTimeframe: bestTf,
        bestTimeframeWinRate: Math.round(bestTfWr * 1000) / 10,
        bestTimeframeN: bestTfN,
        bestAssetClass: acLabels[bestAc] || bestAc,
        liveSetupsCount: liveCount || 0,
      };
    },
    staleTime: 1000 * 60 * 30,
  });
}

// Constants
export const CANDLESTICK_PATTERNS = [
  'hammer', 'hanging-man', 'shooting-star', 'doji',
  'bullish-harami', 'bearish-harami',
  'bullish-engulfing', 'bearish-engulfing', 'spinning-top',
];

export const SCANNER_PATTERNS = [
  'head-shoulders', 'inverted-head-shoulders',
  'double-top', 'double-bottom',
  'triple-top', 'triple-bottom',
  'ascending-triangle', 'descending-triangle', 'symmetrical-triangle',
  'bull-flag', 'bear-flag',
  'rising-wedge', 'falling-wedge',
  'cup-handle', 'donchian-breakout-long', 'donchian-breakout-short',
  'pennant', 'rectangle',
  'bump-run-reversal', 'island-reversal',
];

export const EDGE_ATLAS_PATTERNS = [
  'bull-flag', 'bear-flag', 'ascending-triangle', 'descending-triangle',
  'head-shoulders', 'inverted-head-shoulders',
  'double-top', 'double-bottom', 'triple-top', 'triple-bottom',
  'cup-handle', 'rising-wedge', 'falling-wedge',
  'donchian-breakout-long', 'donchian-breakout-short',
  'symmetrical-triangle',
];
