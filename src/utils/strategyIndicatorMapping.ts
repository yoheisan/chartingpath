/**
 * Maps strategy article slugs to their relevant indicator chart configurations.
 * Used to embed professional indicator visualizations in strategy articles.
 * 
 * Updated: Comprehensive coverage for all strategy-related blog articles
 */

import { IndicatorType } from '@/components/charts/StrategyIndicatorChart';

export interface StrategyIndicatorConfig {
  indicator: IndicatorType;
  title?: string;
  description?: string;
  symbol?: string;
}

/**
 * Mapping of article slugs to indicator configurations.
 * Articles matching these slugs will display the relevant indicator chart.
 */
export const STRATEGY_INDICATOR_MAPPING: Record<string, StrategyIndicatorConfig[]> = {
  // ===== DONCHIAN CHANNEL / TURTLE TRADING =====
  'donchian-channel': [
    { 
      indicator: 'donchian', 
      title: 'Donchian Channels (20-Period)',
      description: 'Turtle Trading breakout system - Green = 20-day high, Red = 20-day low',
      symbol: 'SPY'
    }
  ],
  'turtle-trading': [
    { indicator: 'donchian', title: 'Turtle Trading Breakout System', symbol: 'GC=F' }
  ],
  'channel-breakout-strategy': [
    { indicator: 'donchian', title: 'Channel Breakout Visualization', symbol: 'CL=F' }
  ],

  // ===== MACD STRATEGY ARTICLES =====
  'macd-complete-strategy': [
    { 
      indicator: 'macd', 
      title: 'MACD Indicator Example',
      description: 'MACD line, signal line crossovers, and histogram momentum',
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

  // ===== RSI STRATEGY ARTICLES =====
  'rsi-strategy': [
    { 
      indicator: 'rsi', 
      title: 'RSI Indicator Example',
      description: 'Overbought/oversold levels and RSI divergence',
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
  'roc-indicator': [
    { indicator: 'rsi', title: 'Momentum Oscillator Comparison', description: 'RSI as momentum reference', symbol: 'SPY' }
  ],
  'williams-r': [
    { indicator: 'rsi', title: 'Oscillator Comparison', description: 'RSI vs Williams %R zones', symbol: 'SPY' }
  ],

  // ===== MOVING AVERAGE ARTICLES =====
  'moving-averages': [
    { indicator: 'ema-crossover', title: 'EMA Crossover Example', description: 'Fast and slow EMA interaction', symbol: 'AAPL' },
    { indicator: 'sma-crossover', title: 'SMA 50/200 Example', description: 'Golden cross and death cross signals', symbol: 'SPY' }
  ],
  'ema-strategies': [
    { indicator: 'ema-crossover', title: 'EMA Trading Strategy', description: 'EMA 12/26 crossover signals', symbol: 'AAPL' }
  ],
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

  // ===== BOLLINGER BANDS ARTICLES =====
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
  'keltner-channels': [
    { indicator: 'bollinger', title: 'Volatility Channel Comparison', description: 'Bollinger vs Keltner concept', symbol: 'SPY' }
  ],
  'donchian-channels': [
    { indicator: 'bollinger', title: 'Channel Breakout Visualization', description: 'Volatility bands for breakout context', symbol: 'SPY' }
  ],

  // ===== TREND ANALYSIS ARTICLES =====
  'trend-analysis': [
    { indicator: 'ema-crossover', title: 'Trend Direction with EMAs', symbol: 'SPY' },
    { indicator: 'macd', title: 'MACD Trend Confirmation', symbol: 'SPY' }
  ],
  'trend-following-strategy': [
    { indicator: 'ema-crossover', title: 'EMA Trend Direction', symbol: 'SPY' },
    { indicator: 'macd', title: 'MACD Trend Strength', symbol: 'SPY' }
  ],
  'trend-confirmation': [
    { indicator: 'macd', title: 'MACD Trend Confirmation', symbol: 'SPY' },
    { indicator: 'ema-crossover', title: 'EMA Trend Filter', symbol: 'SPY' }
  ],
  'parabolic-sar': [
    { indicator: 'ema-crossover', title: 'Trend Following Context', description: 'EMA for trend direction reference', symbol: 'AAPL' }
  ],

  // ===== MOMENTUM STRATEGY ARTICLES =====
  'momentum-trading-strategy': [
    { indicator: 'rsi', title: 'Momentum with RSI', symbol: 'NVDA' },
    { indicator: 'macd', title: 'MACD Momentum Confirmation', symbol: 'NVDA' }
  ],
  'momentum-complete': [
    { indicator: 'rsi', title: 'RSI Momentum Analysis', symbol: 'AAPL' }
  ],
  'momentum-strategy': [
    { indicator: 'macd', title: 'MACD Momentum Signals', symbol: 'QQQ' },
    { indicator: 'rsi', title: 'RSI Momentum Zones', symbol: 'QQQ' }
  ],

  // ===== SWING TRADING ARTICLES =====
  'swing-trading-strategy': [
    { indicator: 'macd', title: 'MACD Swing Signals', symbol: 'AAPL' },
    { indicator: 'rsi', title: 'RSI Swing Entry Timing', symbol: 'AAPL' }
  ],
  'swing-trading-complete': [
    { indicator: 'ema-crossover', title: 'EMA for Swing Entries', symbol: 'MSFT' },
    { indicator: 'rsi', title: 'RSI for Swing Timing', symbol: 'MSFT' }
  ],
  'swing-trading': [
    { indicator: 'macd', title: 'MACD for Swing Trading', symbol: 'AAPL' }
  ],

  // ===== DAY TRADING ARTICLES =====
  'day-trading-strategy': [
    { indicator: 'macd', title: 'Intraday MACD Signals', symbol: 'SPY' },
    { indicator: 'rsi', title: 'RSI for Day Trading', symbol: 'SPY' }
  ],
  'day-trading-complete': [
    { indicator: 'ema-crossover', title: 'Fast EMA for Day Trading', symbol: 'QQQ' },
    { indicator: 'macd', title: 'MACD Intraday Momentum', symbol: 'QQQ' }
  ],
  'day-trading': [
    { indicator: 'macd', title: 'Day Trading with MACD', symbol: 'SPY' }
  ],

  // ===== SCALPING ARTICLES =====
  'scalping-strategy': [
    { indicator: 'ema-crossover', title: 'Fast EMA Scalping', symbol: 'SPY' },
    { indicator: 'rsi', title: 'RSI Scalp Entries', symbol: 'SPY' }
  ],
  'scalping-complete': [
    { indicator: 'macd', title: 'MACD Scalping Signals', symbol: 'QQQ' }
  ],
  'scalping': [
    { indicator: 'ema-crossover', title: 'EMA for Quick Entries', symbol: 'SPY' }
  ],

  // ===== MEAN REVERSION ARTICLES =====
  'mean-reversion-strategy': [
    { indicator: 'bollinger', title: 'Mean Reversion Bands', symbol: 'SPY' },
    { indicator: 'rsi', title: 'RSI Extremes for Mean Reversion', symbol: 'SPY' }
  ],
  'statistical-arbitrage': [
    { indicator: 'bollinger', title: 'Statistical Bands', description: 'Bollinger Bands for deviation analysis', symbol: 'SPY' },
    { indicator: 'rsi', title: 'Mean Reversion Signals', symbol: 'SPY' }
  ],

  // ===== BREAKOUT TRADING ARTICLES =====
  'breakout-trading': [
    { indicator: 'bollinger', title: 'Breakout with Bollinger', description: 'Band expansion for breakouts', symbol: 'AAPL' },
    { indicator: 'macd', title: 'MACD Breakout Confirmation', symbol: 'AAPL' }
  ],
  'breakout-trading-strategy': [
    { indicator: 'bollinger', title: 'Volatility Breakout Setup', symbol: 'SPY' },
    { indicator: 'macd', title: 'Momentum Confirmation', symbol: 'SPY' }
  ],
  'breakout-trading-complete': [
    { indicator: 'bollinger', title: 'Bollinger Breakout', symbol: 'QQQ' },
    { indicator: 'rsi', title: 'RSI Breakout Confirmation', symbol: 'QQQ' }
  ],

  // ===== POSITION TRADING ARTICLES =====
  'position-trading-strategy': [
    { indicator: 'sma-crossover', title: 'SMA for Position Trades', description: '50/200 SMA for long-term trends', symbol: 'AAPL' },
    { indicator: 'macd', title: 'MACD for Position Entry', symbol: 'AAPL' }
  ],
  'position-trading': [
    { indicator: 'sma-crossover', title: 'Long-Term Trend Analysis', symbol: 'SPY' }
  ],
  'buy-and-hold-strategy': [
    { indicator: 'sma-crossover', title: 'Long-Term Trend Context', description: 'SMA 50/200 for entry timing', symbol: 'SPY' }
  ],

  // ===== QUANTITATIVE & ALGORITHMIC ARTICLES =====
  'quantitative-trading': [
    { indicator: 'macd', title: 'Systematic MACD Signals', symbol: 'SPY' },
    { indicator: 'rsi', title: 'Quantitative RSI Strategy', symbol: 'SPY' }
  ],
  'algorithmic-trading': [
    { indicator: 'ema-crossover', title: 'Automated EMA Crossover', symbol: 'SPY' },
    { indicator: 'macd', title: 'Algorithmic MACD Signals', symbol: 'SPY' }
  ],
  'machine-learning-trading': [
    { indicator: 'macd', title: 'Feature: MACD Signals', symbol: 'AAPL' },
    { indicator: 'rsi', title: 'Feature: RSI Levels', symbol: 'AAPL' }
  ],

  // ===== VOLATILITY TRADING ARTICLES =====
  'volatility-trading': [
    { indicator: 'bollinger', title: 'Volatility Band Trading', symbol: 'VIX' }
  ],
  'straddle-strangle': [
    { indicator: 'bollinger', title: 'Volatility for Options', description: 'Bollinger squeeze for volatility plays', symbol: 'SPY' }
  ],
  'iron-condor': [
    { indicator: 'bollinger', title: 'Range Detection', description: 'Bollinger for range-bound markets', symbol: 'SPY' }
  ],
  'butterfly-spread': [
    { indicator: 'bollinger', title: 'Volatility Context', symbol: 'SPY' }
  ],

  // ===== MULTI-INDICATOR ARTICLES =====
  'multi-indicator-strategy': [
    { indicator: 'macd', title: 'MACD Component', symbol: 'AAPL' },
    { indicator: 'rsi', title: 'RSI Component', symbol: 'AAPL' },
    { indicator: 'ema-crossover', title: 'EMA Trend Filter', symbol: 'AAPL' }
  ],
  'confluence-trading': [
    { indicator: 'macd', title: 'MACD Confluence', symbol: 'SPY' },
    { indicator: 'rsi', title: 'RSI Confluence', symbol: 'SPY' },
    { indicator: 'bollinger', title: 'Bollinger Confluence', symbol: 'SPY' }
  ],

  // ===== SECTOR & MARKET ANALYSIS =====
  'sector-rotation': [
    { indicator: 'sma-crossover', title: 'Sector Trend Analysis', description: 'SMA for sector strength', symbol: 'XLK' },
    { indicator: 'rsi', title: 'Sector Momentum', symbol: 'XLK' }
  ],
  'market-breadth': [
    { indicator: 'macd', title: 'Market Momentum', symbol: 'SPY' },
    { indicator: 'rsi', title: 'Market Overbought/Oversold', symbol: 'SPY' }
  ],
  'intermarket-analysis': [
    { indicator: 'sma-crossover', title: 'Cross-Market Trends', symbol: 'SPY' }
  ],

  // ===== RISK MANAGEMENT ARTICLES =====
  'atr-stop-loss': [
    { indicator: 'bollinger', title: 'Volatility for Stop Placement', description: 'Bollinger bands for volatility context', symbol: 'AAPL' }
  ],
  'stop-loss-strategies': [
    { indicator: 'bollinger', title: 'Volatility-Based Stops', symbol: 'SPY' },
    { indicator: 'ema-crossover', title: 'EMA Trailing Stops', symbol: 'SPY' }
  ],
  'trailing-stop-strategy': [
    { indicator: 'ema-crossover', title: 'EMA Trailing Stop', description: 'Using EMAs for dynamic stops', symbol: 'AAPL' }
  ],

  // ===== PRICE ACTION WITH INDICATORS =====
  'pin-bar-strategy': [
    { indicator: 'rsi', title: 'RSI Confirmation for Pin Bars', symbol: 'AAPL' }
  ],
  'candlestick-pattern-trading': [
    { indicator: 'rsi', title: 'RSI Pattern Confirmation', symbol: 'AAPL' },
    { indicator: 'macd', title: 'MACD Pattern Confirmation', symbol: 'AAPL' }
  ],
  'price-action-basics': [
    { indicator: 'ema-crossover', title: 'EMA as Dynamic S/R', symbol: 'SPY' }
  ],

  // ===== DIVERGENCE STRATEGIES =====
  'divergence-trading': [
    { indicator: 'macd', title: 'MACD Divergence', symbol: 'AAPL' },
    { indicator: 'rsi', title: 'RSI Divergence', symbol: 'AAPL' }
  ],
  'hidden-divergence': [
    { indicator: 'macd', title: 'Hidden MACD Divergence', symbol: 'SPY' },
    { indicator: 'rsi', title: 'Hidden RSI Divergence', symbol: 'SPY' }
  ],

  // ===== GAP TRADING =====
  'gap-trading-strategy': [
    { indicator: 'macd', title: 'Gap Momentum Analysis', symbol: 'AAPL' },
    { indicator: 'rsi', title: 'Gap RSI Levels', symbol: 'AAPL' }
  ],
  'gap-and-go': [
    { indicator: 'ema-crossover', title: 'Gap with EMA Context', symbol: 'SPY' }
  ],

  // ===== REVERSAL STRATEGIES =====
  'reversal-trading': [
    { indicator: 'rsi', title: 'RSI Reversal Signals', symbol: 'AAPL' },
    { indicator: 'macd', title: 'MACD Reversal Confirmation', symbol: 'AAPL' }
  ],
  'trend-reversal-strategy': [
    { indicator: 'macd', title: 'MACD Trend Reversal', symbol: 'SPY' },
    { indicator: 'rsi', title: 'RSI Extreme Reversal', symbol: 'SPY' }
  ],

  // ===== CHANNEL TRADING =====
  'channel-patterns': [
    { indicator: 'bollinger', title: 'Bollinger Channel Trading', symbol: 'AAPL' }
  ],
  'range-trading': [
    { indicator: 'bollinger', title: 'Range with Bollinger', symbol: 'SPY' },
    { indicator: 'rsi', title: 'RSI Range Trading', symbol: 'SPY' }
  ],

  // ===== FIBONACCI ARTICLES =====
  'fibonacci-retracements': [
    { indicator: 'ema-crossover', title: 'EMA with Fibonacci', description: 'EMA trend context for retracements', symbol: 'AAPL' }
  ],
  'advanced-fibonacci': [
    { indicator: 'macd', title: 'MACD Fibonacci Confirmation', symbol: 'SPY' }
  ],

  // ===== SUPPORT/RESISTANCE =====
  'support-resistance': [
    { indicator: 'ema-crossover', title: 'EMA Dynamic S/R', description: 'Moving averages as dynamic levels', symbol: 'SPY' }
  ],

  // ===== VOLUME ANALYSIS =====
  'volume-analysis': [
    { indicator: 'macd', title: 'MACD with Volume Context', symbol: 'AAPL' }
  ],
  'vwap-strategy': [
    { indicator: 'ema-crossover', title: 'EMA vs VWAP Concept', symbol: 'SPY' }
  ],

  // ===== OPTIONS WITH INDICATORS =====
  'covered-call': [
    { indicator: 'bollinger', title: 'Volatility for Premium', symbol: 'AAPL' }
  ],
  'gamma-scalping': [
    { indicator: 'bollinger', title: 'Volatility Trading Context', symbol: 'SPY' }
  ],
  'delta-neutral-hedging': [
    { indicator: 'bollinger', title: 'Volatility Analysis', symbol: 'SPY' }
  ],
  'time-spread': [
    { indicator: 'bollinger', title: 'Volatility for Calendar Spreads', symbol: 'SPY' }
  ],

  // ===== SENTIMENT & NEWS =====
  'sentiment-analysis-trading': [
    { indicator: 'rsi', title: 'RSI Sentiment Confirmation', symbol: 'SPY' },
    { indicator: 'macd', title: 'MACD Momentum Context', symbol: 'SPY' }
  ],

  // ===== CRYPTO SPECIFIC =====
  'crypto-trading-strategy': [
    { indicator: 'macd', title: 'Crypto MACD Signals', symbol: 'BTC-USD' },
    { indicator: 'rsi', title: 'Crypto RSI Extremes', symbol: 'BTC-USD' }
  ],
  'bitcoin-trading': [
    { indicator: 'macd', title: 'Bitcoin MACD Analysis', symbol: 'BTC-USD' }
  ],

  // ===== FOREX SPECIFIC =====
  'forex-trading-strategy': [
    { indicator: 'ema-crossover', title: 'Forex EMA Crossover', symbol: 'EURUSD=X' },
    { indicator: 'macd', title: 'Forex MACD Strategy', symbol: 'EURUSD=X' }
  ],
  'currency-trading': [
    { indicator: 'ema-crossover', title: 'Currency Pair EMA', symbol: 'EURUSD=X' }
  ],

  // ===== MARKET MAKING & HFT =====
  'market-making': [
    { indicator: 'bollinger', title: 'Spread Volatility Analysis', symbol: 'SPY' }
  ],
  'high-frequency-trading': [
    { indicator: 'ema-crossover', title: 'Fast Signal Generation', symbol: 'SPY' }
  ],

  // ===== ARBITRAGE =====
  'arbitrage-trading': [
    { indicator: 'bollinger', title: 'Spread Analysis', symbol: 'SPY' }
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

/**
 * Get count of articles with indicator mappings
 */
export function getIndicatorMappingStats(): { totalArticles: number; indicatorCounts: Record<IndicatorType, number> } {
  const indicatorCounts: Record<IndicatorType, number> = {
    'macd': 0,
    'rsi': 0,
    'ema-crossover': 0,
    'sma-crossover': 0,
    'bollinger': 0,
    'donchian': 0,
  };
  
  let totalArticles = 0;
  for (const configs of Object.values(STRATEGY_INDICATOR_MAPPING)) {
    totalArticles++;
    for (const config of configs) {
      indicatorCounts[config.indicator]++;
    }
  }
  
  return { totalArticles, indicatorCounts };
}
