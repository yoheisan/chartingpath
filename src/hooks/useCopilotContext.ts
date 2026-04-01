import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VisiblePattern {
  id: string;
  type: string;
  direction: string;
  neckline?: number;
  target?: number;
  stop?: number;
  rr_ratio?: number;
}

export interface OpenPosition {
  symbol: string;
  pattern: string;
  pnl_r: number;
  direction: string;
}

export interface PatternStat {
  pattern_type: string;
  win_rate: number;
  avg_r: number;
  total_trades: number;
}

export interface CopilotContext {
  page: 'chart' | 'dashboard' | 'screener' | 'paper-trading' | 'other';
  symbol?: string;
  timeframe?: string;
  visible_patterns: VisiblePattern[];
  current_price?: number;
  open_positions: OpenPosition[];
  user_pattern_stats: PatternStat[];
  copilot_today_r: number;
  override_today_r: number;
  user_trading_plan: object | null;
}

/**
 * Assembles full CopilotContext for the chart page.
 * Refreshes when symbol/timeframe change.
 */
export function useCopilotContext(
  page: CopilotContext['page'],
  symbol?: string,
  timeframe?: string,
  currentPrice?: number
): CopilotContext {
  const { user } = useAuth();
  const [visiblePatterns, setVisiblePatterns] = useState<VisiblePattern[]>([]);
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [patternStats, setPatternStats] = useState<PatternStat[]>([]);
  const [copilotTodayR, setCopilotTodayR] = useState(0);
  const [overrideTodayR, setOverrideTodayR] = useState(0);
  const [tradingPlan, setTradingPlan] = useState<object | null>(null);

  // Fetch visible patterns for the current symbol/timeframe
  useEffect(() => {
    if (page !== 'chart' || !symbol) { setVisiblePatterns([]); return; }

    const fetchPatterns = async () => {
      let query = supabase
        .from('live_pattern_detections')
        .select('id, pattern_name, direction, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio')
        .eq('instrument', symbol)
        .eq('status', 'active');

      if (timeframe) query = query.eq('timeframe', timeframe);
      const { data } = await query.limit(20);

      if (data) {
        setVisiblePatterns(data.map((d: any) => ({
          id: d.id,
          type: d.pattern_name || 'unknown',
          direction: d.direction || 'neutral',
          neckline: d.entry_price ? Number(d.entry_price) : undefined,
          target: d.take_profit_price ? Number(d.take_profit_price) : undefined,
          stop: d.stop_loss_price ? Number(d.stop_loss_price) : undefined,
          rr_ratio: d.risk_reward_ratio ? Number(d.risk_reward_ratio) : undefined,
        })));
      }
    };

    fetchPatterns();

    // Subscribe to realtime for new patterns on this symbol
    const channel = supabase
      .channel(`copilot-ctx-patterns-${symbol}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_pattern_detections',
        filter: `instrument=eq.${symbol}`,
      }, () => fetchPatterns())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [page, symbol, timeframe]);

  // Fetch open positions + today's R performance
  useEffect(() => {
    if (!user?.id) return;

    const fetchPositionsAndStats = async () => {
      // Open positions
      const { data: openData } = await supabase
        .from('paper_trades')
        .select('symbol, setup_type, outcome_r, trade_type')
        .eq('user_id', user.id)
        .eq('status', 'open');

      if (openData) {
        setOpenPositions(openData.map((t: any) => ({
          symbol: t.symbol,
          pattern: t.setup_type || 'unknown',
          pnl_r: t.outcome_r ? Number(t.outcome_r) : 0,
          direction: t.trade_type || 'long',
        })));
      }

      // Today's R stats (copilot vs override)
      const today = new Date().toISOString().slice(0, 10);
      const { data: closedToday } = await supabase
        .from('paper_trades')
        .select('outcome_r, attribution')
        .eq('user_id', user.id)
        .eq('status', 'closed')
        .gte('closed_at', `${today}T00:00:00`);

      if (closedToday) {
        let aiR = 0, humanR = 0;
        for (const t of closedToday as any[]) {
          const r = Number(t.outcome_r) || 0;
          if (t.attribution === 'ai_approved') aiR += r;
          else if (t.attribution === 'human_overwrite') humanR += r;
        }
        setCopilotTodayR(Math.round(aiR * 100) / 100);
        setOverrideTodayR(Math.round(humanR * 100) / 100);
      }
    };

    fetchPositionsAndStats();
  }, [user?.id]);

  // Fetch pattern stats from closed trades
  useEffect(() => {
    if (!user?.id) return;

    const fetchPatternStats = async () => {
      const { data } = await supabase
        .from('paper_trades')
        .select('setup_type, outcome_r')
        .eq('user_id', user.id)
        .eq('status', 'closed')
        .not('setup_type', 'is', null);

      if (data && data.length > 0) {
        const byPattern: Record<string, { wins: number; total: number; sumR: number }> = {};
        for (const t of data as any[]) {
          const key = t.setup_type || 'unknown';
          if (!byPattern[key]) byPattern[key] = { wins: 0, total: 0, sumR: 0 };
          byPattern[key].total++;
          byPattern[key].sumR += Number(t.outcome_r) || 0;
          if ((Number(t.outcome_r) || 0) > 0) byPattern[key].wins++;
        }
        setPatternStats(Object.entries(byPattern).map(([pattern_type, s]) => ({
          pattern_type,
          win_rate: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0,
          avg_r: s.total > 0 ? Math.round((s.sumR / s.total) * 100) / 100 : 0,
          total_trades: s.total,
        })));
      }
    };

    fetchPatternStats();
  }, [user?.id]);

  // Fetch user's active trading plan
  useEffect(() => {
    if (!user?.id) return;

    const fetchPlan = async () => {
      const { data } = await supabase
        .from('master_plans')
        .select('preferred_patterns, asset_classes, max_position_pct, max_open_positions, stop_loss_rule, trend_direction, trading_schedules, timezone')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('plan_order', { ascending: true })
        .limit(1)
        .maybeSingle();

      setTradingPlan(data || null);
    };

    fetchPlan();
  }, [user?.id]);

  return useMemo(() => ({
    page,
    symbol,
    timeframe,
    visible_patterns: visiblePatterns,
    current_price: currentPrice,
    open_positions: openPositions,
    user_pattern_stats: patternStats,
    copilot_today_r: copilotTodayR,
    override_today_r: overrideTodayR,
    user_trading_plan: tradingPlan,
  }), [page, symbol, timeframe, visiblePatterns, currentPrice, openPositions, patternStats, copilotTodayR, overrideTodayR, tradingPlan]);
}

/**
 * Builds a system prompt string from a CopilotContext object.
 */
export function buildContextSystemPrompt(ctx: CopilotContext): string {
  if (ctx.page !== 'chart' || !ctx.symbol) return '';

  const lines = [
    'You are the ChartingPath Copilot — an expert technical analysis agent and paper trading assistant.',
    'Be direct, specific, and action-oriented. Always reference specific symbols, prices, R values, and pattern names.',
    'Never be generic. When you can take an action (open trade, set alert, update plan), offer to do it.',
    'Keep responses under 4 sentences unless showing a breakdown.',
    '',
    'Current context:',
    `- Page: chart`,
    `- Symbol: ${ctx.symbol}${ctx.current_price ? ` @ ${ctx.current_price}` : ''}`,
    `- Timeframe: ${ctx.timeframe || 'unknown'}`,
    `- Visible patterns: ${JSON.stringify(ctx.visible_patterns)}`,
    `- User stats on visible patterns: ${JSON.stringify(ctx.user_pattern_stats.filter(s => ctx.visible_patterns.some(p => p.type.toLowerCase().includes(s.pattern_type.toLowerCase()))))}`,
    `- Open positions: ${JSON.stringify(ctx.open_positions)}`,
    `- Copilot P&L today: ${ctx.copilot_today_r}R`,
    `- Override P&L today: ${ctx.override_today_r}R`,
    `- Trading plan: ${ctx.user_trading_plan ? JSON.stringify(ctx.user_trading_plan) : 'none set'}`,
  ];

  return lines.join('\n');
}
