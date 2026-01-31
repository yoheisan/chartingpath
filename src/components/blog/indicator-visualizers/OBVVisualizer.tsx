import { IndicatorVisualizer, IndicatorVariant } from './IndicatorVisualizer';

const OBV_VARIANTS: IndicatorVariant[] = [
  {
    id: 'obv-indicator',
    name: 'On-Balance Volume',
    indicatorType: 'obv',
    description: 'On-Balance Volume (OBV), pioneered by Joseph Granville in his 1963 book "Granville\'s New Key to Stock Market Profits," is a cumulative volume indicator that relates volume to price change. Granville\'s insight was revolutionary: he theorized that volume precedes price. When OBV rises, "smart money" is accumulating; when OBV falls, distribution is occurring. The indicator adds volume on up days and subtracts it on down days, creating a cumulative line that reveals underlying buying or selling pressure before it manifests in price.',
    origin: 'Developed by Joseph Granville, one of the most famous stock market technicians of the 20th century. Granville believed volume was the key to understanding market behavior and that "it takes volume to move prices." His OBV indicator was designed to track money flow—whether money was flowing into or out of a security—before price caught up to this reality.',
    formula: `OBV Calculation:
If Close > Previous Close:
  OBV = Previous OBV + Current Volume

If Close < Previous Close:
  OBV = Previous OBV - Current Volume

If Close = Previous Close:
  OBV = Previous OBV (no change)

Note: The absolute OBV value matters less than its direction
and divergences with price.`,
    defaultSettings: 'OBV has no adjustable parameters—it\'s a pure cumulative calculation from the first data point. Some traders apply moving averages to OBV (20-period SMA is common) to smooth the line and identify OBV trend direction more easily.',
    interpretation: [
      'Rising OBV = Buying pressure dominant; accumulation occurring',
      'Falling OBV = Selling pressure dominant; distribution occurring',
      'OBV rising while price flat = Accumulation before price breakout (bullish)',
      'OBV falling while price flat = Distribution before price breakdown (bearish)',
      'OBV confirming price trend = Healthy trend, likely to continue',
      'OBV new highs with price = Strong confirmation of uptrend',
      'OBV diverging from price = Warning of potential trend change',
      'OBV break of trendline often precedes price trendline break',
      'Volume spikes create OBV inflection points worth noting'
    ],
    signalTypes: [
      {
        type: 'bullish',
        name: 'Bullish Divergence',
        description: 'Price makes lower low, OBV makes higher low. Smart money accumulating despite falling prices—often precedes significant rallies.'
      },
      {
        type: 'bullish',
        name: 'OBV Breakout',
        description: 'OBV breaks above its previous high before price does. Volume is leading—expect price to follow with breakout. Very reliable signal.'
      },
      {
        type: 'bearish',
        name: 'Bearish Divergence',
        description: 'Price makes higher high, OBV makes lower high. Distribution occurring despite rising prices—warns of potential top forming.'
      },
      {
        type: 'bearish',
        name: 'OBV Breakdown',
        description: 'OBV breaks below support before price. Volume leading price lower—expect price to follow. Often early warning of distribution.'
      },
      {
        type: 'neutral',
        name: 'OBV Confirmation',
        description: 'OBV trending in same direction as price confirms the move has volume support. Trend more likely to continue.'
      }
    ],
    tradingRules: {
      entry: 'LONG: Enter when OBV breaks above previous high (especially if price hasn\'t yet) OR when bullish OBV divergence forms at support. SHORT: Enter when OBV breaks below previous low or bearish divergence forms at resistance. Best combined with price action confirmation.',
      stopLoss: 'Place stop below support (longs) or above resistance (shorts). For OBV divergence trades, stop goes beyond the swing point that created the divergence. If OBV reverses its breakout direction, consider exiting.',
      target: 'For divergence trades: Target the high/low that created the divergence. For OBV breakout trades: Measure the preceding OBV range and project forward. Trail stops once price confirms OBV signal.'
    },
    bestContext: [
      'Confirming breakouts—breakouts with OBV confirmation more reliable',
      'Identifying accumulation/distribution phases before price moves',
      'Divergence analysis at key support/resistance levels',
      'Stock and ETF analysis (individual equities have reliable volume data)',
      'Swing trading timeframes where volume patterns develop clearly',
      'Markets with consistent, reliable volume data',
      'Pre-breakout accumulation detection',
      'Validating trend strength through volume participation'
    ],
    commonMistakes: [
      'Focusing on OBV absolute value rather than direction and divergences',
      'Ignoring OBV divergences which are the most powerful signals',
      'Using OBV in markets with unreliable volume data (some forex)',
      'Not confirming OBV signals with price action',
      'Expecting immediate price reaction to OBV signals',
      'Using OBV without context of price structure (S/R levels)',
      'Ignoring OBV trendlines (they often break before price trendlines)',
      'Not understanding that OBV is cumulative from starting point'
    ],
    prosAndCons: {
      pros: [
        'Simple concept: volume leads price',
        'No parameters to optimize—pure calculation',
        'Divergences provide early warning signals',
        'OBV breakouts often precede price breakouts',
        'Confirms legitimate breakouts vs false breakouts',
        'Works well with support/resistance analysis',
        'Reveals accumulation/distribution not visible in price',
        'Easy to apply trendline analysis to OBV'
      ],
      cons: [
        'Unreliable in markets with inconsistent volume (some forex pairs)',
        'Absolute values are meaningless—only direction matters',
        'Cumulative nature means starting point affects values',
        'Gap-heavy markets can distort OBV readings',
        'Requires patience—divergences can take time to resolve',
        'Volume data quality varies across different exchanges',
        'Less effective in highly manipulated markets',
        'Needs price action confirmation for best results'
      ]
    },
    advancedTechniques: [
      'OBV Trendlines: Draw trendlines on OBV itself. OBV trendline breaks often precede price trendline breaks by 1-3 bars. Excellent early warning.',
      'OBV + Moving Average: Add 20-period SMA to OBV. OBV above its MA = bullish pressure. OBV below MA = bearish pressure. Crossovers signal shift.',
      'Price-OBV Correlation: Calculate correlation between price and OBV over 20 periods. Weakening correlation warns of divergence forming.',
      'OBV Climactic Volume: Extreme OBV spikes (3+ standard deviations) often mark capitulation points or blow-off tops. Watch for reversal.',
      'Multi-Timeframe OBV: Weekly OBV trend determines bias, daily OBV confirms entry timing. Trade only when both align.',
      'OBV Breakout Confirmation: Only trade price breakouts when OBV has already broken out in the same direction. Filters many false breakouts.'
    ]
  }
];

export const OBVVisualizer = () => (
  <IndicatorVisualizer
    title="OBV: On-Balance Volume Guide"
    subtitle="Master Joseph Granville's classic volume indicator that reveals whether 'smart money' is accumulating or distributing before price catches up. Learn to identify powerful divergences and use volume to confirm breakouts."
    variants={OBV_VARIANTS}
    category="volume"
  />
);

export default OBVVisualizer;
