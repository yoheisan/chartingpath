import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const MARUBOZU_VARIANTS: PatternVariant[] = [
  {
    id: 'bullish',
    name: 'Bullish Marubozu',
    patternKey: 'marubozu-bullish',
    bias: 'bullish',
    accuracy: '74%',
    description: 'A single full-bodied bullish candle with no upper or lower shadows. "Marubozu" means "bald" or "shaved head" in Japanese, referring to the complete absence of wicks. This shows absolute buyer dominance.',
    formation: 'A single bullish candle where: Open = Low (no lower shadow), Close = High (no upper shadow). The entire trading range from low to high is the body. Represents complete buyer control from open to close.',
    psychology: 'From the moment the market opened, buyers were in complete control. Price never dipped below the open and never retreated from the high. This shows extreme bullish conviction with no hesitation.',
    keyCharacteristics: [
      'No upper shadow (close = high)',
      'No lower shadow (open = low)',
      'Entire candle is green body',
      'Shows maximum bullish conviction',
      'Open-to-close is the full trading range',
      'Often leads to continuation in same direction'
    ],
    tradingRules: {
      entry: 'Enter on pullback to Marubozu midpoint or on breakout above high',
      stopLoss: 'Below the low of the Marubozu (the open)',
      target: 'Measure the Marubozu length, project from breakout point'
    },
    bestContext: [
      'Breakout from consolidation or base',
      'Following positive catalyst or news',
      'Early in a new uptrend',
      'With above-average volume'
    ],
    commonMistakes: [
      'Chasing extended Marubozu without pullback',
      'Ignoring overbought conditions after pattern',
      'Not accounting for volatility in stops',
      'Trading small Marubozu (need significant size)'
    ]
  },
  {
    id: 'bearish',
    name: 'Bearish Marubozu',
    patternKey: 'marubozu-bearish',
    bias: 'bearish',
    accuracy: '74%',
    description: 'A single full-bodied bearish candle with no upper or lower shadows. This shows absolute seller dominance from open to close with no buying pressure whatsoever.',
    formation: 'A single bearish candle where: Open = High (no upper shadow), Close = Low (no lower shadow). The entire trading range from high to low is the body. Represents complete seller control from open to close.',
    psychology: 'From the moment the market opened, sellers were in complete control. Price never rose above the open and never bounced from the lows. This shows extreme bearish conviction with no hesitation.',
    keyCharacteristics: [
      'No upper shadow (open = high)',
      'No lower shadow (close = low)',
      'Entire candle is red body',
      'Shows maximum bearish conviction',
      'Open-to-close is the full trading range',
      'Often leads to continuation in same direction'
    ],
    tradingRules: {
      entry: 'Enter short on bounce to Marubozu midpoint or breakdown below low',
      stopLoss: 'Above the high of the Marubozu (the open)',
      target: 'Measure the Marubozu length, project from breakdown point'
    },
    bestContext: [
      'Breakdown from distribution or top',
      'Following negative catalyst or news',
      'Early in a new downtrend',
      'With above-average volume'
    ],
    commonMistakes: [
      'Chasing extended Marubozu without bounce',
      'Ignoring oversold conditions after pattern',
      'Not accounting for volatility in stops',
      'Trading small Marubozu (need significant size)'
    ]
  }
];

export const MarubozuVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Marubozu Pattern Visual Guide"
    subtitle="Learn to identify these full-conviction candles that show complete dominance by either buyers or sellers."
    variants={MARUBOZU_VARIANTS}
  />
);

export default MarubozuVisualizer;
