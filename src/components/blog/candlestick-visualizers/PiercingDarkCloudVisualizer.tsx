import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const PIERCING_DARK_CLOUD_VARIANTS: PatternVariant[] = [
  {
    id: 'piercing',
    name: 'Piercing Line',
    patternKey: 'piercing-line',
    bias: 'bullish',
    accuracy: '64%',
    description: 'A two-candle bullish reversal pattern that forms after a downtrend. The second candle opens below the first\'s low but rallies to close above its midpoint, "piercing" through the bearish candle.',
    formation: 'First, a bearish candle confirms the downtrend. Then, a bullish candle opens below the first candle\'s low (gap down) but closes above the midpoint (50%+) of the first candle\'s body.',
    psychology: 'The gap down open triggers panic selling, but buyers absorb all selling and push prices significantly higher. The deeper the penetration into the first candle, the more significant the buying pressure.',
    keyCharacteristics: [
      'First candle is a long bearish candle',
      'Second candle gaps down below first\'s low',
      'Second candle closes above 50% of first candle\'s body',
      'Deeper penetration (60%+) = stronger signal',
      'Must appear after established downtrend',
      'Similar to but weaker than Bullish Engulfing'
    ],
    tradingRules: {
      entry: 'Enter long on confirmation above piercing candle high',
      stopLoss: 'Below the low of the pattern (second candle low)',
      target: 'Previous swing high or resistance level'
    },
    bestContext: [
      'At key support levels',
      'After 3+ consecutive red candles',
      'When second candle has high volume',
      'Near oversold RSI levels'
    ],
    commonMistakes: [
      'Trading when close is below 50% mark',
      'Ignoring prior downtrend requirement',
      'Not waiting for confirmation candle',
      'Confusing with weak inside bar patterns'
    ]
  },
  {
    id: 'dark-cloud',
    name: 'Dark Cloud Cover',
    patternKey: 'dark-cloud-cover',
    bias: 'bearish',
    accuracy: '60%',
    description: 'A two-candle bearish reversal pattern that forms after an uptrend. The second candle opens above the first\'s high but sells off to close below its midpoint, casting a "dark cloud" over the bullish candle.',
    formation: 'First, a bullish candle confirms the uptrend. Then, a bearish candle opens above the first candle\'s high (gap up) but closes below the midpoint (50%+) of the first candle\'s body.',
    psychology: 'The gap up open attracts late buyers, but sellers overwhelm them and push prices significantly lower. The deeper the penetration into the first candle, the more significant the selling pressure.',
    keyCharacteristics: [
      'First candle is a long bullish candle',
      'Second candle gaps up above first\'s high',
      'Second candle closes below 50% of first candle\'s body',
      'Deeper penetration (60%+) = stronger signal',
      'Must appear after established uptrend',
      'Similar to but weaker than Bearish Engulfing'
    ],
    tradingRules: {
      entry: 'Enter short on confirmation below dark cloud candle low',
      stopLoss: 'Above the high of the pattern (second candle high)',
      target: 'Previous swing low or support level'
    },
    bestContext: [
      'At key resistance levels',
      'After 3+ consecutive green candles',
      'When second candle has high volume',
      'Near overbought RSI levels'
    ],
    commonMistakes: [
      'Shorting when close is above 50% mark',
      'Ignoring prior uptrend requirement',
      'Not waiting for confirmation candle',
      'Trading against strong momentum'
    ]
  }
];

export const PiercingLineVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Piercing Line Pattern Guide"
    subtitle="Learn this bullish reversal pattern that shows buyers absorbing selling pressure and pushing prices higher."
    variants={[PIERCING_DARK_CLOUD_VARIANTS[0]]}
  />
);

export const DarkCloudCoverVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Dark Cloud Cover Pattern Guide"
    subtitle="Master this bearish reversal pattern that signals sellers overwhelming buyers at market tops."
    variants={[PIERCING_DARK_CLOUD_VARIANTS[1]]}
  />
);

export default PiercingLineVisualizer;
