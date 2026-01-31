import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const ENGULFING_VARIANTS: PatternVariant[] = [
  {
    id: 'bullish',
    name: 'Bullish Engulfing',
    patternKey: 'bullish-engulfing',
    bias: 'bullish',
    accuracy: '75%',
    description: 'A powerful two-candle bullish reversal pattern where a large green candle completely engulfs the body of the previous red candle. One of the most reliable reversal signals in candlestick analysis.',
    formation: 'First, a bearish (red) candle forms during a downtrend. Then, a much larger bullish (green) candle opens below the previous close and closes above the previous open, completely engulfing the prior body.',
    psychology: 'The first candle shows continued selling pressure. The second candle reveals a dramatic shift: buyers overwhelmed sellers so completely that they erased all losses and pushed prices higher. This psychological shift often marks the end of a downtrend.',
    keyCharacteristics: [
      'Must appear after a downtrend (at least 3-5 red candles)',
      'Second candle body fully engulfs first candle body',
      'Wicks don\'t need to be engulfed, only the body',
      'Higher volume on the engulfing candle adds confirmation',
      'Larger the engulfing candle, stronger the signal',
      'Most effective at key support levels'
    ],
    tradingRules: {
      entry: 'Enter on close of engulfing candle or on next candle open',
      stopLoss: 'Below the low of the engulfing pattern',
      target: 'Previous swing high or 2:1 risk/reward minimum'
    },
    bestContext: [
      'At established support levels',
      'After extended downtrends (5+ candles)',
      'Near moving average support (20/50/200 EMA)',
      'At oversold RSI levels (<30)'
    ],
    commonMistakes: [
      'Trading engulfing patterns in sideways markets',
      'Ignoring the prior trend requirement',
      'Setting stops too tight (must be below pattern low)',
      'Not waiting for candle close confirmation'
    ]
  },
  {
    id: 'bearish',
    name: 'Bearish Engulfing',
    patternKey: 'bearish-engulfing',
    bias: 'bearish',
    accuracy: '72%',
    description: 'A powerful two-candle bearish reversal pattern where a large red candle completely engulfs the body of the previous green candle. Signals potential trend reversal from bullish to bearish.',
    formation: 'First, a bullish (green) candle forms during an uptrend. Then, a much larger bearish (red) candle opens above the previous close and closes below the previous open, completely engulfing the prior body.',
    psychology: 'The first candle shows continued buying pressure. The second candle reveals sellers taking complete control, erasing all gains and pushing prices lower. This dramatic shift often signals the beginning of a downtrend.',
    keyCharacteristics: [
      'Must appear after an uptrend (at least 3-5 green candles)',
      'Second candle body fully engulfs first candle body',
      'Wicks don\'t need to be engulfed, only the body',
      'Higher volume on the engulfing candle adds confirmation',
      'Larger the engulfing candle, stronger the signal',
      'Most effective at key resistance levels'
    ],
    tradingRules: {
      entry: 'Enter short on close of engulfing candle or next candle open',
      stopLoss: 'Above the high of the engulfing pattern',
      target: 'Previous swing low or 2:1 risk/reward minimum'
    },
    bestContext: [
      'At established resistance levels',
      'After extended uptrends (5+ candles)',
      'Near moving average resistance',
      'At overbought RSI levels (>70)'
    ],
    commonMistakes: [
      'Shorting engulfing patterns in strong uptrends',
      'Ignoring the prior trend requirement',
      'Setting stops too tight (must be above pattern high)',
      'Trading against major trend direction'
    ]
  }
];

export const EngulfingPatternVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Engulfing Pattern Visual Guide"
    subtitle="Master the powerful two-candle reversal signals that can mark major turning points in the market."
    variants={ENGULFING_VARIANTS}
  />
);

export default EngulfingPatternVisualizer;
