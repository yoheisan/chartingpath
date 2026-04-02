import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type DateRange = '7d' | '30d' | 'all';

export interface PaperTrade {
  id: string;
  symbol: string;
  trade_type: string;
  entry_price: number;
  exit_price: number | null;
  pnl: number | null;
  outcome_r: number | null;
  outcome: string | null;
  status: string;
  created_at: string;
  closed_at: string | null;
  attribution: string | null;
  setup_type: string | null;
  pattern_id: string | null;
  hold_duration_mins: number | null;
  user_action: string | null;
  override_reason: string | null;
  master_plan_id: string | null;
  close_reason: string | null;
}

export interface SessionLog {
  id: string;
  session_date: string;
  ai_pnl_r: number | null;
  human_pnl_r: number | null;
  trades_taken: number | null;
}

export interface MasterPlanRow {
  id: string;
  name: string | null;
  is_active: boolean | null;
  created_at: string;
  preferred_patterns: any;
  trend_direction: string | null;
  trading_window_start: string | null;
  trading_window_end: string | null;
  stop_loss_rule: string | null;
  max_position_pct: number | null;
  asset_classes: string[] | null;
}

export interface ReportData {
  closedTrades: PaperTrade[];
  allTrades: PaperTrade[];
  sessions: SessionLog[];
  plans: MasterPlanRow[];
  loading: boolean;
  firstTradeDate: string | null;
}

export function useTradeReport(dateRange: DateRange): ReportData {
  const { user } = useAuth();
  const [allTrades, setAllTrades] = useState<PaperTrade[]>([]);
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [plans, setPlans] = useState<MasterPlanRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      setLoading(true);
      const [tradesRes, sessionsRes, plansRes] = await Promise.all([
        supabase.from('paper_trades').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('session_logs').select('*').eq('user_id', user.id).order('session_date', { ascending: true }),
        supabase.from('master_plans').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      ]);
      setAllTrades((tradesRes.data as PaperTrade[]) || []);
      setSessions((sessionsRes.data as SessionLog[]) || []);
      setPlans((plansRes.data as MasterPlanRow[]) || []);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const closedTrades = useMemo(() => {
    let trades = allTrades.filter(t => t.status === 'closed' && t.outcome_r != null);
    if (dateRange === '7d') {
      const cutoff = new Date(Date.now() - 7 * 86400000).toISOString();
      trades = trades.filter(t => (t.closed_at || t.created_at) >= cutoff);
    } else if (dateRange === '30d') {
      const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
      trades = trades.filter(t => (t.closed_at || t.created_at) >= cutoff);
    }
    return trades;
  }, [allTrades, dateRange]);

  const firstTradeDate = useMemo(() => {
    const closed = allTrades.filter(t => t.status === 'closed');
    return closed.length > 0 ? closed[0].created_at : null;
  }, [allTrades]);

  return { closedTrades, allTrades, sessions, plans, loading, firstTradeDate };
}

// Utility functions for report calculations
export const INCONCLUSIVE_CLOSE_REASONS = [
  'session_end_unresolved',
  'session_end_tp_proximity',
];

export function isInconclusiveTrade(t: PaperTrade): boolean {
  return INCONCLUSIVE_CLOSE_REASONS.includes(t.close_reason ?? '');
}

export function calcWinRate(trades: PaperTrade[]): number {
  const resolved = trades.filter(t => !isInconclusiveTrade(t));
  if (resolved.length === 0) return 0;
  const wins = resolved.filter(t => (t.outcome_r ?? 0) > 0).length;
  return Math.round((wins / resolved.length) * 100);
}

export function calcAvgR(trades: PaperTrade[]): number {
  const resolved = trades.filter(t => !isInconclusiveTrade(t));
  if (resolved.length === 0) return 0;
  const sum = resolved.reduce((s, t) => s + (t.outcome_r ?? 0), 0);
  return sum / resolved.length;
}

export function calcTotalR(trades: PaperTrade[]): number {
  return trades.reduce((s, t) => s + (t.outcome_r ?? 0), 0);
}

export function calcAvgHoldTime(trades: PaperTrade[]): { hours: number; mins: number } {
  if (trades.length === 0) return { hours: 0, mins: 0 };
  const totalMins = trades.reduce((s, t) => s + (t.hold_duration_mins ?? 0), 0) / trades.length;
  return { hours: Math.floor(totalMins / 60), mins: Math.round(totalMins % 60) };
}

export function calcBestStreak(trades: PaperTrade[]): number {
  let max = 0, cur = 0;
  for (const t of trades) {
    if ((t.outcome_r ?? 0) > 0) { cur++; max = Math.max(max, cur); }
    else cur = 0;
  }
  return max;
}

export function splitByAttribution(trades: PaperTrade[]) {
  const ai = trades.filter(t => t.attribution === 'ai_approved' || t.attribution === 'ai_partial');
  const human = trades.filter(t => t.attribution === 'human_overwrite' || t.attribution === 'override' || t.user_action === 'override');
  return { ai, human };
}

export function calcReadinessScore(trades: PaperTrade[], sessions: SessionLog[]) {
  const count = trades.length;
  const { ai, human } = splitByAttribution(trades);

  // Component 1 — Trade count (20 pts)
  let sampleSize = 0;
  if (count >= 50) sampleSize = 20;
  else if (count >= 30) sampleSize = 15;
  else if (count >= 20) sampleSize = 10;
  else if (count >= 10) sampleSize = 5;

  // Component 2 — AI expectancy (25 pts)
  const avgR = calcAvgR(trades);
  let profitability = 0;
  if (avgR > 1.5) profitability = 25;
  else if (avgR >= 1.0) profitability = 20;
  else if (avgR >= 0.5) profitability = 15;
  else if (avgR >= 0) profitability = 5;

  // Component 3 — Win rate (20 pts)
  const wr = calcWinRate(trades);
  let winRateScore = 0;
  if (wr >= 60) winRateScore = 20;
  else if (wr >= 50) winRateScore = 15;
  else if (wr >= 40) winRateScore = 10;

  // Component 4 — Consistency (20 pts)
  const lastFive = sessions.slice(-5);
  const profitable = lastFive.filter(s => ((s.ai_pnl_r ?? 0) + (s.human_pnl_r ?? 0)) > 0).length;
  let consistency = 0;
  if (profitable >= 4) consistency = 20;
  else if (profitable >= 3) consistency = 15;
  else if (profitable >= 2) consistency = 10;

  // Component 5 — Override discipline (15 pts)
  const last20 = trades.slice(-20);
  const overrides = last20.filter(t => t.attribution === 'override' || t.user_action === 'override').length;
  let discipline = 0;
  if (overrides === 0) discipline = 15;
  else if (overrides <= 2) discipline = 10;
  else if (overrides <= 5) discipline = 5;

  const total = sampleSize + profitability + winRateScore + consistency + discipline;

  return {
    total,
    components: [
      { label: 'Sample size', score: sampleSize, max: 20 },
      { label: 'Plan profitability', score: profitability, max: 25 },
      { label: 'Win rate', score: winRateScore, max: 20 },
      { label: 'Consistency', score: consistency, max: 20 },
      { label: 'Plan discipline', score: discipline, max: 15 },
    ],
    meta: { count, avgR, wr, profitable, overrides },
  };
}
