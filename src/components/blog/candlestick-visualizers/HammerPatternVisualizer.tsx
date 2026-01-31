import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const HAMMER_VARIANTS: PatternVariant[] = [
  {
    id: 'hammer',
    name: 'Hammer',
    patternKey: 'hammer',
    bias: 'bullish',
    accuracy: '70%',
    description: 'A bullish reversal pattern that forms at the bottom of a downtrend. The long lower shadow shows that sellers pushed prices down significantly, but buyers stepped in and pushed prices back up, closing near the open.',
    formation: 'A single candle with a small body at the upper end of the trading range and a long lower shadow (wick) at least 2x the body length. Little to no upper shadow. Can be green or red, but green is stronger.',
    psychology: 'During the session, bears dominated and pushed prices to significant lows. However, bulls mounted a powerful comeback, rejecting the lows and closing near the highs. This shows a potential shift from selling to buying pressure.',
    keyCharacteristics: [
      'Small body at the top of the candle',
      'Lower shadow at least 2x the body length',
      'Little or no upper shadow',
      'Must appear after a downtrend',
      'Green hammer is stronger than red',
      'Volume spike on hammer adds confirmation'
    ],
    tradingRules: {
      entry: 'Enter long on bullish confirmation candle (close above hammer high)',
      stopLoss: 'Below the low of the hammer\'s shadow',
      target: 'Previous swing high or resistance level'
    },
    bestContext: [
      'At key support levels',
      'After 3+ consecutive red candles',
      'Near round number support',
      'At oversold conditions (RSI < 30)'
    ],
    commonMistakes: [
      'Trading hammer without confirmation candle',
      'Ignoring the trend context (must be downtrend)',
      'Confusing with Hanging Man (uptrend pattern)',
      'Setting stops too close to hammer low'
    ]
  },
  {
    id: 'hanging-man',
    name: 'Hanging Man',
    patternKey: 'hanging-man',
    bias: 'bearish',
    accuracy: '59%',
    description: 'A bearish reversal pattern that forms at the top of an uptrend. Identical in shape to a hammer, but the context gives it the opposite meaning. It warns that sellers are becoming active.',
    formation: 'A single candle with a small body at the upper end of the trading range and a long lower shadow (wick) at least 2x the body length. Little to no upper shadow. Must appear after an uptrend.',
    psychology: 'Despite appearing bullish (closed near highs), the long lower shadow reveals that sellers pushed prices significantly lower during the session. Though buyers recovered, the selling pressure is a warning sign.',
    keyCharacteristics: [
      'Same shape as hammer but appears after uptrend',
      'Small body at the top of the candle',
      'Lower shadow at least 2x the body length',
      'Red hanging man is more bearish than green',
      'Requires confirmation (next candle closes lower)',
      'More reliable at resistance levels'
    ],
    tradingRules: {
      entry: 'Enter short on bearish confirmation candle (close below hanging man low)',
      stopLoss: 'Above the high of the hanging man',
      target: 'Previous swing low or support level'
    },
    bestContext: [
      'At key resistance levels',
      'After extended uptrend (5+ green candles)',
      'Near round number resistance',
      'At overbought conditions (RSI > 70)'
    ],
    commonMistakes: [
      'Trading without bearish confirmation',
      'Confusing with Hammer (downtrend pattern)',
      'Ignoring strong bullish momentum',
      'Not considering overall market trend'
    ]
  }
];

export const HammerPatternVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Hammer & Hanging Man Visual Guide"
    subtitle="Learn to identify these single-candle reversal patterns and understand when they signal opportunity vs. warning."
    variants={HAMMER_VARIANTS}
  />
);

export default HammerPatternVisualizer;
