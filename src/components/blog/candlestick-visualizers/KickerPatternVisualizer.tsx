import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const KICKER_VARIANTS: PatternVariant[] = [
  {
    id: 'bullish',
    name: 'Bullish Kicker',
    patternKey: 'kicker-bullish',
    bias: 'bullish',
    accuracy: '87%',
    description: 'One of the most powerful and reliable candlestick reversal patterns. A bearish candle is followed by a bullish candle that gaps above the previous candle\'s open, completely negating the prior selling pressure.',
    formation: 'First candle is bearish. Second candle opens with a gap up ABOVE the first candle\'s open (not just above the close) and closes strongly bullish. The gap between opens is the "kick."',
    psychology: 'Something dramatic changed overnight or during a gap period. The gap above the previous open shows that buyers are so confident they\'re willing to pay significantly more than where sellers started. This often follows major news or sentiment shifts.',
    keyCharacteristics: [
      'Gap up opens ABOVE the prior candle\'s OPEN',
      'Not just above the close—must clear the open',
      'Both candles have substantial bodies',
      'The gap should not be filled intraday',
      'Often follows major news or catalyst',
      'One of highest accuracy patterns (87%)'
    ],
    tradingRules: {
      entry: 'Enter long immediately on pattern recognition or pullback',
      stopLoss: 'Below the gap (below second candle\'s open)',
      target: 'Extended targets due to high reliability—3:1 or higher R/R'
    },
    bestContext: [
      'After unexpected positive news or earnings',
      'Following market-moving announcements',
      'When sentiment shifts dramatically overnight',
      'At major inflection points'
    ],
    commonMistakes: [
      'Confusing with regular gap up (must clear previous open)',
      'Trading false kickers where gap fills quickly',
      'Not sizing position appropriately for high-conviction pattern',
      'Ignoring if pattern appears in choppy/ranging market'
    ]
  },
  {
    id: 'bearish',
    name: 'Bearish Kicker',
    patternKey: 'kicker-bearish',
    bias: 'bearish',
    accuracy: '87%',
    description: 'One of the most powerful and reliable candlestick reversal patterns. A bullish candle is followed by a bearish candle that gaps below the previous candle\'s open, completely negating the prior buying pressure.',
    formation: 'First candle is bullish. Second candle opens with a gap down BELOW the first candle\'s open (not just below the close) and closes strongly bearish. The gap between opens is the "kick."',
    psychology: 'Something dramatic changed overnight or during a gap period. The gap below the previous open shows that sellers are so panicked they\'re willing to sell at significantly less than where buyers started. This often follows major negative news.',
    keyCharacteristics: [
      'Gap down opens BELOW the prior candle\'s OPEN',
      'Not just below the close—must clear the open',
      'Both candles have substantial bodies',
      'The gap should not be filled intraday',
      'Often follows major negative news or catalyst',
      'One of highest accuracy patterns (87%)'
    ],
    tradingRules: {
      entry: 'Enter short immediately on pattern recognition or bounce',
      stopLoss: 'Above the gap (above second candle\'s open)',
      target: 'Extended targets due to high reliability—3:1 or higher R/R'
    },
    bestContext: [
      'After unexpected negative news or earnings miss',
      'Following market-moving negative announcements',
      'When sentiment shifts dramatically overnight',
      'At major distribution tops'
    ],
    commonMistakes: [
      'Confusing with regular gap down (must clear previous open)',
      'Trading false kickers where gap fills quickly',
      'Not sizing position appropriately for high-conviction pattern',
      'Ignoring if pattern appears in choppy/ranging market'
    ]
  }
];

export const KickerPatternVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Kicker Pattern Visual Guide"
    subtitle="Master this rare but highly reliable reversal pattern with 87% historical accuracy—one of the strongest signals in candlestick analysis."
    variants={KICKER_VARIANTS}
  />
);

export default KickerPatternVisualizer;
