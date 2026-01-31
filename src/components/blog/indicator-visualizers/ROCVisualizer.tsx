import { IndicatorVisualizer, IndicatorVariant } from './IndicatorVisualizer';

const ROC_VARIANTS: IndicatorVariant[] = [
  {
    id: 'roc-indicator',
    name: 'Rate of Change',
    indicatorType: 'roc',
    description: 'The Rate of Change (ROC) is one of the purest momentum oscillators, measuring the percentage change between the current price and a price n periods ago. This straightforward calculation reveals how fast price is moving and in which direction. ROC oscillates above and below zero: positive values indicate upward momentum, negative values indicate downward momentum. The indicator\'s simplicity makes it valuable for comparing momentum across different assets and identifying potential divergences.',
    origin: 'ROC is one of the oldest and most fundamental momentum indicators, with roots in basic rate-of-change mathematics applied to price data. Its simplicity made it popular among early technical analysts before computing power was available. Despite (or because of) its straightforward nature, ROC remains widely used by quantitative traders and is a building block for more complex momentum indicators.',
    formula: `Rate of Change (ROC):

ROC = [(Current Close - Close n periods ago) / Close n periods ago] × 100

Example (12-period ROC):
If Close today = 110
Close 12 periods ago = 100
ROC = [(110 - 100) / 100] × 100 = 10%

Momentum (alternative calculation):
Momentum = Current Close - Close n periods ago
(ROC is the percentage version of Momentum)`,
    defaultSettings: 'Standard: 12 periods (captures quarterly trends in daily data). Short-term: 9 periods. Medium-term: 25 periods. Long-term: 200 periods (one year on daily data). Zero line is the key reference. No fixed overbought/oversold levels.',
    interpretation: [
      'ROC > 0 = Positive momentum (price higher than n periods ago)',
      'ROC < 0 = Negative momentum (price lower than n periods ago)',
      'Rising ROC = Momentum accelerating (bullish)',
      'Falling ROC = Momentum decelerating (bearish)',
      'ROC crossing above zero = Bullish momentum shift',
      'ROC crossing below zero = Bearish momentum shift',
      'Extreme ROC readings = Potential exhaustion (check historical extremes)',
      'ROC divergence from price = Warning of potential trend change',
      'ROC slope more important than absolute value'
    ],
    signalTypes: [
      {
        type: 'bullish',
        name: 'Zero Line Crossover (Up)',
        description: 'ROC crosses from negative to positive. Price is now higher than n periods ago, indicating momentum has turned bullish.'
      },
      {
        type: 'bullish',
        name: 'Bullish Divergence',
        description: 'Price makes lower low while ROC makes higher low. Momentum improving despite price decline—often precedes rallies.'
      },
      {
        type: 'bearish',
        name: 'Zero Line Crossover (Down)',
        description: 'ROC crosses from positive to negative. Price is now lower than n periods ago, indicating momentum has turned bearish.'
      },
      {
        type: 'bearish',
        name: 'Bearish Divergence',
        description: 'Price makes higher high while ROC makes lower high. Momentum weakening despite price advance—warns of potential top.'
      },
      {
        type: 'neutral',
        name: 'ROC Extreme',
        description: 'ROC at historical extreme (2+ standard deviations from mean). Often indicates overbought/oversold conditions relative to that asset\'s normal behavior.'
      }
    ],
    tradingRules: {
      entry: 'Zero Line Cross: Enter LONG when ROC crosses above zero from below. Enter SHORT when ROC crosses below zero from above. Confirmation: Wait for ROC to stay above/below zero for 2-3 bars. Divergence trades: Enter when price confirms the divergence direction.',
      stopLoss: 'Place stop below recent swing low (longs) or above recent swing high (shorts). If ROC crosses back through zero against your position, consider exiting. Alternative: Use ATR-based stops adjusted for current volatility.',
      target: 'Watch for ROC deceleration (flattening slope) as potential exit signal. For divergence trades: Target the price extreme that created the divergence. Consider partial profits when ROC reaches historical extreme levels.'
    },
    bestContext: [
      'Comparing momentum across different assets (normalized by percentage)',
      'Identifying momentum divergences at key price levels',
      'Confirming trend direction and strength',
      'Mean reversion strategies at ROC extremes',
      'Quantitative trading systems (simple, robust calculation)',
      'Sector rotation analysis (comparing ROC across sectors)',
      'Timing entries in trend-following strategies',
      'Building blocks for more complex momentum models'
    ],
    commonMistakes: [
      'Using fixed overbought/oversold levels (context depends on asset)',
      'Ignoring that ROC can stay extreme during strong trends',
      'Not considering the lookback period\'s impact on signals',
      'Trading every zero-line cross without trend confirmation',
      'Ignoring divergences which are ROC\'s most valuable signals',
      'Using ROC in isolation without price action context',
      'Not adapting lookback period to trading timeframe',
      'Confusing ROC with Price Change (ROC is percentage-based)'
    ],
    prosAndCons: {
      pros: [
        'Simple, intuitive calculation (easy to understand and verify)',
        'Percentage-based allows cross-asset comparison',
        'No parameters to optimize beyond lookback period',
        'Zero line provides clear bullish/bearish reference',
        'Divergences are straightforward to identify',
        'Building block for more complex indicators',
        'Works across all markets and timeframes',
        'Quantitatively robust for systematic trading'
      ],
      cons: [
        'No inherent overbought/oversold levels',
        'Zero-line crossovers can whipsaw in ranges',
        'Highly dependent on lookback period choice',
        'Lagging by nature (compares current to past)',
        'Less smoothed than RSI or MACD',
        'Extreme readings hard to define without context',
        'Single-line indicator (no signal line for crossovers)',
        'Can produce volatile signals during choppy periods'
      ]
    },
    advancedTechniques: [
      'Dual ROC System: Compare 12-period ROC (short-term) to 26-period ROC (longer-term). When both positive and short > long = strong momentum.',
      'ROC Standard Deviation Bands: Calculate 2 standard deviation bands around zero. ROC beyond bands = statistically extreme reading.',
      'ROC + Price Action: Combine ROC zero-line cross with candlestick confirmation (strong close, hammer at support) for higher probability entries.',
      'Sector Momentum Ranking: Rank sectors by ROC and rotate into highest momentum sectors monthly. Classic quantitative strategy.',
      'ROC Smoothing: Apply 3-period SMA to ROC to reduce noise while maintaining responsiveness. Creates smoother signal line.',
      'Multi-timeframe ROC: Weekly ROC for direction bias, daily ROC for entry timing. Only trade when both timeframes confirm momentum direction.'
    ]
  }
];

export const ROCVisualizer = () => (
  <IndicatorVisualizer
    title="Rate of Change (ROC) Indicator Guide"
    subtitle="Master this fundamental momentum oscillator that measures percentage price change over time. ROC's simplicity and percentage-based calculation make it ideal for comparing momentum across different assets and timeframes."
    variants={ROC_VARIANTS}
    category="momentum"
  />
);

export default ROCVisualizer;
