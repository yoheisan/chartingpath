import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const HARAMI_VARIANTS: PatternVariant[] = [
  {
    id: 'bullish',
    name: 'Bullish Harami',
    patternKey: 'bullish-harami',
    bias: 'bullish',
    accuracy: '66%',
    description: 'A two-candle bullish reversal pattern where a small candle is completely contained within the body of the previous large bearish candle. "Harami" means "pregnant" in Japanese, describing how the second candle sits inside the first.',
    formation: 'First, a large bearish (red) candle forms during a downtrend. Then, a small candle (of either color) forms that is completely contained within the body of the previous candle.',
    psychology: 'The large bearish candle shows strong selling. The small following candle indicates that selling momentum has stalled—neither buyers nor sellers are in control. This indecision after selling exhaustion often precedes a reversal.',
    keyCharacteristics: [
      'Second candle body entirely within first candle body',
      'First candle must be a large bearish candle',
      'Second candle can be any color (green is stronger)',
      'Smaller second candle = stronger signal',
      'Must appear after a downtrend',
      'Volume typically decreases on second candle'
    ],
    tradingRules: {
      entry: 'Enter long on bullish confirmation candle above harami high',
      stopLoss: 'Below the low of the first (large) candle',
      target: 'Previous swing high or resistance level'
    },
    bestContext: [
      'At established support levels',
      'After extended downtrends',
      'Near moving average support',
      'When RSI shows bullish divergence'
    ],
    commonMistakes: [
      'Trading harami without confirmation',
      'Not verifying prior downtrend exists',
      'Ignoring volume analysis',
      'Confusing with inside bar (not same thing)'
    ]
  },
  {
    id: 'bearish',
    name: 'Bearish Harami',
    patternKey: 'bearish-harami',
    bias: 'bearish',
    accuracy: '66%',
    description: 'A two-candle bearish reversal pattern where a small candle is completely contained within the body of the previous large bullish candle. Signals potential weakness in an uptrend.',
    formation: 'First, a large bullish (green) candle forms during an uptrend. Then, a small candle (of either color) forms that is completely contained within the body of the previous candle.',
    psychology: 'The large bullish candle shows strong buying. The small following candle indicates that buying momentum has stalled—indecision has crept in. This hesitation after a strong move often signals exhaustion.',
    keyCharacteristics: [
      'Second candle body entirely within first candle body',
      'First candle must be a large bullish candle',
      'Second candle can be any color (red is stronger)',
      'Smaller second candle = stronger signal',
      'Must appear after an uptrend',
      'Volume typically decreases on second candle'
    ],
    tradingRules: {
      entry: 'Enter short on bearish confirmation candle below harami low',
      stopLoss: 'Above the high of the first (large) candle',
      target: 'Previous swing low or support level'
    },
    bestContext: [
      'At established resistance levels',
      'After extended uptrends',
      'Near moving average resistance',
      'When RSI shows bearish divergence'
    ],
    commonMistakes: [
      'Shorting without bearish confirmation',
      'Not verifying prior uptrend exists',
      'Trading against strong momentum',
      'Ignoring larger timeframe trend'
    ]
  }
];

export const HaramiPatternVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Harami Pattern Visual Guide"
    subtitle="Learn to identify these 'inside bar' reversal patterns that signal momentum exhaustion and potential trend changes."
    variants={HARAMI_VARIANTS}
  />
);

export default HaramiPatternVisualizer;
