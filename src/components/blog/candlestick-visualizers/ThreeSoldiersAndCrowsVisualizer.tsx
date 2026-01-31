import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const THREE_CANDLE_VARIANTS: PatternVariant[] = [
  {
    id: 'soldiers',
    name: 'Three White Soldiers',
    patternKey: 'three-white-soldiers',
    bias: 'bullish',
    accuracy: '82%',
    description: 'One of the strongest bullish candlestick patterns consisting of three consecutive long-bodied bullish candles. Each opens within the previous body and closes at a new high, showing sustained buying pressure.',
    formation: 'Three consecutive bullish (green) candles where: each candle opens within the body of the previous candle, each closes progressively higher, bodies are long with small or no upper shadows (full conviction).',
    psychology: 'This pattern shows relentless buying pressure over three sessions. Buyers are not hesitating or taking profits—they\'re adding to positions aggressively. This sustained conviction often leads to continued upside.',
    keyCharacteristics: [
      'Three consecutive bullish candles',
      'Each opens within previous candle\'s body',
      'Each closes at progressively higher levels',
      'Long bodies with small upper shadows',
      'Ideally appears after a downtrend or consolidation',
      'Volume should increase with each candle'
    ],
    tradingRules: {
      entry: 'Enter on close of third candle or pullback to third candle\'s midpoint',
      stopLoss: 'Below the low of the first soldier',
      target: 'Previous major resistance or 2:1 risk/reward'
    },
    bestContext: [
      'Breaking out of consolidation or base',
      'After a downtrend showing reversal',
      'Following positive fundamental catalyst',
      'With increasing volume each day'
    ],
    commonMistakes: [
      'Chasing after extended three soldiers (wait for pullback)',
      'Ignoring overbought conditions after pattern',
      'Not checking for nearby resistance levels',
      'Trading small-bodied soldiers (need long bodies)'
    ]
  },
  {
    id: 'crows',
    name: 'Three Black Crows',
    patternKey: 'three-black-crows',
    bias: 'bearish',
    accuracy: '78%',
    description: 'One of the strongest bearish candlestick patterns consisting of three consecutive long-bodied bearish candles. Each opens within the previous body and closes at a new low, showing sustained selling pressure.',
    formation: 'Three consecutive bearish (red) candles where: each candle opens within the body of the previous candle, each closes progressively lower, bodies are long with small or no lower shadows (full conviction).',
    psychology: 'This pattern shows relentless selling pressure over three sessions. Sellers are not covering or taking profits—they\'re adding to short positions aggressively. This sustained conviction often leads to continued downside.',
    keyCharacteristics: [
      'Three consecutive bearish candles',
      'Each opens within previous candle\'s body',
      'Each closes at progressively lower levels',
      'Long bodies with small lower shadows',
      'Ideally appears after an uptrend or at resistance',
      'Volume should increase with each candle'
    ],
    tradingRules: {
      entry: 'Enter short on close of third candle or bounce to third candle\'s midpoint',
      stopLoss: 'Above the high of the first crow',
      target: 'Previous major support or 2:1 risk/reward'
    },
    bestContext: [
      'At major resistance levels',
      'After extended uptrend showing exhaustion',
      'Following negative fundamental catalyst',
      'With increasing volume each day'
    ],
    commonMistakes: [
      'Shorting after extended three crows (wait for bounce)',
      'Ignoring oversold conditions after pattern',
      'Not checking for nearby support levels',
      'Trading small-bodied crows (need long bodies)'
    ]
  }
];

export const ThreeSoldiersAndCrowsVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Three White Soldiers & Three Black Crows"
    subtitle="Learn these powerful three-candle continuation/reversal patterns that show sustained market conviction."
    variants={THREE_CANDLE_VARIANTS}
  />
);

export const ThreeWhiteSoldiersVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Three White Soldiers Pattern Guide"
    subtitle="Master this powerful bullish pattern showing sustained buying conviction over three consecutive sessions."
    variants={[THREE_CANDLE_VARIANTS[0]]}
  />
);

export const ThreeBlackCrowsVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Three Black Crows Pattern Guide"
    subtitle="Learn this powerful bearish pattern showing sustained selling conviction over three consecutive sessions."
    variants={[THREE_CANDLE_VARIANTS[1]]}
  />
);

export default ThreeSoldiersAndCrowsVisualizer;
