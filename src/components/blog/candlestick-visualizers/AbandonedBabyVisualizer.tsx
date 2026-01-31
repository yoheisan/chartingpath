import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const ABANDONED_BABY_VARIANTS: PatternVariant[] = [
  {
    id: 'bullish',
    name: 'Bullish Abandoned Baby',
    patternKey: 'abandoned-baby-bullish',
    bias: 'bullish',
    accuracy: '84%',
    description: 'A rare and highly reliable three-candle bullish reversal pattern. A Doji gaps away from both surrounding candles, appearing "abandoned" like an island. This isolation signals a dramatic shift in sentiment.',
    formation: 'Three candles: (1) Large bearish candle, (2) Doji that gaps DOWN from first AND gaps UP to third (completely isolated), (3) Large bullish candle. The Doji\'s shadows don\'t touch either surrounding candle.',
    psychology: 'The first candle shows selling panic. The isolated Doji represents complete exhaustion—no one wants to trade at these levels. The gap up on the third candle shows buyers returning with conviction. The "abandoned" Doji marks the exact turning point.',
    keyCharacteristics: [
      'Middle candle must be a Doji (or near-Doji)',
      'Doji must gap down FROM first candle (no overlap)',
      'Doji must gap up TO third candle (no overlap)',
      'Doji is "abandoned"—completely isolated',
      'Very rare pattern, high reliability',
      'Third candle should be strong bullish'
    ],
    tradingRules: {
      entry: 'Enter long on close of third candle or next candle open',
      stopLoss: 'Below the low of the Doji (abandoned baby)',
      target: 'Extended target—pattern rarity warrants 3:1+ R/R'
    },
    bestContext: [
      'After capitulation selling',
      'At major support levels',
      'Following panic-driven selloffs',
      'When volume spikes on first and third candles'
    ],
    commonMistakes: [
      'Calling any Doji an "abandoned baby" (gaps must exist)',
      'Confusing with Morning Star (no gaps required there)',
      'Not verifying complete isolation of middle Doji',
      'Trading without the third bullish confirmation'
    ]
  },
  {
    id: 'bearish',
    name: 'Bearish Abandoned Baby',
    patternKey: 'abandoned-baby-bearish',
    bias: 'bearish',
    accuracy: '84%',
    description: 'A rare and highly reliable three-candle bearish reversal pattern. A Doji gaps away from both surrounding candles, appearing "abandoned" like an island. This isolation signals a dramatic shift in sentiment.',
    formation: 'Three candles: (1) Large bullish candle, (2) Doji that gaps UP from first AND gaps DOWN to third (completely isolated), (3) Large bearish candle. The Doji\'s shadows don\'t touch either surrounding candle.',
    psychology: 'The first candle shows buying euphoria. The isolated Doji represents complete exhaustion—no one wants to trade at these elevated levels. The gap down on the third candle shows sellers taking control. The "abandoned" Doji marks the exact turning point.',
    keyCharacteristics: [
      'Middle candle must be a Doji (or near-Doji)',
      'Doji must gap up FROM first candle (no overlap)',
      'Doji must gap down TO third candle (no overlap)',
      'Doji is "abandoned"—completely isolated',
      'Very rare pattern, high reliability',
      'Third candle should be strong bearish'
    ],
    tradingRules: {
      entry: 'Enter short on close of third candle or next candle open',
      stopLoss: 'Above the high of the Doji (abandoned baby)',
      target: 'Extended target—pattern rarity warrants 3:1+ R/R'
    },
    bestContext: [
      'After euphoric buying',
      'At major resistance levels',
      'Following blow-off tops',
      'When volume spikes on first and third candles'
    ],
    commonMistakes: [
      'Calling any Doji an "abandoned baby" (gaps must exist)',
      'Confusing with Evening Star (no gaps required there)',
      'Not verifying complete isolation of middle Doji',
      'Trading without the third bearish confirmation'
    ]
  }
];

export const AbandonedBabyVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Abandoned Baby Pattern Visual Guide"
    subtitle="Learn this rare but highly reliable island reversal pattern with 84% accuracy—the isolated Doji signals major sentiment shifts."
    variants={ABANDONED_BABY_VARIANTS}
  />
);

export default AbandonedBabyVisualizer;
