import { type PaperTrade, type SessionLog, type MasterPlanRow } from '@/hooks/useTradeReport';

const symbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'META', 'GOOG', 'SPY', 'QQQ', 'AMD', 'NFLX', 'BA', 'JPM', 'V'];
const setups = ['bull_flag', 'ascending_triangle', 'cup_and_handle', 'double_bottom', 'head_and_shoulders', 'wedge', 'channel_breakout'];

function rand(min: number, max: number) { return min + Math.random() * (max - min); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function makeTrades(count: number): PaperTrade[] {
  const trades: PaperTrade[] = [];
  const baseDate = new Date('2026-01-15T09:30:00Z');

  for (let i = 0; i < count; i++) {
    const hoursOffset = i * rand(3, 12);
    const created = new Date(baseDate.getTime() + hoursOffset * 3600000);
    const closed = new Date(created.getTime() + rand(15, 360) * 60000);
    const isOverride = Math.random() < 0.2;
    const r = parseFloat((rand(-2.5, 4.0)).toFixed(2));
    const entry = parseFloat(rand(100, 500).toFixed(2));
    const exitMul = r > 0 ? 1 + r * 0.01 : 1 + r * 0.01;

    trades.push({
      id: `mock-${i}`,
      symbol: pick(symbols),
      trade_type: Math.random() > 0.3 ? 'long' : 'short',
      entry_price: entry,
      exit_price: parseFloat((entry * exitMul).toFixed(2)),
      pnl: parseFloat((r * 100).toFixed(2)),
      outcome_r: r,
      outcome: r > 0 ? 'win' : r < 0 ? 'loss' : 'breakeven',
      status: 'closed',
      created_at: created.toISOString(),
      closed_at: closed.toISOString(),
      attribution: isOverride ? 'override' : 'ai',
      setup_type: pick(setups),
      pattern_id: `pat-${i}`,
      hold_duration_mins: Math.round(rand(15, 360)),
      user_action: isOverride ? 'override' : 'follow',
      override_reason: isOverride ? 'Disagreed with entry timing' : null,
      master_plan_id: 'plan-1',
    });
  }

  return trades.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

function makeSessions(count: number): SessionLog[] {
  const sessions: SessionLog[] = [];
  const baseDate = new Date('2026-01-15');

  for (let i = 0; i < count; i++) {
    const d = new Date(baseDate.getTime() + i * 86400000);
    sessions.push({
      id: `sess-${i}`,
      session_date: d.toISOString().split('T')[0],
      ai_pnl_r: parseFloat(rand(-1.5, 3.0).toFixed(2)),
      human_pnl_r: parseFloat(rand(-1.0, 1.5).toFixed(2)),
      trades_taken: Math.round(rand(2, 8)),
    });
  }

  return sessions;
}

function makePlans(): MasterPlanRow[] {
  return [
    {
      id: 'plan-1',
      name: 'Momentum Breakouts',
      is_active: true,
      created_at: '2026-01-10T08:00:00Z',
      preferred_patterns: ['bull_flag', 'ascending_triangle', 'cup_and_handle'],
      trend_direction: 'bullish',
      trading_window_start: '09:30',
      trading_window_end: '16:00',
      stop_loss_rule: '1.5R fixed',
      max_position_pct: 5,
      asset_classes: ['stocks'],
    },
    {
      id: 'plan-2',
      name: 'Mean Reversion Swing',
      is_active: false,
      created_at: '2026-02-01T08:00:00Z',
      preferred_patterns: ['double_bottom', 'head_and_shoulders'],
      trend_direction: 'neutral',
      trading_window_start: '09:30',
      trading_window_end: '16:00',
      stop_loss_rule: '2R fixed',
      max_position_pct: 3,
      asset_classes: ['stocks', 'etfs'],
    },
  ];
}

// Generate a fixed seed set
export const MOCK_TRADES = makeTrades(42);
export const MOCK_SESSIONS = makeSessions(30);
export const MOCK_PLANS = makePlans();
export const MOCK_FIRST_TRADE_DATE = MOCK_TRADES[0]?.created_at ?? null;
