import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const STAR_VARIANTS: PatternVariant[] = [
  {
    id: 'morning',
    name: 'Morning Star',
    patternKey: 'morning-star',
    bias: 'bullish',
    accuracy: '78%',
    description: 'A powerful three-candle bullish reversal pattern that marks the transition from bearish to bullish sentiment. Named because it appears before the "sunrise" of a new uptrend, like the morning star (Venus) before dawn.',
    formation: 'Three candles: (1) A large bearish candle continuing the downtrend, (2) A small-bodied candle (the "star") that gaps down, showing indecision, (3) A large bullish candle that closes above the midpoint of the first candle.',
    psychology: 'The first candle confirms bearish control. The star shows sellers are exhausted and buyers entering. The third candle proves buyers have taken control, completing the sentiment reversal from fear to greed.',
    keyCharacteristics: [
      'First candle: Large bearish, confirms downtrend',
      'Second candle: Small body, gaps down from first',
      'Third candle: Large bullish, closes above first\'s midpoint',
      'Gaps between candles strengthen the pattern',
      'Star can be a doji for even stronger signal',
      'Volume increases on third candle'
    ],
    tradingRules: {
      entry: 'Enter long on close of third candle or next candle open',
      stopLoss: 'Below the low of the star (middle candle)',
      target: 'Previous resistance or 2:1 risk/reward'
    },
    bestContext: [
      'At major support levels',
      'After significant downtrend (7+ candles)',
      'Near 200-day moving average support',
      'With oversold momentum indicators'
    ],
    commonMistakes: [
      'Not waiting for the third candle to complete',
      'Ignoring the gap requirement between candles',
      'Trading in sideways markets without clear downtrend',
      'Setting stops above the star instead of below it'
    ]
  },
  {
    id: 'evening',
    name: 'Evening Star',
    patternKey: 'evening-star',
    bias: 'bearish',
    accuracy: '72%',
    description: 'A powerful three-candle bearish reversal pattern that marks the transition from bullish to bearish sentiment. Named because it appears before the "sunset" of an uptrend, like the evening star (Venus) at dusk.',
    formation: 'Three candles: (1) A large bullish candle continuing the uptrend, (2) A small-bodied candle (the "star") that gaps up, showing indecision, (3) A large bearish candle that closes below the midpoint of the first candle.',
    psychology: 'The first candle confirms bullish control. The star shows buyers are exhausted and sellers entering. The third candle proves sellers have taken control, completing the sentiment reversal from greed to fear.',
    keyCharacteristics: [
      'First candle: Large bullish, confirms uptrend',
      'Second candle: Small body, gaps up from first',
      'Third candle: Large bearish, closes below first\'s midpoint',
      'Gaps between candles strengthen the pattern',
      'Star can be a doji for even stronger signal',
      'Volume increases on third candle'
    ],
    tradingRules: {
      entry: 'Enter short on close of third candle or next candle open',
      stopLoss: 'Above the high of the star (middle candle)',
      target: 'Previous support or 2:1 risk/reward'
    },
    bestContext: [
      'At major resistance levels',
      'After significant uptrend (7+ candles)',
      'Near 200-day moving average resistance',
      'With overbought momentum indicators'
    ],
    commonMistakes: [
      'Not waiting for the third candle to complete',
      'Ignoring the gap requirement between candles',
      'Shorting against strong bullish momentum',
      'Setting stops below the star instead of above it'
    ]
  }
];

export const MorningEveningStarVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Morning & Evening Star Visual Guide"
    subtitle="Master these powerful three-candle reversal patterns that signal major turning points in market sentiment."
    variants={STAR_VARIANTS}
  />
);

export default MorningEveningStarVisualizer;
