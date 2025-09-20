import { BacktestParams } from '@/components/BacktestParametersPanel';

export interface StrategyTemplate {
  name: string;
  description: string;
  parameters: Record<string, any>;
  type: 'single' | 'pair' | 'basket';
}

export const getStrategyTemplate = (approach: string, answers: any): StrategyTemplate => {
  const baseParams = {
    positionSize: answers.risk?.riskPerTrade || 2,
    stopLoss: Math.min(answers.risk?.maxDrawdown || 10, 5), // Conservative SL
    takeProfit: 2 * (Math.min(answers.risk?.maxDrawdown || 10, 5))
  };

  switch (approach) {
    case 'trend-following':
      return {
        name: 'Trend Following Strategy',
        description: 'Moving Average Crossover with MACD confirmation for trend identification',
        type: 'single',
        parameters: {
          ...baseParams,
          fastMA: 10,
          slowMA: 30,
          macdFast: 12,
          macdSlow: 26,
          macdSignal: 9,
          useMACD: true
        }
      };

    case 'mean-reversion':
      return {
        name: 'Mean Reversion Strategy',
        description: 'RSI and Bollinger Bands for identifying overbought/oversold conditions',
        type: 'single',
        parameters: {
          ...baseParams,
          rsiPeriod: 14,
          rsiOverbought: 70,
          rsiOversold: 30,
          bbPeriod: 20,
          bbStdDev: 2,
          useRSI: true,
          useBollingerBands: true
        }
      };

    case 'breakout':
      return {
        name: 'Breakout Strategy',
        description: 'Price and volatility breakouts using support/resistance and ATR',
        type: 'single',
        parameters: {
          ...baseParams,
          lookbackPeriod: 20,
          volatilityPeriod: 20,
          volatilityThreshold: 0.02,
          atrMultiplier: 2,
          useVolatilityFilter: true,
          usePriceBreakout: true
        }
      };

    case 'arbitrage':
      return {
        name: 'Pairs Trading Strategy',
        description: 'Statistical arbitrage using z-score mean reversion between correlated assets',
        type: 'pair',
        parameters: {
          symbolA: answers.market?.instrument || 'SPY',
          symbolB: 'TLT', // Default pair
          lookback: 60,
          entryZScore: 2.0,
          exitZScore: 0.5,
          leverage: answers.risk?.leverage || 1,
          positionSize: baseParams.positionSize
        }
      };

    case 'multi-strategy':
      return {
        name: 'Multi-Strategy Approach',
        description: 'Combines trend following and mean reversion with volatility filtering',
        type: 'single',
        parameters: {
          ...baseParams,
          // Trend following components
          fastMA: 8,
          slowMA: 21,
          // Mean reversion components
          rsiPeriod: 14,
          rsiOverbought: 75,
          rsiOversold: 25,
          // Volatility filter
          volatilityPeriod: 20,
          volatilityThreshold: 0.015,
          useCombo: true
        }
      };

    default:
      return {
        name: 'Custom Strategy',
        description: 'Custom trading strategy',
        type: 'single',
        parameters: baseParams
      };
  }
};

export const mapAnswersToBacktestParams = (answers: any): Partial<BacktestParams> => {
  const template = getStrategyTemplate(answers.style?.approach || '', answers);
  
  return {
    instrument: answers.market?.instrument || '',
    timeframe: answers.market?.timeframes?.[0] || '1h',
    initialCapital: 10000,
    positionSize: template.parameters.positionSize || 2,
    stopLoss: template.parameters.stopLoss,
    takeProfit: template.parameters.takeProfit,
    fromDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
    toDate: new Date().toISOString().split('T')[0],
    commission: 0.001, // 0.1% default commission
    slippage: 0.0005   // 0.05% default slippage
  };
};

export const getStrategyDescription = (approach: string): string => {
  const descriptions = {
    'trend-following': 'Follows market momentum using moving average crossovers and MACD confirmation. Enters long positions during uptrends and short positions during downtrends.',
    'mean-reversion': 'Identifies overbought and oversold conditions using RSI and Bollinger Bands. Buys when oversold and sells when overbought, expecting price to revert to mean.',
    'breakout': 'Trades significant price movements through support/resistance levels with volatility confirmation. Uses ATR for dynamic stop-loss and take-profit levels.',
    'arbitrage': 'Exploits price differences between correlated assets using statistical z-score analysis. Market-neutral strategy with lower risk profile.',
    'multi-strategy': 'Combines multiple approaches with volatility filtering. Uses trend-following in trending markets and mean-reversion in ranging conditions.'
  };
  
  return descriptions[approach] || 'Custom trading approach based on your specific parameters.';
};

export const getStrategyRiskProfile = (approach: string) => {
  const profiles = {
    'trend-following': { risk: 'Medium-High', timeHorizon: 'Medium-Long', marketCondition: 'Trending' },
    'mean-reversion': { risk: 'Medium', timeHorizon: 'Short-Medium', marketCondition: 'Ranging' },
    'breakout': { risk: 'High', timeHorizon: 'Short', marketCondition: 'Volatile' },
    'arbitrage': { risk: 'Low-Medium', timeHorizon: 'Short-Medium', marketCondition: 'Any' },
    'multi-strategy': { risk: 'Medium', timeHorizon: 'Medium', marketCondition: 'Adaptive' }
  };
  
  return profiles[approach] || { risk: 'Custom', timeHorizon: 'Variable', marketCondition: 'Any' };
};