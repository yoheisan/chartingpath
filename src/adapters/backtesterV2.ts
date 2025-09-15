import { BacktesterV2, SingleBacktestConfig } from '../../engine/backtester-v2/backtest';
import { marketDataProvider } from './marketDataProvider';
import { BacktestParams } from '@/components/BacktestParametersPanel';
import { GuidedStrategyAnswers } from '@/components/GuidedStrategyBuilder';

export interface V2BacktestResult {
  id: string;
  strategy_name: string;
  instrument: string;
  timeframe: string;
  from_date: string;
  to_date: string;
  status: string;
  win_rate: number;
  profit_factor: number;
  net_pnl: number;
  max_drawdown: number;
  sharpe_ratio: number;
  total_trades: number;
  avg_win: number;
  avg_loss: number;
  created_at: string;
  initial_capital: number;
  trade_log: any[];
  equity_curve_data: any[];
  engine_version: string;
}

export class BacktesterV2Adapter {
  private backtester: BacktesterV2;

  constructor() {
    // Initialize with real market data provider
    this.backtester = new BacktesterV2(marketDataProvider);
  }

  async runBacktest(
    params: BacktestParams, 
    strategyAnswers: GuidedStrategyAnswers
  ): Promise<V2BacktestResult> {
    try {
      // Convert UI parameters to BacktesterV2 config
      const config = this.convertToBacktestConfig(params, strategyAnswers);
      
      // Run the backtest
      const result = await this.backtester.runSingle(config);
      
      // Convert result back to UI format
      return this.convertToUIResult(result, params, strategyAnswers);
    } catch (error) {
      console.error('Backtest execution failed:', error);
      throw new Error('Backtest execution failed: ' + (error as Error).message);
    }
  }

  private convertToBacktestConfig(
    params: BacktestParams, 
    strategyAnswers: GuidedStrategyAnswers
  ): SingleBacktestConfig {
    const approach = strategyAnswers.style?.approach || 'trend-following';
    
    // Map strategy approaches to specific strategy parameters
    const getStrategyParams = () => {
      switch (approach) {
        case 'trend-following':
          return {
            tradableSymbol: params.instrument,
            triggerSymbol: params.instrument, 
            longThreshold: 1.02,  // 2% above moving average
            shortThreshold: 0.98, // 2% below moving average
            positionSize: params.positionSize / 100,
            stopLoss: params.stopLoss ? params.stopLoss / 100 : undefined,
            takeProfit: params.takeProfit ? params.takeProfit / 100 : undefined
          };
        case 'mean-reversion':
          return {
            tradableSymbol: params.instrument,
            triggerSymbol: params.instrument,
            longThreshold: 0.95,  // Buy when 5% below mean
            shortThreshold: 1.05, // Sell when 5% above mean
            positionSize: params.positionSize / 100,
            stopLoss: params.stopLoss ? params.stopLoss / 100 : undefined,
            takeProfit: params.takeProfit ? params.takeProfit / 100 : undefined
          };
        case 'breakout':
          return {
            tradableSymbol: params.instrument,
            triggerSymbol: params.instrument,
            longThreshold: 1.05,  // Breakout above 5%
            shortThreshold: 0.95, // Breakdown below 5%
            positionSize: params.positionSize / 100,
            stopLoss: params.stopLoss ? params.stopLoss / 100 : undefined,
            takeProfit: params.takeProfit ? params.takeProfit / 100 : undefined
          };
        default:
          return {
            tradableSymbol: params.instrument,
            triggerSymbol: params.instrument,
            longThreshold: 1.0,
            shortThreshold: 1.0,
            positionSize: params.positionSize / 100,
            stopLoss: params.stopLoss ? params.stopLoss / 100 : undefined,
            takeProfit: params.takeProfit ? params.takeProfit / 100 : undefined
          };
      }
    };

    return {
      mode: 'single',
      startDate: params.fromDate,
      endDate: params.toDate,
      initialCapital: params.initialCapital,
      tradingCost: params.commission / 100,
      slippage: params.slippage / 100,
      strategy: getStrategyParams()
    };
  }

  private convertToUIResult(
    result: any, 
    params: BacktestParams, 
    strategyAnswers: GuidedStrategyAnswers
  ): V2BacktestResult {
    // Calculate derived metrics from the BacktesterV2 result
    const totalTrades = result.trades?.length || 0;
    const winningTrades = result.trades?.filter((t: any) => {
      // Calculate P&L for each trade pair
      const isClosing = t.side === 'CLOSE';
      return isClosing && t.qty * t.price > 0; // Simplified win condition
    }).length || 0;
    
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    // Calculate net P&L from equity curve
    const finalEquity = result.equity[result.equity.length - 1]?.value || params.initialCapital;
    const netPnl = finalEquity - params.initialCapital;
    const netPnlPercent = (netPnl / params.initialCapital) * 100;
    
    // Extract max drawdown from stats
    const maxDrawdown = Math.abs(result.stats?.maxDD || 0) * 100;
    
    // Calculate profit factor
    const grossProfit = result.trades?.reduce((sum: number, trade: any) => {
      const pnl = this.calculateTradePnL(trade, result.trades);
      return pnl > 0 ? sum + pnl : sum;
    }, 0) || 0;
    
    const grossLoss = Math.abs(result.trades?.reduce((sum: number, trade: any) => {
      const pnl = this.calculateTradePnL(trade, result.trades);
      return pnl < 0 ? sum + pnl : sum;
    }, 0) || 0);
    
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;
    
    // Convert trades to UI format
    const tradeLog = this.convertTradesToUIFormat(result.trades, params.instrument);
    
    // Convert equity curve
    const equityCurve = result.equity?.map((point: any) => ({
      date: point.date,
      equity: point.value,
      drawdown: this.calculateDrawdown(point.value, params.initialCapital)
    })) || [];

    return {
      id: 'v2-' + Date.now(),
      strategy_name: this.generateStrategyName(strategyAnswers),
      instrument: params.instrument,
      timeframe: params.timeframe,
      from_date: params.fromDate,
      to_date: params.toDate,
      status: 'completed',
      win_rate: winRate,
      profit_factor: profitFactor,
      net_pnl: netPnlPercent,
      max_drawdown: maxDrawdown,
      sharpe_ratio: result.stats?.sharpe || 0,
      total_trades: totalTrades,
      avg_win: grossProfit > 0 && winningTrades > 0 ? grossProfit / winningTrades : 0,
      avg_loss: grossLoss > 0 && (totalTrades - winningTrades) > 0 ? grossLoss / (totalTrades - winningTrades) : 0,
      created_at: new Date().toISOString(),
      initial_capital: params.initialCapital,
      trade_log: tradeLog,
      equity_curve_data: equityCurve,
      engine_version: '2.0'
    };
  }

  private calculateTradePnL(trade: any, allTrades: any[]): number {
    // Simplified P&L calculation
    // In a real implementation, this would properly match opening and closing trades
    if (trade.side === 'CLOSE') {
      return trade.qty * trade.price - trade.cost;
    }
    return 0;
  }

  private calculateDrawdown(currentEquity: number, initialCapital: number): number {
    return Math.max(0, ((currentEquity - initialCapital) / initialCapital) * 100);
  }

  private convertTradesToUIFormat(trades: any[], instrument: string): any[] {
    if (!trades || trades.length === 0) return [];
    
    const uiTrades = [];
    let openTrade: any = null;
    
    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];
      
      if (trade.side === 'OPEN' && !openTrade) {
        openTrade = trade;
      } else if (trade.side === 'CLOSE' && openTrade) {
        // Create a completed trade record
        const pnl = (trade.price - openTrade.price) * Math.abs(trade.qty) - trade.cost - openTrade.cost;
        
        uiTrades.push({
          id: `${openTrade.date}-${trade.date}`,
          entry_time: openTrade.date,
          exit_time: trade.date,
          trade_type: openTrade.qty > 0 ? 'BUY' : 'SELL',
          entry_price: openTrade.price,
          exit_price: trade.price,
          quantity: Math.abs(openTrade.qty),
          pnl: pnl,
          reason: openTrade.tag || 'Strategy signal'
        });
        
        openTrade = null;
      }
    }
    
    return uiTrades;
  }

  private generateStrategyName(strategyAnswers: GuidedStrategyAnswers): string {
    const approach = strategyAnswers.style?.approach?.replace('-', ' ') || 'Custom';
    const instrument = strategyAnswers.market?.instrument || 'Strategy';
    const timeframe = strategyAnswers.market?.timeframes?.[0] || '1h';
    
    return `${instrument} ${approach} ${timeframe}`.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
}