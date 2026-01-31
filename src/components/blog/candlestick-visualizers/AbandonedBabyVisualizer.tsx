import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const ABANDONED_BABY_VARIANTS: PatternVariant[] = [
  {
    id: 'bullish',
    name: 'Bullish Abandoned Baby',
    patternKey: 'abandoned-baby-bullish',
    bias: 'bullish',
    accuracy: '84%',
    description: 'The Bullish Abandoned Baby is a rare and highly reliable three-candle reversal pattern. A Doji gaps away from both surrounding candles, appearing "abandoned" like an island—completely isolated by gaps on both sides. This isolation signals a dramatic and complete shift in market sentiment from bearish panic to bullish recovery. Studies show 80-88% reliability, placing it among the most dependable reversal signals when properly identified.',
    formation: 'Three candles in specific formation: (1) A large bearish candle continuing the downtrend. (2) A Doji or near-Doji that gaps DOWN from the first candle (no overlap—complete gap). (3) A large bullish candle that gaps UP from the Doji (no overlap). The Doji must be completely isolated—its shadows cannot touch either surrounding candle\'s body.',
    psychology: 'The first candle shows selling panic reaching a climax. The isolated Doji represents complete exhaustion—the market gaps down to capitulation levels where neither buyers nor sellers want to transact. Then sentiment completely reverses: the gap up on the third candle shows buyers returning with conviction, leaving the Doji "abandoned" between the two gaps like an island marking the exact turning point.',
    keyCharacteristics: [
      'Middle candle must be a Doji (or near-Doji with tiny body)',
      'Doji must gap DOWN from first candle (no shadow overlap)',
      'Doji must gap UP to third candle (no shadow overlap)',
      'Doji is completely isolated—"abandoned" between gaps',
      'Very rare pattern—high reliability when found',
      'Third candle should be strong bullish (closes high)',
      'Pattern marks the exact bottom of a decline',
      'Often appears after capitulation selling'
    ],
    tradingRules: {
      entry: 'Enter long on close of third candle or next candle open. Given pattern\'s rarity and high reliability, aggressive entry is justified. Alternative: Enter on pullback to third candle\'s midpoint.',
      stopLoss: 'Below the low of the Doji (the "abandoned baby"). This is the capitulation point. If price returns to the island, the reversal has failed.',
      target: 'Extended targets warranted—pattern\'s rarity justifies 3:1+ R/R. Target prior significant resistance levels. Trail stops as position advances.'
    },
    bestContext: [
      'After capitulation selling with volume spike',
      'At major support levels (horizontal, Fibonacci)',
      'Following panic-driven selloffs (VIX elevated)',
      'When volume spikes on first and third candles',
      'At multi-month or multi-year lows',
      'After exhaustion gap down on first candle',
      'When sentiment indicators show extreme fear',
      'During sector or market-wide capitulation'
    ],
    commonMistakes: [
      'Calling any Doji an "abandoned baby" (gaps MUST exist)',
      'Confusing with Morning Star (Morning Star doesn\'t require gaps)',
      'Not verifying complete isolation of middle Doji',
      'Trading without the third bullish confirmation candle',
      'Seeing the pattern when gaps are marginal (need clear gaps)',
      'Expecting the pattern frequently (very rare)',
      'Not sizing appropriately for high-conviction rare setup',
      'Ignoring volume profile (confirmation helps)'
    ]
  },
  {
    id: 'bearish',
    name: 'Bearish Abandoned Baby',
    patternKey: 'abandoned-baby-bearish',
    bias: 'bearish',
    accuracy: '84%',
    description: 'The Bearish Abandoned Baby is the mirror image—a rare three-candle pattern marking exact tops. A Doji gaps away from both surrounding candles, isolated like an island at the peak of euphoria. This pattern signals the exhaustion of buying pressure and the beginning of distribution. At 80-88% reliability, it\'s one of the most dependable topping signals when properly identified.',
    formation: 'Three candles: (1) A large bullish candle continuing the uptrend. (2) A Doji that gaps UP from the first candle (no overlap). (3) A large bearish candle that gaps DOWN from the Doji (no overlap). The Doji must be completely isolated—its shadows cannot touch either surrounding candle\'s body.',
    psychology: 'The first candle shows buying euphoria reaching a climax. The isolated Doji represents exhaustion at the peak—buyers gap up but can\'t continue, creating indecision at elevated levels. Then sentiment completely reverses: the gap down on the third candle shows sellers taking control, leaving the Doji "abandoned" at the exact top—an island marking the turning point.',
    keyCharacteristics: [
      'Middle candle must be a Doji (or near-Doji)',
      'Doji must gap UP from first candle (no shadow overlap)',
      'Doji must gap DOWN to third candle (no shadow overlap)',
      'Doji is completely isolated—"abandoned" at the peak',
      'Very rare pattern—high reliability when found',
      'Third candle should be strong bearish (closes low)',
      'Pattern marks the exact top of an advance',
      'Often appears after blow-off top or euphoria'
    ],
    tradingRules: {
      entry: 'Enter short on close of third candle or next candle open. High reliability justifies aggressive entry. Alternative: Enter on bounce to third candle\'s midpoint.',
      stopLoss: 'Above the high of the Doji (the "abandoned baby"). This is the euphoria point. If price returns to the island, the reversal has failed.',
      target: 'Extended targets warranted—3:1+ R/R given pattern rarity. Target prior significant support levels. Trail stops as position moves favorably.'
    },
    bestContext: [
      'After euphoric buying with volume spike',
      'At major resistance levels (horizontal, Fibonacci extension)',
      'Following blow-off tops or parabolic moves',
      'When volume spikes on first and third candles',
      'At all-time highs or multi-year peaks',
      'After exhaustion gap up on first candle',
      'When sentiment indicators show extreme greed/complacency',
      'Following extended uptrends (10+ green candles)'
    ],
    commonMistakes: [
      'Calling any Doji an "abandoned baby" (gaps required)',
      'Confusing with Evening Star (no gaps required)',
      'Not verifying complete isolation of Doji',
      'Trading without the third bearish confirmation',
      'Seeing pattern when gaps are marginal',
      'Expecting the pattern frequently (very rare)',
      'Fighting strong uptrend without clear gaps',
      'Not respecting the pattern\'s high reliability'
    ]
  }
];

export const AbandonedBabyVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Abandoned Baby Pattern Visual Guide"
    subtitle="Learn this rare but highly reliable island reversal pattern with 84%+ accuracy. The isolated Doji—abandoned between gaps—marks exact turning points. Note: True abandoned babies require complete gaps on both sides of the Doji."
    variants={ABANDONED_BABY_VARIANTS}
  />
);

export default AbandonedBabyVisualizer;
