import { IndicatorVisualizer, IndicatorVariant } from './IndicatorVisualizer';

const STOCHASTIC_VARIANTS: IndicatorVariant[] = [
  {
    id: 'stochastic-oscillator',
    name: 'Stochastic Oscillator',
    indicatorType: 'stochastic',
    description: 'The Stochastic Oscillator, developed by George Lane in the late 1950s, is a momentum indicator that compares a security\'s closing price to its price range over a specified period. Based on the observation that closing prices tend to close near the high during uptrends and near the low during downtrends, the Stochastic measures the position of the current close relative to the recent high-low range. The indicator oscillates between 0 and 100, with readings above 80 considered overbought and below 20 considered oversold.',
    origin: 'Created by George Lane, a securities trader and technical analyst, who developed it during the late 1950s at Investment Educators Inc. Lane famously stated: "Stochastics measures the momentum of price. If you visualize a rocket going up in the air, before it can turn down, it must slow down. Momentum always changes direction before price." He emphasized that the indicator follows the speed or momentum of price, not price itself.',
    formula: `%K (Fast Stochastic):
%K = [(Current Close - Lowest Low) / (Highest High - Lowest Low)] × 100

Where:
- Current Close = Most recent closing price
- Lowest Low = Lowest low over lookback period (typically 14)
- Highest High = Highest high over lookback period

%D (Slow Stochastic / Signal Line):
%D = 3-period SMA of %K

Slow Stochastic:
Slow %K = %D (3-period SMA of Fast %K)
Slow %D = 3-period SMA of Slow %K`,
    defaultSettings: 'Standard: 14, 3, 3 (14-period lookback, 3-period %K smoothing, 3-period %D). Short-term trading: 5, 3, 3. Position trading: 21, 3, 3. The "Slow Stochastic" (3-period smoothed %K) is most commonly used as Fast Stochastic is too volatile.',
    interpretation: [
      '%K above 80 = Overbought territory (potential selling pressure building)',
      '%K below 20 = Oversold territory (potential buying opportunity)',
      '%K crossing ABOVE %D = Bullish crossover signal (momentum turning up)',
      '%K crossing BELOW %D = Bearish crossover signal (momentum turning down)',
      'Best signals occur when crossovers happen in extreme zones (above 80 or below 20)',
      'Divergence between price and Stochastic warns of potential reversals',
      '%K at 100 means price closed at the period high; at 0 means closed at period low',
      'Crossover in middle zone (40-60) = weaker, less reliable signals'
    ],
    signalTypes: [
      {
        type: 'bullish',
        name: 'Oversold Bullish Crossover',
        description: '%K crosses above %D while both lines are below 20. This is the highest probability bullish signal as it catches momentum turning positive from extreme oversold conditions.'
      },
      {
        type: 'bullish',
        name: 'Bullish Divergence',
        description: 'Price makes a lower low while Stochastic makes a higher low. Indicates underlying buying pressure despite price weakness—often precedes reversals.'
      },
      {
        type: 'bearish',
        name: 'Overbought Bearish Crossover',
        description: '%K crosses below %D while both lines are above 80. High probability bearish signal indicating momentum exhaustion at elevated price levels.'
      },
      {
        type: 'bearish',
        name: 'Bearish Divergence',
        description: 'Price makes a higher high while Stochastic makes a lower high. Shows momentum weakening despite higher prices—warns of potential reversal.'
      },
      {
        type: 'neutral',
        name: 'Overbought/Oversold Hold',
        description: 'In strong trends, Stochastic can remain overbought (>80) or oversold (<20) for extended periods. Avoid counter-trend trades until crossover confirmation.'
      }
    ],
    tradingRules: {
      entry: 'LONG: Enter when %K crosses above %D below the 20 level (oversold zone). Add confirmation with price above short-term moving average. SHORT: Enter when %K crosses below %D above the 80 level (overbought zone). Best entries occur when higher timeframe trend aligns with signal direction.',
      stopLoss: 'Place stop below recent swing low for long trades (the low that corresponded to the oversold reading). For shorts, stop above recent swing high. Alternatively, use ATR-based stops of 1.5-2× ATR from entry.',
      target: 'Initial target: Opposite extreme zone (entry in oversold targets overbought and vice versa). Trail stops using middle band (50) as dynamic support/resistance. Many traders exit on opposite zone crossover.'
    },
    bestContext: [
      'Range-bound markets where price oscillates between support and resistance',
      'Pullback entries in trending markets (oversold in uptrend = buying opportunity)',
      'Combined with trend-following indicators (EMA, ADX) for confirmation',
      'When divergences form at key support/resistance levels',
      'Mean reversion strategies in stable, non-trending conditions',
      'Identifying short-term reversal points within established trends',
      'Forex and equity markets with clear price ranges',
      'Intraday and swing trading timeframes'
    ],
    commonMistakes: [
      'Blindly selling overbought (>80) in strong uptrends—price can stay overbought',
      'Ignoring the larger trend when trading Stochastic signals',
      'Using Fast Stochastic which produces too many false signals',
      'Not waiting for actual crossover before entering',
      'Trading crossovers in the middle zone (40-60) where signals are unreliable',
      'Ignoring divergences which are among the most powerful signals',
      'Using inappropriate lookback periods for the market conditions',
      'Treating 80/20 as automatic reversal levels rather than zones'
    ],
    prosAndCons: {
      pros: [
        'Excellent at identifying potential reversal points in ranges',
        'Clear overbought/oversold zones simplify interpretation',
        'Works well for pullback entries in trending markets',
        'Divergence signals provide early warning of reversals',
        '%K/%D crossovers provide specific entry triggers',
        'Effective across multiple timeframes and asset classes',
        'Combines momentum and relative position analysis'
      ],
      cons: [
        'Generates false signals in strongly trending markets',
        'Can remain in extreme zones for extended periods in trends',
        'Requires trend filter for optimal results',
        'Lagging nature means you miss some move on entry',
        'Multiple parameters require optimization for each market',
        'Whipsaw signals during choppy/volatile conditions',
        'Middle-zone crossovers have low reliability'
      ]
    },
    advancedTechniques: [
      'Lane\'s %D Hook: Look for %D to "hook" and turn before crossover completes—early entry signal used by experienced traders',
      'Stochastic Pop: When %K rises above 80 and stays there while rising = very strong momentum; avoid shorting until it drops back below 80',
      'Dual Timeframe Stochastic: Use weekly Stochastic for direction, daily for entry timing; only trade when both align',
      'Stochastic + RSI Combo: When both oscillators are oversold simultaneously, probability of bounce increases significantly',
      'Bull/Bear Setup: In uptrends, only trade bullish crossovers below 50 (ignore bearish); in downtrends, only trade bearish crossovers above 50',
      'Hidden Divergence: Price makes higher low + Stochastic makes lower low = continuation signal in uptrend (opposite for downtrends)'
    ]
  }
];

export const StochasticVisualizer = () => (
  <IndicatorVisualizer
    title="Stochastic Oscillator Guide"
    subtitle="Master George Lane's momentum oscillator that compares closing prices to the recent price range. Learn to identify high-probability reversal signals using the %K and %D lines, with overbought/oversold zones and crossover techniques."
    variants={STOCHASTIC_VARIANTS}
    category="momentum"
  />
);

export default StochasticVisualizer;
