import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ASSET_CLASS_TO_DB,
  PATTERN_NAMES,
  BARS_PER_YEAR,
} from '@/config/patternStatsConstants';

export interface PatternStatsData {
  patternSlug: string;
  patternName: string;
  assetClass: string;
  timeframe: string;
  totalTrades: number;
  winRate: number;
  avgExpectancy: number;
  avgRR: number;
  annualizedReturn: number;
  avgHoldBars: number;
  bestMarket: string;
  worstMarket: string;
  sampleInstruments: string[];
  gradeDistribution: { A: number; B: number; C: number; D: number };
  monthlyBreakdown: { month: string; winRate: number; trades: number }[];
  instrumentBreakdown: {
    symbol: string;
    trades: number;
    winRate: number;
    avgR: number;
    grade: string;
  }[];
  timeframeComparison: {
    timeframe: string;
    trades: number;
    winRate: number;
    expectancy: number;
  }[];
  lastUpdated: string;
  earliestDate: string;
}

function gradeFromWinRate(wr: number): string {
  if (wr >= 0.65) return 'A';
  if (wr >= 0.55) return 'B';
  if (wr >= 0.45) return 'C';
  return 'D';
}

export function usePatternStats(patternSlug: string, assetClass: string, timeframe: string) {
  const dbAssetType = ASSET_CLASS_TO_DB[assetClass] || assetClass;

  return useQuery<PatternStatsData | null>({
    queryKey: ['pattern-stats-seo', patternSlug, assetClass, timeframe],
    queryFn: async () => {
      // Fetch all resolved trades for this pattern + asset class
      const allRows: any[] = [];
      let from = 0;
      const PAGE = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('historical_pattern_occurrences')
          .select('symbol, outcome, risk_reward_ratio, bars_to_outcome, quality_score, detected_at, timeframe')
          .eq('pattern_id', patternSlug)
          .eq('asset_type', dbAssetType)
          .in('outcome', ['hit_tp', 'hit_sl'])
          .range(from, from + PAGE - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allRows.push(...data);
        if (data.length < PAGE) break;
        from += PAGE;
      }

      // Split into current timeframe vs others
      const tfRows = allRows.filter(r => r.timeframe === timeframe);
      if (tfRows.length === 0) return null;

      const wins = tfRows.filter(r => r.outcome === 'hit_tp').length;
      const total = tfRows.length;
      const winRate = wins / total;
      const avgRR = tfRows.reduce((s, r) => s + (r.risk_reward_ratio || 2), 0) / total;
      const losses = total - wins;
      const expectancy = (wins / total) * avgRR - (losses / total);
      const avgBars = tfRows.reduce((s, r) => s + (r.bars_to_outcome || 0), 0) / total;
      const barsPerYear = BARS_PER_YEAR[timeframe] || 252;
      const tradesPerYear = barsPerYear / Math.max(avgBars, 1);
      const annualized = tradesPerYear * expectancy;

      // Instrument breakdown
      const bySymbol = new Map<string, { wins: number; total: number; rrSum: number }>();
      for (const r of tfRows) {
        const s = bySymbol.get(r.symbol) || { wins: 0, total: 0, rrSum: 0 };
        s.total++;
        if (r.outcome === 'hit_tp') s.wins++;
        s.rrSum += r.risk_reward_ratio || 2;
        bySymbol.set(r.symbol, s);
      }
      const instrumentBreakdown = Array.from(bySymbol.entries())
        .map(([symbol, s]) => ({
          symbol,
          trades: s.total,
          winRate: s.wins / s.total,
          avgR: +(((s.wins / s.total) * (s.rrSum / s.total) - ((s.total - s.wins) / s.total))).toFixed(3),
          grade: gradeFromWinRate(s.wins / s.total),
        }))
        .sort((a, b) => b.trades - a.trades)
        .slice(0, 10);

      const best = instrumentBreakdown.reduce((b, i) => (i.winRate > b.winRate ? i : b), instrumentBreakdown[0]);
      const worst = instrumentBreakdown.reduce((w, i) => (i.winRate < w.winRate ? i : w), instrumentBreakdown[0]);

      // Grade distribution
      const grades = { A: 0, B: 0, C: 0, D: 0 };
      for (const r of tfRows) {
        const q = r.quality_score as string;
        if (q === 'A' || q === 'B' || q === 'C' || q === 'D') {
          grades[q as keyof typeof grades]++;
        } else {
          // Assign grade from win/loss
          const g = r.outcome === 'hit_tp' ? 'B' : 'C';
          grades[g]++;
        }
      }

      // Monthly breakdown (last 12 months)
      const now = new Date();
      const monthlyMap = new Map<string, { wins: number; total: number }>();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(key, { wins: 0, total: 0 });
      }
      for (const r of tfRows) {
        const key = r.detected_at?.substring(0, 7);
        if (key && monthlyMap.has(key)) {
          const m = monthlyMap.get(key)!;
          m.total++;
          if (r.outcome === 'hit_tp') m.wins++;
        }
      }
      const monthlyBreakdown = Array.from(monthlyMap.entries()).map(([month, m]) => ({
        month,
        winRate: m.total > 0 ? m.wins / m.total : 0,
        trades: m.total,
      }));

      // Timeframe comparison (from allRows which has all timeframes)
      const byTf = new Map<string, { wins: number; total: number; rrSum: number }>();
      for (const r of allRows) {
        const t = byTf.get(r.timeframe) || { wins: 0, total: 0, rrSum: 0 };
        t.total++;
        if (r.outcome === 'hit_tp') t.wins++;
        t.rrSum += r.risk_reward_ratio || 2;
        byTf.set(r.timeframe, t);
      }
      const timeframeComparison = Array.from(byTf.entries()).map(([tf, t]) => ({
        timeframe: tf,
        trades: t.total,
        winRate: t.wins / t.total,
        expectancy: +((t.wins / t.total) * (t.rrSum / t.total) - ((t.total - t.wins) / t.total)).toFixed(3),
      }));

      const dates = tfRows.map(r => r.detected_at).filter(Boolean).sort();

      return {
        patternSlug,
        patternName: PATTERN_NAMES[patternSlug] || patternSlug,
        assetClass,
        timeframe,
        totalTrades: total,
        winRate,
        avgExpectancy: +expectancy.toFixed(3),
        avgRR: +avgRR.toFixed(2),
        annualizedReturn: +annualized.toFixed(1),
        avgHoldBars: +avgBars.toFixed(1),
        bestMarket: best?.symbol || '',
        worstMarket: worst?.symbol || '',
        sampleInstruments: instrumentBreakdown.slice(0, 5).map(i => i.symbol),
        gradeDistribution: grades,
        monthlyBreakdown,
        instrumentBreakdown,
        timeframeComparison,
        lastUpdated: dates[dates.length - 1] || new Date().toISOString(),
        earliestDate: dates[0] || '',
      };
    },
    staleTime: 1000 * 60 * 30,
  });
}
