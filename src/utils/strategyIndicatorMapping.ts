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
  'donchian-channels': [
    { indicator: 'donchian', title: 'Donchian Channel Breakouts', description: '20-period high/low bands for trend breakouts', symbol: 'SPY' }
  ],
  'high-low-channel-strategy': [
    { indicator: 'donchian', title: 'High-Low Channel Breakout', description: 'Price channel extremes for entry signals', symbol: 'AAPL' }
  ],
  'channel-trading': [
    { indicator: 'donchian', title: 'Parallel Channel Trading', description: 'Trading within defined price channels', symbol: 'SPY' }
  ],
  'channel-patterns': [
    { indicator: 'donchian', title: 'Channel Pattern Recognition', description: 'Identifying tradeable channel structures', symbol: 'MSFT' }
  ],
  
  // ===== ICHIMOKU CLOUD =====
  'ichimoku-strategy': [
    { 
      indicator: 'ichimoku', 
      title: 'Ichimoku Cloud (Ichimoku Kinko Hyo)',
      description: 'Complete trading system: Tenkan-sen (blue), Kijun-sen (red), Cloud (Kumo), and Chikou Span',
      symbol: 'SPY'
    }
  ],
  'ichimoku-cloud': [
    { 
      indicator: 'ichimoku', 
      title: 'Ichimoku Cloud Analysis',
      description: 'Five-line indicator system for trend, momentum, and support/resistance',
      symbol: 'AAPL'
    }
  ],
  'ichimoku-trading': [
    { indicator: 'ichimoku', title: 'Ichimoku Trading System', symbol: 'MSFT' }
  ],
  'ichimoku-complete': [
    { indicator: 'ichimoku', title: 'Complete Ichimoku Guide', symbol: 'SPY' }
  ],
  
  // ===== KELTNER CHANNELS (ATR-Based) =====
  'keltner-channels': [
    { indicator: 'bollinger', title: 'Keltner vs Bollinger Comparison', description: 'Volatility channel visualization', symbol: 'SPY' },
    { indicator: 'donchian', title: 'Channel Breakout Context', symbol: 'SPY' }
  ],
  'keltner-channel-strategy': [
    { indicator: 'bollinger', title: 'ATR-Based Volatility Bands', description: 'Keltner-style channel trading', symbol: 'AAPL' },
    { indicator: 'donchian', title: 'Breakout Channel Reference', symbol: 'AAPL' }
  ],
  
  // ===== BREAKOUT TRADING =====
  'breakout-trading': [
    { indicator: 'donchian', title: 'Breakout Channel Levels', description: 'Donchian bands identify breakout zones', symbol: 'AAPL' },
    { indicator: 'bollinger', title: 'Volatility Squeeze Setup', symbol: 'AAPL' }
  ],
  'breakout-trading-complete': [
    { indicator: 'donchian', title: 'Channel Breakout Detection', description: '20-day high/low for explosive moves', symbol: 'QQQ' },
    { indicator: 'macd', title: 'Momentum Confirmation', symbol: 'QQQ' }
  ],
  
  // ===== RANGE-BOUND & GRID TRADING =====
  'range-bound-trading': [
    { indicator: 'donchian', title: 'Range Boundaries', description: 'Donchian channels define range extremes', symbol: 'SPY' },
    { indicator: 'rsi', title: 'Overbought/Oversold Zones', symbol: 'SPY' }
  ],
  'grid-trading': [
    { indicator: 'donchian', title: 'Grid Level Reference', description: 'Channel extremes for grid placement', symbol: 'EURUSD=X' }
  ],
  'rectangle-pattern': [
    { indicator: 'donchian', title: 'Rectangle Range Visualization', description: 'Horizontal channel for range trading', symbol: 'AAPL' }
  ],
  
  // ===== SUPPORT & RESISTANCE =====
  'support-resistance': [
    { indicator: 'donchian', title: 'Dynamic S/R Levels', description: 'Donchian channels as dynamic support/resistance', symbol: 'SPY' },
    { indicator: 'ema-crossover', title: 'EMA Dynamic Levels', symbol: 'SPY' }
  ],
  'support-resistance-strategy': [
    { indicator: 'donchian', title: 'Channel-Based S/R', description: 'Price channels define key levels', symbol: 'AAPL' }
  ],
  'support-resistance-trading': [
    { indicator: 'donchian', title: 'Support/Resistance Channels', description: 'Donchian bands visualize key price levels', symbol: 'MSFT' },
    { indicator: 'ema-crossover', title: 'Moving Average Support', symbol: 'MSFT' }
  ],
  'support-and-resistance-basics': [
    { indicator: 'donchian', title: 'Price Channel Levels', description: 'Channel extremes as support/resistance', symbol: 'SPY' }
  ],
  
  // ===== TRENDLINE & GAP TRADING =====
  'trendline-trading': [
    { indicator: 'donchian', title: 'Channel Trendlines', description: 'Donchian visualizes trend boundaries', symbol: 'AAPL' },
    { indicator: 'ema-crossover', title: 'Trend Direction Confirmation', symbol: 'AAPL' }
  ],
  'gap-trading-strategy': [
    { indicator: 'donchian', title: 'Gap Channel Context', description: 'Channel levels for gap analysis', symbol: 'AAPL' },
    { indicator: 'macd', title: 'Gap Momentum', symbol: 'AAPL' }
  ],
  
  // ===== TECHNICAL INDICATOR ARTICLES (Direct indicator visualizations) =====
  'atr-indicator': [
    { indicator: 'atr', title: 'ATR - Average True Range', description: 'Measures volatility for position sizing and stop placement', symbol: 'SPY' }
  ],
  'cci-indicator': [
    { indicator: 'cci', title: 'CCI - Commodity Channel Index', description: 'Momentum oscillator identifying cyclical trends', symbol: 'SPY' }
  ],
  'adx-indicator': [
    { indicator: 'adx', title: 'ADX - Average Directional Index', description: 'Measures trend strength regardless of direction', symbol: 'SPY' }
  ],
  'stochastic-oscillator': [
    { indicator: 'stochastic', title: 'Stochastic Oscillator', description: 'Momentum comparing closing price to price range', symbol: 'SPY' }
  ],
  'williams-r': [
    { indicator: 'williams-r', title: 'Williams %R', description: 'Momentum indicator measuring overbought/oversold levels', symbol: 'SPY' }
  ],
  'money-flow-index': [
    { indicator: 'mfi', title: 'Money Flow Index (MFI)', description: 'Volume-weighted RSI for buying/selling pressure', symbol: 'SPY' }
  ],
  'obv-indicator': [
    { indicator: 'obv', title: 'On-Balance Volume', description: 'Volume indicator confirming price trends', symbol: 'SPY' }
  ],
  'roc-indicator': [
    { indicator: 'roc', title: 'Rate of Change', description: 'Percentage price change momentum oscillator', symbol: 'SPY' }
  ],
  'parabolic-sar': [
    { indicator: 'parabolic-sar', title: 'Parabolic SAR', description: 'Trend-following stop and reverse indicator', symbol: 'SPY' }
  ],
  'sma-vs-ema': [
    { indicator: 'ema-crossover', title: 'SMA vs EMA Comparison', description: 'Fast EMA (12) vs Slow EMA (26)', symbol: 'SPY' },
    { indicator: 'sma-crossover', title: 'SMA Crossover', description: 'SMA 50 vs SMA 200', symbol: 'SPY' }
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

  // ===== MOVING AVERAGE ARTICLES =====
  'moving-averages': [
    { indicator: 'ema-crossover', title: 'EMA Crossover Example', description: 'Fast and slow EMA interaction', symbol: 'AAPL' },
    { indicator: 'sma-crossover', title: 'SMA 50/200 Example', description: 'Golden cross and death cross signals', symbol: 'SPY' }
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
  // keltner-channels and donchian-channels moved to DONCHIAN section above

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
  // parabolic-sar already defined in indicator articles section above

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
  // NOTE: statistical-arbitrage uses StatArbVisualizer with cointegration concepts,
  // pairs trading math, and Z-Score signal simulator - much more relevant than generic indicators

  // BREAKOUT TRADING moved to DONCHIAN/BREAKOUT section above
  'breakout-trading-strategy': [
    { indicator: 'donchian', title: 'Channel Breakout', symbol: 'SPY' },
    { indicator: 'bollinger', title: 'Volatility Squeeze', symbol: 'SPY' }
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
  // NOTE: These articles now use purpose-built visualizers (QuantTradingVisualizer, 
  // AlgorithmicTradingVisualizer, MachineLearningVisualizer, etc.) that provide
  // much more relevant educational content than generic price indicator charts.
  // The focus of these articles is on system architecture, factor models, and ML pipelines,
  // NOT traditional technical indicators.

  // ===== VOLATILITY TRADING ARTICLES =====
  // Note: Options-specific articles (iron-condor, straddle-strangle, butterfly, covered-call, 
  // delta-neutral, gamma-scalping, time-spread) now use dedicated OptionsPayoffChart 
  // via optionsStrategyMapping.ts for proper payoff diagram visualizations
  'volatility-trading': [
    { indicator: 'bollinger', title: 'Volatility Band Trading', symbol: 'VIX' }
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

  // gap-trading-strategy moved to channel section above
  'gap-and-go': [
    { indicator: 'donchian', title: 'Gap Channel Reference', symbol: 'SPY' },
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

  // channel-patterns moved to DONCHIAN section above
  'range-trading': [
    { indicator: 'donchian', title: 'Range Channel Extremes', symbol: 'SPY' },
    { indicator: 'rsi', title: 'RSI Range Trading', symbol: 'SPY' }
  ],

  // ===== FIBONACCI ARTICLES =====
  'fibonacci-retracements': [
    { indicator: 'ema-crossover', title: 'EMA with Fibonacci', description: 'EMA trend context for retracements', symbol: 'AAPL' }
  ],
  'advanced-fibonacci': [
    { indicator: 'macd', title: 'MACD Fibonacci Confirmation', symbol: 'SPY' }
  ],

  // support-resistance moved to DONCHIAN section above

  // ===== VOLUME ANALYSIS =====
  'volume-analysis': [
    { indicator: 'macd', title: 'MACD with Volume Context', symbol: 'AAPL' }
  ],
  'vwap-strategy': [
    { indicator: 'ema-crossover', title: 'EMA vs VWAP Concept', symbol: 'SPY' }
  ],

  // ===== OPTIONS WITH INDICATORS =====
  // Note: Main options strategy articles now use dedicated OptionsPayoffChart.
  // These entries are for general options-adjacent content that benefits from price/indicator context.
  // Primary options strategies (covered-call, iron-condor, straddle-strangle, butterfly-spread, 
  // time-spread, delta-neutral-hedging, gamma-scalping) are handled by optionsStrategyMapping.ts

  // ===== SENTIMENT & NEWS =====
  // NOTE: sentiment-analysis-trading uses SentimentAnalysisVisualizer which covers
  // NLP pipelines, sentiment scoring, and signal integration - more relevant than price charts

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
  // NOTE: market-making and high-frequency-trading articles use purpose-built visualizers
  // (MarketMakingVisualizer, HFTVisualizer) that cover bid-ask spreads, latency, and 
  // infrastructure - generic price indicator charts are not relevant to these topics

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
    'ichimoku': 0,
    'stochastic': 0,
    'williams-r': 0,
    'cci': 0,
    'adx': 0,
    'atr': 0,
    'obv': 0,
    'mfi': 0,
    'roc': 0,
    'parabolic-sar': 0,
    'pivot-points': 0,
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
