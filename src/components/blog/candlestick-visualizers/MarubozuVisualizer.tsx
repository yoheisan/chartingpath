import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const MARUBOZU_VARIANTS: PatternVariant[] = [
  {
    id: 'bullish',
    name: 'Bullish Marubozu',
    patternKey: 'marubozu-bullish',
    bias: 'bullish',
    accuracy: '74%',
    description: 'The Bullish Marubozu is a single full-bodied bullish candle with no upper or lower shadows—the purest expression of buying conviction. "Marubozu" means "bald" or "shaved head" in Japanese, referring to the complete absence of wicks. When the market opens at the low and closes at the high, it demonstrates absolute buyer dominance throughout the entire session. Studies show 70-78% continuation probability in the direction of the pattern.',
    formation: 'A single bullish candle where: Open = Low (no lower shadow exists), Close = High (no upper shadow exists). The entire trading range from low to high is represented by the body. No shadows whatsoever—the body IS the entire candle. This represents complete buyer control from the first tick to the last.',
    psychology: 'From the moment the market opened, buyers were in complete control. Price never dipped below the open, and buyers continued accumulating without pause. At no point did sellers mount any meaningful resistance. This shows extreme bullish conviction with zero hesitation—often driven by institutional accumulation or breaking news. The pattern frequently appears during breakouts.',
    keyCharacteristics: [
      'No upper shadow (close = high of the session)',
      'No lower shadow (open = low of the session)',
      'Entire candle is green body (no wicks)',
      'Shows maximum bullish conviction possible',
      'Open-to-close represents the full trading range',
      'Often leads to continuation in same direction',
      'Significant size required (not small candles)',
      'Frequently appears during breakouts'
    ],
    tradingRules: {
      entry: 'Options: (1) Enter on pullback to Marubozu midpoint (50% retracement), (2) Enter on breakout above the high with confirmation, (3) Enter next bar open if Marubozu forms at support. Avoid chasing extended Marubozu.',
      stopLoss: 'Below the low of the Marubozu (which is the open). This is an aggressive stop. Conservative: Below a nearby support level for wider protection.',
      target: 'Measured move: Project the Marubozu length from the breakout point. Target 1: 1:1 extension. Target 2: Next resistance level. Strong Marubozu often lead to extended moves.'
    },
    bestContext: [
      'Breakout from consolidation or base pattern',
      'Following positive catalyst or earnings surprise',
      'Early in a new uptrend (not extended)',
      'With above-average volume (institutional conviction)',
      'Breaking above key resistance levels',
      'Following positive market-wide catalyst',
      'After accumulation patterns (cup and handle, base)',
      'When sector/market is also bullish'
    ],
    commonMistakes: [
      'Chasing extended Marubozu without pullback',
      'Ignoring overbought conditions developing after pattern',
      'Not accounting for increased volatility in stops',
      'Trading small Marubozu (need significant body size)',
      'Entering immediately without any consolidation',
      'Ignoring resistance levels just above the pattern',
      'Using pattern in isolation without context',
      'Not reducing size for aggressive stop placement'
    ]
  },
  {
    id: 'bearish',
    name: 'Bearish Marubozu',
    patternKey: 'marubozu-bearish',
    bias: 'bearish',
    accuracy: '74%',
    description: 'The Bearish Marubozu is a single full-bodied bearish candle with no shadows—the purest expression of selling conviction. When the market opens at the high and closes at the low, it demonstrates absolute seller dominance. There was no moment during the session when buyers could mount any defense. This often signals panic selling, distribution, or a strong continuation of bearish momentum.',
    formation: 'A single bearish candle where: Open = High (no upper shadow exists), Close = Low (no lower shadow exists). The entire trading range from high to low is represented by the body. The candle has no wicks—just a pure red/black body representing uninterrupted selling.',
    psychology: 'From the moment the market opened, sellers were in complete control. Price never rose above the open, and selling continued without pause. Buyers couldn\'t find any foothold. This shows extreme bearish conviction—often driven by institutional distribution, negative news, or breakdown from key levels. The pattern frequently appears during crashes or breakdown moves.',
    keyCharacteristics: [
      'No upper shadow (open = high of the session)',
      'No lower shadow (close = low of the session)',
      'Entire candle is red body (no wicks)',
      'Shows maximum bearish conviction possible',
      'Open-to-close represents the full trading range',
      'Often leads to continuation in same direction',
      'Significant size required (meaningful body)',
      'Frequently appears during breakdowns or crashes'
    ],
    tradingRules: {
      entry: 'Options: (1) Enter short on bounce to Marubozu midpoint (50% retracement), (2) Enter on breakdown below the low with confirmation, (3) Enter next bar open if Marubozu forms at resistance. Avoid chasing extended Marubozu.',
      stopLoss: 'Above the high of the Marubozu (which is the open). This is an aggressive stop. Conservative: Above a nearby resistance level for wider protection.',
      target: 'Measured move: Project the Marubozu length from the breakdown point. Target 1: 1:1 extension. Target 2: Next support level. Strong Marubozu often lead to extended moves down.'
    },
    bestContext: [
      'Breakdown from distribution or top pattern',
      'Following negative catalyst or earnings miss',
      'Early in a new downtrend (not extended)',
      'With above-average volume (institutional distribution)',
      'Breaking below key support levels',
      'Following negative market-wide catalyst',
      'After distribution patterns (head and shoulders, double top)',
      'When sector/market is also bearish'
    ],
    commonMistakes: [
      'Chasing extended Marubozu without bounce/retest',
      'Ignoring oversold conditions developing after pattern',
      'Not accounting for increased volatility in stops',
      'Trading small Marubozu (need significant body size)',
      'Shorting immediately without consolidation',
      'Ignoring support levels just below the pattern',
      'Using pattern in isolation without context',
      'Over-leveraging on volatile breakdown moves'
    ]
  }
];

export const MarubozuVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Marubozu Pattern Visual Guide"
    subtitle="Master these full-conviction candles that show complete dominance by either buyers or sellers. 'Marubozu' means 'bald head' in Japanese—these candles have no shadows (wicks), representing pure directional conviction."
    variants={MARUBOZU_VARIANTS}
  />
);

export default MarubozuVisualizer;
