import { BacktesterV2, AgentBacktestConfig, AgentBacktestResult } from '../../engine/backtester-v2/backtest';
import { marketDataProvider } from './marketDataProvider';
import { supabase } from '@/integrations/supabase/client';
import { PatternStatEntry, EconomicEvent, AgentWeights, VerdictCutoffs } from '../../engine/backtester-v2/agents/types';
import { V2BacktestResult } from './backtesterV2';

export interface AgentBacktestParams {
  symbols: string[];
  fromDate: string;
  toDate: string;
  initialCapital: number;
  commission: number;  // percentage
  slippage: number;    // percentage
  agentWeights?: Partial<AgentWeights>;
  verdictCutoffs?: Partial<VerdictCutoffs>;
  rebalanceFrequencyDays?: number;
}

export class AgentBacktestAdapter {
  private backtester: BacktesterV2;

  constructor() {
    this.backtester = new BacktesterV2(marketDataProvider);
  }

  async runAgentBacktest(params: AgentBacktestParams): Promise<V2BacktestResult & { verdicts: any[]; agentScoreSummary: any }> {
    // Pre-load pattern stats from Supabase
    const patternStats = await this.loadPatternStats(params.symbols);

    // Pre-load economic events for date range
    const economicEvents = await this.loadEconomicEvents(params.fromDate, params.toDate);

    const config: AgentBacktestConfig = {
      mode: 'agent',
      startDate: params.fromDate,
      endDate: params.toDate,
      initialCapital: params.initialCapital,
      tradingCost: params.commission / 100,
      slippage: params.slippage / 100,
      policy: {
        symbols: params.symbols,
        agentWeights: params.agentWeights,
        verdictCutoffs: params.verdictCutoffs,
        rebalanceFrequencyDays: params.rebalanceFrequencyDays ?? 1,
        patternStats,
        economicEvents,
      },
    };

    const result = await this.backtester.runAgent(config);
    return this.convertToUIResult(result, params);
  }

  private async loadPatternStats(symbols: string[]): Promise<Record<string, PatternStatEntry>> {
    const stats: Record<string, PatternStatEntry> = {};

    try {
      const { data } = await supabase
        .from('instrument_pattern_stats_mv' as any)
        .select('symbol, win_rate, expectancy_r, total_trades, avg_rr')
        .in('symbol', symbols);

      if (data) {
        for (const row of data as any[]) {
          stats[row.symbol] = {
            winRate: row.win_rate / 100, // convert from percentage
            expectancyR: row.expectancy_r ?? 0,
            sampleSize: row.total_trades ?? 0,
            avgRR: row.avg_rr ?? 2,
          };
        }
      }
    } catch (err) {
      console.warn('Could not load pattern stats, using defaults:', err);
    }

    // Fill missing symbols with neutral defaults
    for (const symbol of symbols) {
      if (!stats[symbol]) {
        stats[symbol] = { winRate: 0.5, expectancyR: 0.5, sampleSize: 0, avgRR: 2 };
      }
    }

    return stats;
  }

  private async loadEconomicEvents(fromDate: string, toDate: string): Promise<EconomicEvent[]> {
    try {
      const { data } = await supabase
        .from('economic_events')
        .select('scheduled_time, impact_level, event_name')
        .gte('scheduled_time', fromDate)
        .lte('scheduled_time', toDate)
        .in('impact_level', ['high', 'medium']);

      if (data) {
        return data.map((ev) => ({
          date: ev.scheduled_time,
          impactLevel: ev.impact_level as 'high' | 'medium',
          eventName: ev.event_name,
        }));
      }
    } catch (err) {
      console.warn('Could not load economic events:', err);
    }

    return [];
  }

  private convertToUIResult(
    result: AgentBacktestResult,
    params: AgentBacktestParams
  ): V2BacktestResult & { verdicts: any[]; agentScoreSummary: any } {
    const totalTrades = result.trades?.length || 0;
    const finalEquity = result.equity[result.equity.length - 1]?.value || params.initialCapital;
    const netPnl = finalEquity - params.initialCapital;
    const netPnlPercent = (netPnl / params.initialCapital) * 100;
    const maxDrawdown = Math.abs(result.stats?.maxDD || 0);

    const equityCurve = result.equity?.map((point) => ({
      date: point.date,
      equity: point.value,
      drawdown: 0,
    })) || [];

    // Build trade log with agent scores
    const tradeLog = result.trades.map((trade) => {
      const verdict = result.verdicts.find(
        (v) => v.date === trade.date && v.symbol === trade.symbol
      );
      return {
        id: `${trade.date}-${trade.symbol}`,
        entry_time: trade.date,
        trade_type: trade.qty > 0 ? 'BUY' : 'SELL',
        entry_price: trade.price,
        quantity: Math.abs(trade.qty),
        pnl: 0,
        reason: trade.tag || 'agent_signal',
        compositeScore: verdict?.compositeScore,
        verdict: verdict?.verdict,
        agentBreakdown: verdict?.agentScores,
      };
    });

    return {
      id: 'agent-' + Date.now(),
      strategy_name: `Multi-Agent Portfolio [${params.symbols.join(', ')}]`,
      instrument: params.symbols.join(', '),
      timeframe: '1d',
      from_date: params.fromDate,
      to_date: params.toDate,
      status: 'completed',
      win_rate: 0,
      profit_factor: 0,
      net_pnl: netPnlPercent,
      max_drawdown: maxDrawdown,
      sharpe_ratio: result.stats?.sharpe || 0,
      total_trades: totalTrades,
      avg_win: 0,
      avg_loss: 0,
      created_at: new Date().toISOString(),
      initial_capital: params.initialCapital,
      trade_log: tradeLog,
      equity_curve_data: equityCurve,
      engine_version: '2.0-agent',
      verdicts: result.verdicts,
      agentScoreSummary: result.agentScoreSummary,
    };
  }
}
