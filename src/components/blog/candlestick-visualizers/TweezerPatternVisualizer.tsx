import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const TWEEZER_VARIANTS: PatternVariant[] = [
  {
    id: 'top',
    name: 'Tweezer Top',
    patternKey: 'tweezer-top',
    bias: 'bearish',
    accuracy: '66%',
    description: 'A two-candle bearish reversal pattern where two consecutive candles reach the same high, creating a double rejection at resistance. Named after tweezers because the matching highs resemble the tool\'s tips.',
    formation: 'Two candles with matching or near-matching highs. First candle is typically bullish, second is bearish. Both candles test the same price level but fail to break through, indicating resistance.',
    psychology: 'Bulls attempt to push prices higher but hit the same ceiling twice. This double failure at resistance shows that sellers are defending that level aggressively. When price can\'t break a level twice, it often reverses.',
    keyCharacteristics: [
      'Two candles with matching highs (within 0.1%)',
      'First candle typically bullish, second bearish',
      'Appears after an uptrend',
      'More significant at known resistance levels',
      'Volume spike on second candle adds confirmation',
      'Can combine with other patterns (harami, engulfing)'
    ],
    tradingRules: {
      entry: 'Enter short on break below the low of the second candle',
      stopLoss: 'Above the matching highs plus buffer',
      target: 'Previous swing low or 2:1 risk/reward'
    },
    bestContext: [
      'At established resistance levels',
      'Near round number resistance',
      'When RSI shows bearish divergence',
      'At Fibonacci retracement levels'
    ],
    commonMistakes: [
      'Trading tweezers in strong uptrends',
      'Ignoring that highs must match closely',
      'Not confirming with bearish follow-through',
      'Setting stops too tight at the highs'
    ]
  },
  {
    id: 'bottom',
    name: 'Tweezer Bottom',
    patternKey: 'tweezer-bottom',
    bias: 'bullish',
    accuracy: '66%',
    description: 'A two-candle bullish reversal pattern where two consecutive candles reach the same low, creating a double rejection at support. The matching lows show strong buying interest at that price level.',
    formation: 'Two candles with matching or near-matching lows. First candle is typically bearish, second is bullish. Both candles test the same price level but fail to break through, indicating support.',
    psychology: 'Bears attempt to push prices lower but hit the same floor twice. This double failure at support shows that buyers are defending that level aggressively. When price can\'t break a level twice, it often reverses.',
    keyCharacteristics: [
      'Two candles with matching lows (within 0.1%)',
      'First candle typically bearish, second bullish',
      'Appears after a downtrend',
      'More significant at known support levels',
      'Volume spike on second candle adds confirmation',
      'Can combine with other patterns (harami, engulfing)'
    ],
    tradingRules: {
      entry: 'Enter long on break above the high of the second candle',
      stopLoss: 'Below the matching lows minus buffer',
      target: 'Previous swing high or 2:1 risk/reward'
    },
    bestContext: [
      'At established support levels',
      'Near round number support',
      'When RSI shows bullish divergence',
      'At Fibonacci retracement levels'
    ],
    commonMistakes: [
      'Trading tweezers in strong downtrends',
      'Ignoring that lows must match closely',
      'Not confirming with bullish follow-through',
      'Setting stops too tight at the lows'
    ]
  }
];

export const TweezerPatternVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Tweezer Top & Bottom Visual Guide"
    subtitle="Learn these double-rejection patterns that signal when price fails to break through key levels twice."
    variants={TWEEZER_VARIANTS}
  />
);

export default TweezerPatternVisualizer;
