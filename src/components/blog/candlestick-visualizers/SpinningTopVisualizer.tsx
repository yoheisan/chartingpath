import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const SPINNING_TOP_VARIANTS: PatternVariant[] = [
  {
    id: 'spinning-top',
    name: 'Spinning Top',
    patternKey: 'spinning-top',
    bias: 'neutral',
    accuracy: '62%',
    description: 'A single-candle indecision pattern with a small body and long shadows on both sides. Unlike the Doji where open and close are equal, the Spinning Top has a small but visible body. It signals market uncertainty.',
    formation: 'A single candle with: small body (open and close close together but not equal), long upper shadow, long lower shadow. The shadows should be at least 2x the body length. Can be green or red.',
    psychology: 'During the session, both bulls and bears had their moments of control, pushing prices up and down significantly. However, by the close, neither side had won decisively. This tug-of-war often precedes trend changes.',
    keyCharacteristics: [
      'Small body relative to the shadows',
      'Long upper and lower shadows (2x+ body)',
      'Can be either green (bullish) or red (bearish)',
      'Body slightly larger than a Doji',
      'Shows indecision, not commitment',
      'More meaningful after extended trends'
    ],
    tradingRules: {
      entry: 'Wait for confirmation candle in either direction',
      stopLoss: 'Beyond the opposite side of the spinning top',
      target: 'Previous swing high/low based on breakout direction'
    },
    bestContext: [
      'After extended trends (potential reversal)',
      'At key support/resistance levels',
      'Before major news or events',
      'When combined with other technical signals'
    ],
    commonMistakes: [
      'Trading spinning tops without confirmation',
      'Confusing with strong trend candles',
      'Ignoring the context (trend, levels)',
      'Over-trading neutral patterns'
    ]
  }
];

export const SpinningTopVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Spinning Top Pattern Visual Guide"
    subtitle="Understand this neutral indecision pattern that signals market uncertainty and potential trend changes."
    variants={SPINNING_TOP_VARIANTS}
  />
);

export default SpinningTopVisualizer;
