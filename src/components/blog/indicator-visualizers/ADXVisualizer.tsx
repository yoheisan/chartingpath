import { IndicatorVisualizer, IndicatorVariant } from './IndicatorVisualizer';

const ADX_VARIANTS: IndicatorVariant[] = [
  {
    id: 'adx-indicator',
    name: 'Average Directional Index',
    indicatorType: 'adx',
    description: 'The Average Directional Index (ADX), another masterpiece from J. Welles Wilder Jr., measures trend strength regardless of direction. The ADX line tells you HOW STRONG a trend is, while its companion lines (+DI and -DI) tell you the direction. ADX values range from 0 to 100: readings below 20 indicate weak/no trend (range-bound market), while readings above 25-30 indicate a trending market. Unlike most indicators, ADX doesn\'t signal buy or sell—it tells you whether to use trend-following or range-trading strategies.',
    origin: 'Developed by J. Welles Wilder Jr. and published in his 1978 book "New Concepts in Technical Trading Systems." Wilder created ADX to complement his Directional Movement System (+DI/-DI) by providing a single line that quantifies trend strength. This allows traders to quickly assess whether price movements represent a true trend or just noise.',
    formula: `Directional Movement:
+DM = Current High - Previous High (if positive and > |Low change|)
-DM = Previous Low - Current Low (if positive and > |High change|)

True Range (TR) = max(High-Low, |High-PrevClose|, |Low-PrevClose|)

Directional Indicators (14-period smoothed):
+DI = 100 × Smoothed(+DM) / Smoothed(TR)
-DI = 100 × Smoothed(-DM) / Smoothed(TR)

DX (Directional Index):
DX = 100 × |+DI - -DI| / (+DI + -DI)

ADX = Wilder Smoothed Average of DX (14 periods)`,
    defaultSettings: 'Standard: 14 periods (Wilder\'s original). Some traders use 7-10 for more responsive readings on shorter timeframes. ADX threshold for "trending": 25 (conservative) or 20 (aggressive). Strong trend: ADX > 40. Very strong trend: ADX > 50.',
    interpretation: [
      'ADX < 20 = Weak or absent trend; market is range-bound or choppy',
      'ADX 20-25 = Emerging trend; prepare for potential trend-following entries',
      'ADX 25-40 = Strong trend in place; trend-following strategies work well',
      'ADX 40-50 = Very strong trend; be cautious of exhaustion approaching',
      'ADX > 50 = Extremely strong trend; often near exhaustion point',
      '+DI above -DI = Uptrend (bullish directional movement dominant)',
      '-DI above +DI = Downtrend (bearish directional movement dominant)',
      'DI crossovers signal potential trend changes when ADX confirms strength',
      'Rising ADX = Trend strengthening; falling ADX = Trend weakening',
      'ADX peaks often coincide with trend exhaustion points'
    ],
    signalTypes: [
      {
        type: 'bullish',
        name: 'Bullish DI Crossover with Rising ADX',
        description: '+DI crosses above -DI while ADX rises above 25. This is the classic bullish trend signal indicating new uptrend with momentum.'
      },
      {
        type: 'bearish',
        name: 'Bearish DI Crossover with Rising ADX',
        description: '-DI crosses above +DI while ADX rises above 25. Classic bearish signal indicating new downtrend establishing with momentum.'
      },
      {
        type: 'neutral',
        name: 'ADX Below 20',
        description: 'No trend present—market is range-bound. Use oscillators (RSI, Stochastic) and mean reversion strategies instead of trend-following.'
      },
      {
        type: 'neutral',
        name: 'ADX Peak and Decline',
        description: 'When ADX peaks above 40-50 and starts declining, trend may be exhausting. Consider taking profits or tightening stops.'
      }
    ],
    tradingRules: {
      entry: 'Enter LONG when +DI crosses above -DI AND ADX is above 25 (or rising toward 25). Enter SHORT on inverse conditions. Many traders wait for ADX confirmation above 25 before acting on DI crossovers. Avoid trading DI crossovers when ADX is below 20.',
      stopLoss: 'Place stop below recent swing low (for longs) or above swing high (for shorts). Alternative: Use ATR-based stops. Trailing stop: Exit when opposite DI crossover occurs or ADX turns down sharply.',
      target: 'Ride trends while ADX remains elevated. Watch for ADX peaks (often 40-50+) as potential exit zones. When ADX turns down from elevated levels, consider trailing stops or partial profit taking.'
    },
    bestContext: [
      'Identifying whether market is trending or ranging (strategy selection)',
      'Confirming trend-following entry signals from other indicators',
      'Detecting trend exhaustion (ADX peaks above 40-50)',
      'Filtering breakout signals (only trade breakouts when ADX rising)',
      'Determining when to switch from trend to range strategies',
      'Equity indices, forex pairs, and commodities with clear trending tendencies',
      'Daily and 4-hour timeframes for swing trading',
      'Avoiding trades during low ADX (choppy) periods'
    ],
    commonMistakes: [
      'Trying to use ADX for directional signals (it only measures strength)',
      'Trading DI crossovers when ADX is below 20 (unreliable in ranges)',
      'Shorting just because ADX is "high" (high ADX = strong trend, not reversal)',
      'Ignoring the DI lines and only watching ADX (need both for full picture)',
      'Expecting ADX to work in all market conditions equally',
      'Using ADX signals without understanding the math behind DM',
      'Not recognizing that falling ADX doesn\'t mean trend reversal—just weakening',
      'Over-trading during low ADX periods (avoid or use different strategy)'
    ],
    prosAndCons: {
      pros: [
        'Objectively quantifies trend strength (removes guesswork)',
        '+DI/-DI provides clear directional signals',
        'Helps select appropriate strategy (trend vs range)',
        'Works across all markets and timeframes',
        'ADX peaks provide potential exit signals',
        'Low ADX warns against trend-following trades',
        'Combines well with other trend indicators for confirmation',
        'Wilder-smoothed reduces false signals'
      ],
      cons: [
        'Lagging indicator—confirms trends after they start',
        'DI crossovers can whipsaw in volatile conditions',
        'ADX takes time to rise at trend beginnings',
        'Complex calculation with multiple components',
        'High ADX doesn\'t mean reversal imminent (trends can persist)',
        'Doesn\'t indicate optimal entry/exit prices',
        'Requires price action context for best results',
        'Can stay elevated or depressed for extended periods'
      ]
    },
    advancedTechniques: [
      'ADX Trend Change: When ADX rises from below 15 to above 30, powerful new trend is likely starting—look for entry opportunities in DI direction',
      'ADX + Moving Average: Trade in direction of price vs 50 EMA only when ADX > 25. Ignore signals when ADX < 20.',
      'DI Extreme Spread: When +DI/-DI spread exceeds 40 points and ADX > 40, trend is often overextended—watch for reversion',
      'ADX Slope Analysis: Rising ADX slope = strengthening trend. Flattening ADX slope = weakening momentum, even if ADX still high.',
      'Multi-Timeframe ADX: Weekly ADX > 25 + Daily DI crossover = high-probability swing trade setup',
      'ADX Divergence: Rarely discussed, but price making new highs while ADX makes lower highs can warn of weakening uptrend'
    ]
  }
];

export const ADXVisualizer = () => (
  <IndicatorVisualizer
    title="ADX: Average Directional Index Guide"
    subtitle="Master J. Welles Wilder's trend strength indicator that tells you HOW STRONG a trend is, not which direction. Learn to use ADX with +DI/-DI for trend identification and strategy selection between trending and ranging markets."
    variants={ADX_VARIANTS}
    category="trend"
  />
);

export default ADXVisualizer;
