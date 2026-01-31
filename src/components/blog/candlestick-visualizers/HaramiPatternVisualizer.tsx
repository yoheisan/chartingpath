import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const HARAMI_VARIANTS: PatternVariant[] = [
  {
    id: 'bullish',
    name: 'Bullish Harami',
    patternKey: 'bullish-harami',
    bias: 'bullish',
    accuracy: '66%',
    description: 'The Bullish Harami is a two-candle reversal pattern where a small candle is completely contained within the body of the previous large bearish candle. "Harami" is Japanese for "pregnant"—describing how the second candle sits inside the first like a baby in a womb. This pattern signals that selling momentum has stalled and a potential reversal is developing. Studies show 60-72% reliability at support levels with confirmation.',
    formation: 'Two candles: (1) A large bearish candle during a downtrend—substantial body confirming selling pressure. (2) A small candle whose entire body is contained within the previous candle\'s body. The second candle can be any color, though green is more bullish. Shadows may extend beyond the first body—only the real body containment matters.',
    psychology: 'The large bearish candle shows strong selling continuing the downtrend. The small following candle indicates that momentum has stalled—sellers couldn\'t push prices significantly lower, and buyers are starting to appear. This indecision after selling exhaustion often precedes a reversal. The smaller the second candle (approaching a doji), the stronger the indecision signal.',
    keyCharacteristics: [
      'Second candle body entirely within first candle body',
      'First candle must be a large bearish candle (confirms trend)',
      'Second candle can be any color (green is stronger signal)',
      'Smaller second candle = stronger reversal signal (doji ideal)',
      'Must appear after established downtrend (3+ red candles)',
      'Volume typically decreases on second candle (momentum loss)',
      'Shadows may extend beyond first body (body matters)',
      'Similar to but distinct from inside bar pattern'
    ],
    tradingRules: {
      entry: 'Wait for bullish confirmation candle that closes above harami high (third candle). Entry: At confirmation candle close or break above harami high. Never enter on harami alone—confirmation is essential.',
      stopLoss: 'Place stop below the low of the first (large) candle. This level represents the low of the pattern formation. Tighter alternative: Below the second candle low.',
      target: 'Target 1: Previous swing high or nearest resistance. Target 2: 50% retracement of prior downtrend. Use 1.5:1 minimum R/R due to lower pattern accuracy.'
    },
    bestContext: [
      'At established horizontal support levels',
      'After extended downtrends showing exhaustion',
      'Near major moving average support (20/50/200 EMA)',
      'When RSI shows bullish divergence forming',
      'At Fibonacci retracement levels (61.8%, 78.6%)',
      'When second candle is a doji (harami cross)',
      'At prior significant low points',
      'When volume contracts on second candle (indecision)'
    ],
    commonMistakes: [
      'Trading harami without waiting for confirmation candle',
      'Not verifying a prior downtrend exists (context required)',
      'Ignoring volume analysis (confirmation needs volume)',
      'Confusing with inside bar (inside bar includes shadows)',
      'Expecting immediate reversal (pattern shows pause, not reversal)',
      'Ignoring that harami is lower probability than engulfing',
      'Not adjusting position size for lower accuracy rate',
      'Using harami in ranging/sideways markets (needs trend)'
    ]
  },
  {
    id: 'bearish',
    name: 'Bearish Harami',
    patternKey: 'bearish-harami',
    bias: 'bearish',
    accuracy: '66%',
    description: 'The Bearish Harami is a two-candle bearish reversal pattern where a small candle is contained within the body of the previous large bullish candle. Like its bullish counterpart, "harami" refers to pregnancy—the small candle gestating within the larger one. This pattern signals that buying momentum has stalled at the top of an uptrend, potentially leading to reversal.',
    formation: 'Two candles: (1) A large bullish candle during an uptrend—substantial body confirming buying pressure. (2) A small candle whose entire body is contained within the previous candle\'s body. The second candle can be any color, though red is more bearish. Only body containment matters; shadows may extend beyond.',
    psychology: 'The large bullish candle shows strong buying continuing the uptrend. The small following candle indicates that momentum has stalled—buyers couldn\'t push prices significantly higher. This indecision after buying exhaustion often signals distribution beginning. The pattern suggests smart money may be selling into strength while retail continues buying.',
    keyCharacteristics: [
      'Second candle body entirely within first candle body',
      'First candle must be a large bullish candle (confirms trend)',
      'Second candle can be any color (red is stronger signal)',
      'Smaller second candle = stronger reversal potential',
      'Must appear after established uptrend (3+ green candles)',
      'Volume typically decreases on second candle (momentum loss)',
      'Watch for harami at resistance levels (confluence)',
      'Harami cross (second is doji) is strongest variant'
    ],
    tradingRules: {
      entry: 'Wait for bearish confirmation candle that closes below harami low. Entry: At confirmation candle close or break below harami low. Pattern requires confirmation—never short harami alone.',
      stopLoss: 'Place stop above the high of the first (large) candle. This is the pattern\'s ceiling. Tighter alternative: Above second candle high if clearly lower.',
      target: 'Target 1: Previous swing low or nearest support. Target 2: 50% retracement of prior uptrend. Risk management critical due to moderate accuracy.'
    },
    bestContext: [
      'At established resistance levels',
      'After extended uptrends showing exhaustion',
      'Near moving average resistance (price extended above MAs)',
      'When RSI shows bearish divergence',
      'At Fibonacci extension levels (127.2%, 161.8%)',
      'When second candle is a doji (harami cross = stronger)',
      'At prior significant high points',
      'Following parabolic or blow-off moves'
    ],
    commonMistakes: [
      'Shorting without bearish confirmation candle',
      'Not verifying prior uptrend exists (needs context)',
      'Trading against strong momentum without patience',
      'Ignoring larger timeframe trend direction',
      'Expecting immediate reversal (harami is hesitation)',
      'Using pattern in isolation without other indicators',
      'Aggressive positioning on moderate-accuracy pattern',
      'Confusing consolidation harami with reversal harami'
    ]
  }
];

export const HaramiPatternVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Harami Pattern Visual Guide"
    subtitle="Learn these 'pregnant' reversal patterns where a small candle is contained within a larger one—signaling momentum exhaustion and potential trend changes. The Japanese name 'harami' means pregnant, describing the visual relationship between the candles."
    variants={HARAMI_VARIANTS}
  />
);

export default HaramiPatternVisualizer;
