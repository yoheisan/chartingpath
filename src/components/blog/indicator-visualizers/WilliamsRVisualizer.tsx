import { IndicatorVisualizer, IndicatorVariant } from './IndicatorVisualizer';

const WILLIAMS_R_VARIANTS: IndicatorVariant[] = [
  {
    id: 'williams-r-indicator',
    name: 'Williams %R',
    indicatorType: 'williams-r',
    description: 'Williams %R (Williams Percent Range), developed by legendary trader Larry Williams, is a momentum oscillator that measures overbought and oversold levels. It\'s mathematically similar to Stochastic %K but inverted on a negative scale (-100 to 0). Williams created this indicator based on his observation that prices tend to close near the high at the end of an uptrend and near the low at the end of a downtrend. The indicator is known for its sensitivity and ability to signal reversals slightly before other oscillators.',
    origin: 'Created by Larry Williams, a renowned commodity trader who won the World Cup Trading Championship in 1987, turning $10,000 into over $1.1 million (11,376% return) in one year. Williams developed %R as part of his momentum-based trading systems. He emphasized using the indicator for timing entries in the direction of the larger trend rather than for counter-trend trading.',
    formula: `Williams %R Calculation:

%R = [(Highest High - Close) / (Highest High - Lowest Low)] × -100

Where:
- Highest High = Highest high over lookback period
- Lowest Low = Lowest low over lookback period  
- Close = Current closing price

Note: Result ranges from -100 (oversold) to 0 (overbought)
This is the inverse of Stochastic %K:
%R = Stochastic %K - 100`,
    defaultSettings: 'Standard: 14 periods (Larry Williams\' original). Short-term trading: 10 periods. Day trading: 5-7 periods. Longer-term: 20-25 periods. Overbought: -20 and above. Oversold: -80 and below.',
    interpretation: [
      '%R above -20 = Overbought territory (price at top of recent range)',
      '%R below -80 = Oversold territory (price at bottom of recent range)',
      '%R at 0 = Price closed at the period high',
      '%R at -100 = Price closed at the period low',
      'Movement from -80 toward 0 = Building bullish momentum',
      'Movement from -20 toward -100 = Building bearish momentum',
      '%R divergence from price = Early reversal warning',
      '%R staying overbought in uptrend = Trend strength (not automatic sell)',
      'Failure to reach previous extreme on retest = Momentum weakening'
    ],
    signalTypes: [
      {
        type: 'bullish',
        name: 'Oversold Reversal',
        description: '%R drops below -80 then rises back above. Indicates selling pressure exhausting and potential upward reversal. Best when aligning with support.'
      },
      {
        type: 'bullish',
        name: 'Bullish Failure Swing',
        description: '%R drops to oversold, bounces, retests but fails to make new low, then breaks above intermediate high. Strong bullish reversal pattern.'
      },
      {
        type: 'bearish',
        name: 'Overbought Reversal',
        description: '%R rises above -20 then falls back below. Buying pressure exhausting, potential downward reversal. Best when aligning with resistance.'
      },
      {
        type: 'bearish',
        name: 'Bearish Failure Swing',
        description: '%R rises to overbought, pulls back, retests but fails to reach previous high, then breaks below. Strong bearish reversal signal.'
      },
      {
        type: 'neutral',
        name: 'Momentum Thrust',
        description: '%R rapidly moving from one extreme to the other indicates strong momentum. In uptrend, oversold-to-overbought thrusts are bullish continuation signals.'
      }
    ],
    tradingRules: {
      entry: 'Larry Williams\' method: Trade WITH the trend using %R for timing. In uptrends, buy when %R drops below -80 and turns up. In downtrends, sell when %R rises above -20 and turns down. Counter-trend trading with %R is higher risk.',
      stopLoss: 'Place stop below the low that created the oversold reading (for longs) or above the high that created overbought (for shorts). Alternative: Use ATR-based stops. Exit if %R makes new extreme against your position.',
      target: 'For with-trend pullback entries: Target previous swing high/low or use trailing stop. For reversal trades: Target the opposite extreme zone. Many traders use -50 as a mid-point for partial profits.'
    },
    bestContext: [
      'Pullback entries in established trends (Larry Williams\' preferred use)',
      'Short-term momentum trading and swing trading',
      'Identifying short-term overbought/oversold conditions',
      'Divergence trading at key support/resistance',
      'Timing entries after indicator-based setups signal direction',
      'Fast-moving markets requiring responsive indicators',
      'Commodity futures (Williams\' original domain)',
      'Combined with trend filters (moving averages, ADX)'
    ],
    commonMistakes: [
      'Using %R for counter-trend trading in strong trends (gets crushed)',
      'Not understanding %R stays overbought during strong uptrends',
      'Confusing the negative scale (-100 to 0) with typical 0-100 oscillators',
      'Ignoring the larger trend when taking %R signals',
      'Not using confirmation from price action or other indicators',
      'Expecting immediate reversal at extreme readings',
      'Using %R in isolation without trend context',
      'Over-trading every touch of -80 or -20 without confirmation'
    ],
    prosAndCons: {
      pros: [
        'Very responsive due to sensitivity to recent price action',
        'Simple calculation with clear interpretation',
        'Developed by a championship-winning trader',
        'Works well for timing entries in trends',
        'Failure swings provide reliable reversal signals',
        'No additional signal line to confuse interpretation',
        'Effective across multiple timeframes',
        'Identifies precise short-term exhaustion points'
      ],
      cons: [
        'Can be too sensitive/noisy for some traders',
        'Generates many signals in choppy markets',
        'Inverted scale can be confusing initially',
        'Stays overbought/oversold during strong trends (false signals)',
        'Requires trend filter for best results',
        'Less smoothing than Stochastic (noisier)',
        'Counter-trend signals risky without confirmation',
        'No signal line for crossover timing'
      ]
    },
    advancedTechniques: [
      'Williams\' Ultimate Oscillator: Larry Williams also created this multi-timeframe momentum indicator that combines 7, 14, and 28 period momentum',
      '%R + ADX Filter: Only trade %R signals when ADX > 25 (trending market). Ignore %R in low ADX (ranging) conditions.',
      'Multi-Timeframe %R: Weekly %R for bias (only trade direction of weekly), daily %R for entry timing at extremes',
      '%R Divergence + Price Action: Combine %R divergence with candlestick reversal patterns (hammers, engulfing) for high-probability entries',
      '%R Thrust Signal: When %R moves from below -95 to above -20 in < 5 bars, indicates powerful momentum thrust—trade continuation, not reversal',
      'Double Bottom/Top in %R: Two touches of extreme zone without price making new extreme = strong reversal signal when confirmed'
    ]
  }
];

export const WilliamsRVisualizer = () => (
  <IndicatorVisualizer
    title="Williams %R Indicator Guide"
    subtitle="Master Larry Williams' momentum oscillator that measures overbought/oversold conditions. Learn the championship trader's approach to timing pullback entries using this sensitive momentum indicator."
    variants={WILLIAMS_R_VARIANTS}
    category="momentum"
  />
);

export default WilliamsRVisualizer;
