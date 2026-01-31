import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const STAR_VARIANTS: PatternVariant[] = [
  {
    id: 'morning',
    name: 'Morning Star',
    patternKey: 'morning-star',
    bias: 'bullish',
    accuracy: '78%',
    description: 'The Morning Star is a three-candle bullish reversal pattern that signals a major sentiment shift from bearish to bullish. Named after the planet Venus (the "morning star" that appears before sunrise), this pattern represents the darkness of a downtrend giving way to a new bullish dawn. Academically studied and confirmed across markets, the Morning Star achieves 70-82% reliability at significant support levels with volume confirmation.',
    formation: 'Three candles in sequence: (1) A large bearish candle confirming the downtrend—should have a substantial body showing strong selling. (2) A small-bodied "star" candle that gaps down from the first—represents indecision/exhaustion. (3) A large bullish candle that closes above the midpoint of the first candle\'s body (deeper penetration = stronger signal). Gaps between candles 1-2 and 2-3 strengthen the pattern.',
    psychology: 'The first candle confirms bears are in control. The gap down and small star candle reveal that selling has exhausted itself—neither bulls nor bears can gain ground, and volume often contracts. The final candle shows bulls have decisively taken control, absorbing all remaining selling and pushing price significantly higher. The deeper the third candle penetrates the first, the stronger the reversal conviction.',
    keyCharacteristics: [
      'First candle: Large bearish body (confirms downtrend continuation)',
      'Second candle: Small body that gaps down (star position)',
      'Third candle: Large bullish body closing above first candle\'s midpoint',
      'Gaps between candles increase pattern reliability significantly',
      'Star can be any color; Doji star is the strongest variant',
      'Third candle should show increasing volume (conviction)',
      'Pattern at support level adds major confluence',
      'Complete pattern takes 3 sessions—patience required'
    ],
    tradingRules: {
      entry: 'Wait for third candle to complete. Entry options: (1) At third candle close, (2) On next bar open, (3) On pullback to third candle\'s midpoint. Never enter before pattern completes—two candles is not enough.',
      stopLoss: 'Place stop below the low of the star (middle candle). This is the pattern\'s critical level. Alternative: Below entire pattern low for larger stops but higher survival rate.',
      target: 'Target 1: Previous swing high or resistance (1:1 R/R). Target 2: Measured move equal to first candle\'s length projected from breakout. Target 3: Next major resistance zone (2:1+ R/R).'
    },
    bestContext: [
      'At major horizontal support levels',
      'After significant downtrend (7+ consecutive red candles ideal)',
      'Near 200-day moving average support (major institutional level)',
      'At oversold momentum indicators (RSI <30, Stochastic <20)',
      'At Fibonacci retracement levels (61.8%, 78.6%)',
      'Following high-volume capitulation selling',
      'When sentiment indicators show extreme fear',
      'At prior market lows or crash levels'
    ],
    commonMistakes: [
      'Entering before the third candle completes (incomplete pattern)',
      'Ignoring the gap requirement (gaps add crucial validity)',
      'Trading in sideways markets without clear prior downtrend',
      'Setting stops above the star instead of below it',
      'Ignoring volume profile (third candle needs strong volume)',
      'Not verifying third candle closes above first candle\'s midpoint',
      'Confusing with regular three-candle sequences without star position',
      'Over-leveraging due to pattern\'s high accuracy reputation'
    ]
  },
  {
    id: 'evening',
    name: 'Evening Star',
    patternKey: 'evening-star',
    bias: 'bearish',
    accuracy: '72%',
    description: 'The Evening Star is a three-candle bearish reversal pattern signaling the transition from bullish euphoria to bearish control. Named after Venus appearing at dusk (the "evening star" before nightfall), this pattern marks the end of bullish "daylight." Studies indicate 68-76% reliability at resistance levels with proper confirmation. It\'s the bearish mirror of the Morning Star.',
    formation: 'Three candles in sequence: (1) A large bullish candle confirming the uptrend—substantial body showing strong buying. (2) A small-bodied "star" candle that gaps up from the first—represents exhaustion/indecision. (3) A large bearish candle that closes below the midpoint of the first candle\'s body. Gaps between candles strengthen the signal.',
    psychology: 'The first candle confirms bulls are in control with late-stage euphoria. The gap up and small star reveal that buying has exhausted—the market pauses at elevated levels. The final bearish candle shows sellers have taken control, reversing all of the first candle\'s optimism. Those who bought the gap up are now trapped, and their eventual selling adds to downside pressure.',
    keyCharacteristics: [
      'First candle: Large bullish body (confirms uptrend strength)',
      'Second candle: Small body that gaps up (star position)',
      'Third candle: Large bearish body closing below first candle\'s midpoint',
      'Gaps between candles significantly increase reliability',
      'Star can be any color; Doji star is the strongest variant',
      'Third candle should show increasing volume (distribution)',
      'Pattern at resistance level adds major confluence',
      'Watch for evening stars after parabolic/extended moves'
    ],
    tradingRules: {
      entry: 'Wait for third candle to complete. Entry options: (1) At third candle close (aggressive), (2) On break below third candle low (conservative), (3) On bounce to third candle\'s midpoint. Pattern incomplete = no trade.',
      stopLoss: 'Place stop above the high of the star (middle candle). This level represents pattern invalidation. Alternative: Above entire pattern high for larger stops.',
      target: 'Target 1: Previous swing low or support (1:1 R/R). Target 2: Measured move equal to first candle\'s length projected down. Target 3: 20/50 EMA if price is extended above.'
    },
    bestContext: [
      'At major resistance levels (horizontal, trendline, or prior highs)',
      'After significant uptrend (7+ consecutive green candles)',
      'Near 200-day moving average from above (potential resistance)',
      'At overbought momentum indicators (RSI >70, Stochastic >80)',
      'At Fibonacci extension levels (127.2%, 161.8%)',
      'Following blow-off tops or parabolic moves',
      'When sentiment indicators show extreme greed/complacency',
      'At all-time highs or major round number resistance'
    ],
    commonMistakes: [
      'Shorting before the third candle completes (patience required)',
      'Ignoring the gap requirement between candles',
      'Fighting strong bullish momentum with aggressive positioning',
      'Setting stops below the star instead of above it',
      'Ignoring that uptrends can stay overbought longer than expected',
      'Not verifying third candle closes below first candle\'s midpoint',
      'Shorting after pattern already played out (chasing)',
      'Using pattern alone without confluence confirmation'
    ]
  }
];

export const MorningEveningStarVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Morning & Evening Star Visual Guide"
    subtitle="Master these powerful three-candle reversal patterns named after Venus—the Morning Star signals bullish dawn after bearish darkness, while the Evening Star warns of bearish night approaching. Among the most reliable formations in candlestick analysis."
    variants={STAR_VARIANTS}
  />
);

export default MorningEveningStarVisualizer;
