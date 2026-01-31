import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const TWEEZER_VARIANTS: PatternVariant[] = [
  {
    id: 'top',
    name: 'Tweezer Top',
    patternKey: 'tweezer-top',
    bias: 'bearish',
    accuracy: '66%',
    description: 'The Tweezer Top is a two-candle bearish reversal pattern where consecutive candles reach the same high, creating a double rejection at resistance. Named because the matching highs resemble the tips of tweezers, this pattern shows that sellers are defending a specific price level aggressively. When price fails to break through twice, it often reverses. Studies show 62-70% reliability at established resistance with volume confirmation.',
    formation: 'Two consecutive candles with matching or near-matching highs (within 0.1-0.2% of each other). The first candle is typically bullish, showing the initial attempt to break higher. The second candle is typically bearish, showing the rejection. Both test the same ceiling and fail, creating the tweezer formation.',
    psychology: 'Bulls attempt to push prices higher but hit a ceiling. The first failure might be dismissed, but when the second candle also fails at the exact same level, it confirms that significant supply (selling pressure) exists at that price. Sellers are defending that level aggressively. This double failure often triggers stops and leads to reversal.',
    keyCharacteristics: [
      'Two candles with matching highs (within 0.1-0.2%)',
      'First candle typically bullish, second typically bearish',
      'Must appear after an uptrend (reversal context)',
      'More significant at known resistance levels',
      'Volume spike on second candle adds confirmation',
      'Can combine with other patterns (harami, engulfing)',
      'The more precise the matching highs, the stronger the signal',
      'Often marks the exact top of a move'
    ],
    tradingRules: {
      entry: 'Enter short on break below the low of the second candle. Alternative: Wait for third candle confirmation closing below tweezer lows. Filter: Require resistance level context.',
      stopLoss: 'Place stop above the matching highs plus a buffer for volatility. This is the double-rejection level—if exceeded, the pattern has failed.',
      target: 'Target 1: Previous swing low or nearest support (1:1 R/R). Target 2: 2:1 risk/reward. Target 3: Prior significant support zone.'
    },
    bestContext: [
      'At established horizontal resistance levels',
      'Near round number resistance ($100, $150, etc.)',
      'When RSI shows bearish divergence',
      'At Fibonacci retracement/extension levels',
      'Following extended uptrends',
      'When volume spikes on the rejection candle',
      'At prior significant highs',
      'Near major moving average resistance'
    ],
    commonMistakes: [
      'Trading tweezers in strong uptrends (may break through)',
      'Ignoring that highs must match closely (not "near")',
      'Not confirming with bearish follow-through',
      'Setting stops too tight at the highs (need buffer)',
      'Expecting immediate reversal (may consolidate first)',
      'Ignoring volume profile (rejection needs volume)',
      'Trading tweezers in sideways markets (no trend context)',
      'Confusing double top pattern with tweezer top'
    ]
  },
  {
    id: 'bottom',
    name: 'Tweezer Bottom',
    patternKey: 'tweezer-bottom',
    bias: 'bullish',
    accuracy: '66%',
    description: 'The Tweezer Bottom is a two-candle bullish reversal pattern where consecutive candles reach the same low, creating a double rejection at support. The matching lows show that buyers are defending a specific price level aggressively. When sellers fail to break through twice, it often triggers a reversal. This pattern identifies potential bottoms with precision.',
    formation: 'Two consecutive candles with matching or near-matching lows (within 0.1-0.2% of each other). The first candle is typically bearish, showing the selling attempt. The second candle is typically bullish, showing the rejection of lower prices. Both test the same floor and hold.',
    psychology: 'Bears attempt to push prices lower but hit a floor. The first attempt might seem like normal selling, but when the second candle also bounces from the exact same level, it confirms significant demand (buying pressure) at that price. Buyers are defending aggressively. This double bounce often marks the end of selling pressure.',
    keyCharacteristics: [
      'Two candles with matching lows (within 0.1-0.2%)',
      'First candle typically bearish, second typically bullish',
      'Must appear after a downtrend (reversal context)',
      'More significant at known support levels',
      'Volume spike on second candle adds confirmation',
      'Can combine with other patterns (harami, engulfing)',
      'The more precise the matching lows, the stronger the signal',
      'Often marks the exact bottom of a move'
    ],
    tradingRules: {
      entry: 'Enter long on break above the high of the second candle. Alternative: Wait for third candle confirmation closing above tweezer highs. Filter: Require support level context.',
      stopLoss: 'Place stop below the matching lows minus a buffer for volatility. This is the double-support level—if broken, the pattern has failed.',
      target: 'Target 1: Previous swing high or nearest resistance (1:1 R/R). Target 2: 2:1 risk/reward. Target 3: Moving average above.'
    },
    bestContext: [
      'At established horizontal support levels',
      'Near round number support ($100, $50, etc.)',
      'When RSI shows bullish divergence',
      'At Fibonacci retracement levels (61.8%, 78.6%)',
      'Following extended downtrends',
      'When volume spikes on the rejection candle',
      'At prior significant lows',
      'Near major moving average support'
    ],
    commonMistakes: [
      'Trading tweezers in strong downtrends (may break down)',
      'Ignoring that lows must match closely (precision matters)',
      'Not confirming with bullish follow-through',
      'Setting stops too tight at the lows (need buffer)',
      'Expecting immediate reversal (may consolidate)',
      'Ignoring volume profile (support needs buying volume)',
      'Trading tweezers without trend context',
      'Confusing double bottom pattern with tweezer bottom'
    ]
  }
];

export const TweezerPatternVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Tweezer Top & Bottom Visual Guide"
    subtitle="Master these double-rejection patterns where price fails to break through a level twice. Named for the matching highs/lows that resemble tweezer tips, these patterns pinpoint potential reversal zones with precision."
    variants={TWEEZER_VARIANTS}
  />
);

export default TweezerPatternVisualizer;
