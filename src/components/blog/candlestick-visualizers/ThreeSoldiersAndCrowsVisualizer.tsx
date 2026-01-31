import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const THREE_CANDLE_VARIANTS: PatternVariant[] = [
  {
    id: 'soldiers',
    name: 'Three White Soldiers',
    patternKey: 'three-white-soldiers',
    bias: 'bullish',
    accuracy: '82%',
    description: 'Three White Soldiers is one of the strongest bullish candlestick patterns, consisting of three consecutive long-bodied green candles that march progressively higher—like soldiers advancing in formation. Originating from Japanese candlestick analysis, this pattern demonstrates sustained institutional buying over three sessions. Research shows 78-86% reliability when appearing after downtrends or during accumulation phases, making it a high-conviction setup.',
    formation: 'Three consecutive bullish candles where: (1) Each candle opens within the body of the previous candle (not below the prior close), (2) Each candle closes progressively higher, creating a stair-step pattern, (3) All three have long bodies with minimal upper shadows (full conviction closes), (4) Lower shadows should also be small (buyers in control from open to close).',
    psychology: 'This pattern represents relentless buying pressure sustained over three sessions. Unlike single-candle patterns, Three White Soldiers shows that buying conviction is not fading—each day, buyers are willing to pay higher prices and hold through the close. Institutional accumulation often manifests this way: smart money building positions over multiple sessions. The lack of upper shadows shows sellers cannot mount meaningful resistance.',
    keyCharacteristics: [
      'Three consecutive bullish (green/white) candles',
      'Each opens within previous candle\'s body (not gapping)',
      'Each closes at progressively higher levels (stair-step)',
      'Long bodies with minimal shadows (conviction)',
      'Ideally appears after downtrend or consolidation (reversal signal)',
      'Volume should increase with each successive candle',
      'Upper shadows should be <10% of body length',
      'Pattern completion signals sustained trend change'
    ],
    tradingRules: {
      entry: 'Conservative: Enter on pullback to third candle\'s midpoint or body. Aggressive: Enter on close of third candle. Filter: Require volume progression (each day higher). Wait for completion—two soldiers is not the pattern.',
      stopLoss: 'Place stop below the low of the first soldier. This is the pattern\'s base—if broken, the entire advance fails. Alternative: Below the second candle\'s low for tighter stop.',
      target: 'Target 1: Previous major resistance level (1:1 R/R). Target 2: Measured move equal to pattern height projected from breakout. Warning: Avoid chasing extended soldiers—wait for pullback.'
    },
    bestContext: [
      'Breaking out of consolidation or basing pattern',
      'Appearing after a downtrend (reversal context)',
      'Following positive fundamental catalyst or earnings',
      'With increasing volume each day (accumulation confirmation)',
      'After oversold conditions have developed',
      'Near major support level that held',
      'When broader market/sector is also turning bullish',
      'Following capitulation selling and recovery attempt'
    ],
    commonMistakes: [
      'Chasing after extended Three Soldiers without waiting for pullback',
      'Ignoring overbought conditions developing after pattern',
      'Not checking for nearby resistance that might stall advance',
      'Trading small-bodied "soldiers" (bodies must be long)',
      'Entering before pattern completes (need all three candles)',
      'Ignoring volume—soldiers without volume often fail',
      'Mistaking consolidation inside bars for soldiers',
      'Not considering larger timeframe resistance overhead'
    ]
  },
  {
    id: 'crows',
    name: 'Three Black Crows',
    patternKey: 'three-black-crows',
    bias: 'bearish',
    accuracy: '78%',
    description: 'Three Black Crows is one of the strongest bearish candlestick patterns—the ominous counterpart to Three White Soldiers. Three consecutive long-bodied red candles descend progressively lower, like crows circling a dying market. The Japanese term evokes a sense of doom appropriate to the pattern\'s meaning: sustained institutional distribution over three sessions. Studies show 74-82% reliability at resistance levels or following distribution patterns.',
    formation: 'Three consecutive bearish candles where: (1) Each candle opens within the body of the previous candle (not above the prior close), (2) Each candle closes progressively lower, creating a descending stair-step, (3) All three have long bodies with minimal lower shadows (full conviction selling), (4) Upper shadows should also be small (sellers control from open to close).',
    psychology: 'This pattern represents relentless selling pressure over three sessions. Each day, sellers drive prices lower, and buyers cannot mount any meaningful recovery. Institutional distribution often manifests this way: smart money selling positions to retail over multiple sessions. The lack of lower shadows shows that bulls cannot find any foothold—each rally attempt is immediately sold.',
    keyCharacteristics: [
      'Three consecutive bearish (red/black) candles',
      'Each opens within previous candle\'s body (not gapping)',
      'Each closes at progressively lower levels (descending steps)',
      'Long bodies with minimal shadows (conviction selling)',
      'Ideally appears after uptrend or at resistance (reversal)',
      'Volume should increase with each successive candle',
      'Lower shadows should be <10% of body length',
      'Pattern signals sustained selling pressure ahead'
    ],
    tradingRules: {
      entry: 'Conservative: Enter short on bounce to third crow\'s midpoint. Aggressive: Enter on close of third crow. Filter: Require volume progression. Never chase extended crows—wait for retest.',
      stopLoss: 'Place stop above the high of the first crow. This is the pattern\'s ceiling—if exceeded, sellers have lost control. Alternative: Above second crow\'s high for tighter management.',
      target: 'Target 1: Previous major support level (1:1 R/R). Target 2: Measured move equal to pattern height projected down. Target 3: Next Fibonacci support level.'
    },
    bestContext: [
      'At major resistance levels (distribution zone)',
      'After extended uptrend showing exhaustion',
      'Following negative fundamental catalyst or earnings miss',
      'With increasing volume each day (distribution confirmation)',
      'After overbought conditions developed (RSI >70)',
      'Near prior significant highs that rejected price',
      'When broader market/sector is turning bearish',
      'Following failed breakout attempts above resistance'
    ],
    commonMistakes: [
      'Shorting after extended Three Crows (wait for bounce)',
      'Ignoring oversold conditions developing after pattern',
      'Not checking for nearby support that might halt decline',
      'Trading small-bodied "crows" (bodies must be substantial)',
      'Entering before pattern completes (need all three)',
      'Ignoring volume—crows without volume are less reliable',
      'Fighting strong bullish trends with pattern alone',
      'Not considering larger timeframe support levels below'
    ]
  }
];

export const ThreeSoldiersAndCrowsVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Three White Soldiers & Three Black Crows"
    subtitle="Master these powerful three-candle patterns showing sustained market conviction. Soldiers march higher with relentless buying; Crows descend with persistent selling—both represent institutional-level commitment to a directional move."
    variants={THREE_CANDLE_VARIANTS}
  />
);

export const ThreeWhiteSoldiersVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Three White Soldiers Pattern Guide"
    subtitle="Master this powerful bullish pattern showing sustained buying conviction over three consecutive sessions—among the strongest continuation/reversal signals in candlestick analysis."
    variants={[THREE_CANDLE_VARIANTS[0]]}
  />
);

export const ThreeBlackCrowsVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Three Black Crows Pattern Guide"
    subtitle="Learn this powerful bearish pattern showing sustained selling conviction over three consecutive sessions—a strong warning of continued downside pressure."
    variants={[THREE_CANDLE_VARIANTS[1]]}
  />
);

export default ThreeSoldiersAndCrowsVisualizer;
