// Maps strategy slugs to relevant DynamicPatternChart pattern types
// Used to embed visual examples in strategy articles

export interface StrategyChartConfig {
  patternType: string;
  title?: string;
  description?: string;
}

export const STRATEGY_CHART_MAPPING: Record<string, StrategyChartConfig[]> = {
  // Chart Pattern Strategies
  'head-shoulders-trading': [
    { patternType: 'head-shoulders', title: 'Head and Shoulders Pattern', description: 'Classic reversal pattern identifying trend exhaustion' }
  ],
  'inverted-head-shoulders': [
    { patternType: 'inverted-head-shoulders', title: 'Inverse Head and Shoulders', description: 'Bullish reversal at market bottoms' }
  ],
  'double-top-strategy': [
    { patternType: 'double-top', title: 'Double Top Pattern', description: 'Bearish reversal after failed second attempt at highs' }
  ],
  'double-bottom-strategy': [
    { patternType: 'double-bottom', title: 'Double Bottom Pattern', description: 'Bullish reversal after successful retest of lows' }
  ],
  'flags-pennants-trading': [
    { patternType: 'bull-flag', title: 'Bull Flag Pattern', description: 'Continuation pattern during uptrends' },
    { patternType: 'pennant', title: 'Pennant Pattern', description: 'Tight consolidation before breakout' }
  ],
  
  // Breakout & Triangle Strategies
  'breakout-trading': [
    { patternType: 'ascending-triangle', title: 'Ascending Triangle Breakout', description: 'Bullish continuation with horizontal resistance' }
  ],
  'breakout-trading-complete': [
    { patternType: 'ascending-triangle', title: 'Ascending Triangle', description: 'Breakout above flat resistance' },
    { patternType: 'symmetrical-triangle', title: 'Symmetrical Triangle', description: 'Consolidation before directional move' }
  ],
  
  // Trend Strategies
  'trend-following-strategy': [
    { patternType: 'bull-flag', title: 'Trend Continuation Flag', description: 'Pullback within established trend' }
  ],
  'pullback-trading-strategy': [
    { patternType: 'falling-wedge', title: 'Falling Wedge Pullback', description: 'Bullish reversal within uptrend' }
  ],
  'reversal-trading-strategy': [
    { patternType: 'double-bottom', title: 'Reversal at Key Support', description: 'Classic trend reversal pattern' },
    { patternType: 'head-shoulders', title: 'Top Reversal Pattern', description: 'Distribution before downtrend' }
  ],
  
  // Candlestick Pattern Strategies
  'candlestick-pattern-trading': [
    { patternType: 'hammer', title: 'Hammer Pattern', description: 'Single-candle bullish reversal' },
    { patternType: 'bullish-engulfing', title: 'Bullish Engulfing', description: 'Strong reversal candle pattern' }
  ],
  'pin-bar-strategy': [
    { patternType: 'hammer', title: 'Pin Bar (Hammer)', description: 'Rejection candle at key level' }
  ],
  
  // Wedge & Cup Strategies  
  'wedge-trading-strategy': [
    { patternType: 'rising-wedge', title: 'Rising Wedge', description: 'Bearish reversal pattern' },
    { patternType: 'falling-wedge', title: 'Falling Wedge', description: 'Bullish reversal pattern' }
  ],
  'cup-handle-trading': [
    { patternType: 'cup-handle', title: 'Cup with Handle', description: 'Bullish continuation with consolidation' }
  ],
  
  // Momentum & Moving Average Strategies
  'momentum-trading-strategy': [
    { patternType: 'bull-flag', title: 'Momentum Flag', description: 'Strong momentum with brief consolidation' }
  ],
  'moving-average-crossover-strategy': [
    { patternType: 'ascending-triangle', title: 'Breakout After Crossover', description: 'Triangle forming after MA cross signal' }
  ],
  'golden-death-cross': [
    { patternType: 'symmetrical-triangle', title: 'Golden Cross Setup', description: 'Consolidation before major trend change' }
  ],
  'ema-crossover-strategy': [
    { patternType: 'bull-flag', title: 'EMA Crossover Continuation', description: 'Flag formation confirming crossover signal' }
  ],
  
  // Mean Reversion Strategies
  'mean-reversion-strategy': [
    { patternType: 'double-bottom', title: 'Mean Reversion Entry', description: 'Reversal at extreme oversold levels' }
  ],
  'bollinger-bands-strategy': [
    { patternType: 'double-bottom', title: 'Bollinger Band Bounce', description: 'Reversal at lower band' }
  ],
  'bollinger-bands-complete': [
    { patternType: 'double-bottom', title: 'Lower Band Reversal', description: 'Entry at 2 standard deviation extreme' }
  ],
  
  // Swing & Position Trading
  'swing-trading-strategy': [
    { patternType: 'falling-wedge', title: 'Swing Trading Setup', description: 'Multi-day reversal pattern' }
  ],
  'position-trading-strategy': [
    { patternType: 'cup-handle', title: 'Long-Term Base Pattern', description: 'Multi-week accumulation pattern' }
  ],
  
  // Range & Gap Trading
  'range-bound-trading': [
    { patternType: 'rectangle', title: 'Trading Range Pattern', description: 'Horizontal consolidation with clear boundaries' }
  ],
  'gap-trading-strategy': [
    { patternType: 'island-reversal', title: 'Gap Trading Setup', description: 'Price gap creating island pattern' }
  ],
  'gap-trading-complete': [
    { patternType: 'bull-flag', title: 'Gap and Go Pattern', description: 'Continuation after gap up' }
  ],
  
  // Ichimoku & Advanced
  'ichimoku-strategy': [
    { patternType: 'ascending-triangle', title: 'Cloud Breakout', description: 'Breakout above Kumo cloud resistance' }
  ],
  'elliott-wave': [
    { patternType: 'symmetrical-triangle', title: 'Wave 4 Triangle', description: 'Corrective wave forming triangle' }
  ],
  'fractal-trading': [
    { patternType: 'double-top', title: 'Fractal Reversal', description: 'Fractal pattern at swing highs' }
  ],
};

// Get chart configurations for a given strategy slug
export function getStrategyCharts(slug: string): StrategyChartConfig[] {
  return STRATEGY_CHART_MAPPING[slug] || [];
}

// Check if a strategy has associated chart visualizations
export function hasStrategyCharts(slug: string): boolean {
  return slug in STRATEGY_CHART_MAPPING && STRATEGY_CHART_MAPPING[slug].length > 0;
}
