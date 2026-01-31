/**
 * Maps strategy article slugs to their relevant indicator chart configurations.
 * Used to embed professional indicator visualizations in strategy articles.
 */

import { IndicatorType } from '@/components/charts/StrategyIndicatorChart';

export interface StrategyIndicatorConfig {
  indicator: IndicatorType;
  title?: string;
  description?: string;
  symbol?: string; // For fetching real data
}

/**
 * Mapping of article slugs to indicator configurations.
 * Articles matching these slugs will display the relevant indicator chart.
 */
export const STRATEGY_INDICATOR_MAPPING: Record<string, StrategyIndicatorConfig[]> = {
  // MACD Strategy Articles
  'macd-complete-strategy': [
    { 
      indicator: 'macd', 
      title: 'MACD Indicator Example',
      description: 'Showing MACD line, signal line crossovers, and histogram momentum',
      symbol: 'AAPL'
    }
  ],
  'macd-strategy': [
    { indicator: 'macd', title: 'MACD Signal Demonstration', symbol: 'AAPL' }
  ],
  'macd-indicator': [
    { indicator: 'macd', title: 'Understanding MACD Components', symbol: 'SPY' }
  ],
  'macd-divergence': [
    { indicator: 'macd', title: 'MACD Divergence Patterns', symbol: 'QQQ' }
  ],

  // RSI Strategy Articles
  'rsi-strategy': [
    { 
      indicator: 'rsi', 
      title: 'RSI Indicator Example',
      description: 'Showing overbought/oversold levels and RSI divergence',
      symbol: 'AAPL'
    }
  ],
  'rsi-indicator': [
    { indicator: 'rsi', title: 'RSI Overbought/Oversold Zones', symbol: 'SPY' }
  ],
  'rsi-divergence-strategy': [
    { indicator: 'rsi', title: 'RSI Divergence Trading', symbol: 'MSFT' }
  ],
  'rsi-complete-strategy': [
    { indicator: 'rsi', title: 'Complete RSI Analysis', symbol: 'AAPL' }
  ],

  // Moving Average Crossover Articles
  'moving-average-crossover-strategy': [
    { 
      indicator: 'ema-crossover', 
      title: 'EMA Crossover Strategy',
      description: 'Fast EMA (12) and Slow EMA (26) crossover signals',
      symbol: 'AAPL'
    }
  ],
  'ema-crossover-strategy': [
    { indicator: 'ema-crossover', title: 'EMA 12/26 Crossover', symbol: 'SPY' }
  ],
  'golden-death-cross': [
    { 
      indicator: 'sma-crossover', 
      title: 'Golden Cross / Death Cross',
      description: 'SMA 50 and SMA 200 major trend signals',
      symbol: 'SPY'
    }
  ],
  'sma-crossover-strategy': [
    { indicator: 'sma-crossover', title: 'SMA 50/200 Crossover', symbol: 'QQQ' }
  ],

  // Bollinger Bands Articles
  'bollinger-bands-strategy': [
    { 
      indicator: 'bollinger', 
      title: 'Bollinger Bands Strategy',
      description: 'Volatility bands with squeeze and breakout detection',
      symbol: 'AAPL'
    }
  ],
  'bollinger-bands-complete': [
    { indicator: 'bollinger', title: 'Bollinger Band Analysis', symbol: 'SPY' }
  ],
  'bollinger-squeeze': [
    { indicator: 'bollinger', title: 'Bollinger Squeeze Setup', symbol: 'TSLA' }
  ],

  // Momentum Strategy Articles
  'momentum-trading-strategy': [
    { indicator: 'rsi', title: 'Momentum with RSI', symbol: 'NVDA' },
    { indicator: 'macd', title: 'MACD Momentum Confirmation', symbol: 'NVDA' }
  ],
  'momentum-complete': [
    { indicator: 'rsi', title: 'RSI Momentum Analysis', symbol: 'AAPL' }
  ],

  // Trend Following Articles
  'trend-following-strategy': [
    { indicator: 'ema-crossover', title: 'EMA Trend Direction', symbol: 'SPY' }
  ],
  'trend-confirmation': [
    { indicator: 'macd', title: 'MACD Trend Confirmation', symbol: 'SPY' },
    { indicator: 'ema-crossover', title: 'EMA Trend Filter', symbol: 'SPY' }
  ],

  // Mean Reversion Articles
  'mean-reversion-strategy': [
    { indicator: 'bollinger', title: 'Mean Reversion Bands', symbol: 'SPY' },
    { indicator: 'rsi', title: 'RSI Extremes for Mean Reversion', symbol: 'SPY' }
  ],

  // Swing Trading Articles
  'swing-trading-strategy': [
    { indicator: 'macd', title: 'MACD Swing Signals', symbol: 'AAPL' },
    { indicator: 'rsi', title: 'RSI Swing Entry Timing', symbol: 'AAPL' }
  ],

  // Combined Indicator Articles
  'multi-indicator-strategy': [
    { indicator: 'macd', title: 'MACD Component', symbol: 'AAPL' },
    { indicator: 'rsi', title: 'RSI Component', symbol: 'AAPL' },
    { indicator: 'ema-crossover', title: 'EMA Trend Filter', symbol: 'AAPL' }
  ],
};

/**
 * Get indicator chart configurations for a given strategy slug.
 */
export function getStrategyIndicators(slug: string): StrategyIndicatorConfig[] {
  return STRATEGY_INDICATOR_MAPPING[slug] || [];
}

/**
 * Check if a strategy has associated indicator visualizations.
 */
export function hasStrategyIndicators(slug: string): boolean {
  return slug in STRATEGY_INDICATOR_MAPPING && STRATEGY_INDICATOR_MAPPING[slug].length > 0;
}

/**
 * Get all unique symbols needed for a strategy's indicator charts.
 */
export function getStrategyIndicatorSymbols(slug: string): string[] {
  const configs = getStrategyIndicators(slug);
  const symbols = configs.map(c => c.symbol).filter((s): s is string => !!s);
  return [...new Set(symbols)];
}
