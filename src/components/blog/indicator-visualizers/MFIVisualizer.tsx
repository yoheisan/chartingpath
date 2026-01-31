import { IndicatorVisualizer, IndicatorVariant } from './IndicatorVisualizer';

const MFI_VARIANTS: IndicatorVariant[] = [
  {
    id: 'mfi-indicator',
    name: 'Money Flow Index',
    indicatorType: 'mfi',
    description: 'The Money Flow Index (MFI) is often called the "volume-weighted RSI" because it incorporates volume into its momentum calculation. Developed by Gene Quong and Avrum Soudack, MFI measures buying and selling pressure using both price AND volume. While RSI only considers price closes, MFI weights each period by its volume—making heavy-volume reversals more significant than light-volume ones. This volume weighting makes MFI particularly effective at identifying capitulation points and distribution/accumulation.',
    origin: 'Created by Gene Quong and Avrum Soudack, MFI was designed to address a limitation of RSI: the lack of volume consideration. The developers recognized that a price move on heavy volume is more significant than the same move on light volume, and designed MFI to capture this reality. It became popular through its inclusion in technical analysis software packages.',
    formula: `Typical Price:
TP = (High + Low + Close) / 3

Raw Money Flow:
RMF = Typical Price × Volume

Positive Money Flow: Sum of RMF when TP > Previous TP
Negative Money Flow: Sum of RMF when TP < Previous TP

Money Flow Ratio:
MFR = (14-period Positive MF) / (14-period Negative MF)

Money Flow Index:
MFI = 100 - (100 / (1 + MFR))

Range: 0 to 100`,
    defaultSettings: 'Standard: 14 periods. Some traders use 10 periods for more sensitivity or 20 periods for smoother readings. Overbought threshold: 80. Oversold threshold: 20. Some use 70/30 for earlier signals.',
    interpretation: [
      'MFI above 80 = Overbought; heavy buying pressure may be exhausting',
      'MFI below 20 = Oversold; heavy selling pressure may be exhausting',
      'MFI rising with rising price = Healthy uptrend with volume support',
      'MFI falling with falling price = Healthy downtrend with volume support',
      'MFI divergence from price = Warning of potential reversal (volume not confirming)',
      'MFI > 50 = Net positive money flow (bullish pressure)',
      'MFI < 50 = Net negative money flow (bearish pressure)',
      'High volume reversals at MFI extremes = Strong reversal signals',
      'MFI at 0 or 100 = Extreme conditions, often at major turning points'
    ],
    signalTypes: [
      {
        type: 'bullish',
        name: 'Oversold Reversal',
        description: 'MFI drops below 20 then rises back above—indicates selling exhaustion with heavy volume capitulation. Often marks significant bottoms.'
      },
      {
        type: 'bullish',
        name: 'Bullish Divergence',
        description: 'Price makes lower low, MFI makes higher low. Volume-weighted buying pressure increasing despite lower prices—strong reversal signal.'
      },
      {
        type: 'bearish',
        name: 'Overbought Reversal',
        description: 'MFI rises above 80 then falls back below—buying pressure exhausted on heavy volume. Often marks distribution tops.'
      },
      {
        type: 'bearish',
        name: 'Bearish Divergence',
        description: 'Price makes higher high, MFI makes lower high. Volume-weighted selling pressure increasing despite higher prices—top warning.'
      },
      {
        type: 'neutral',
        name: 'Failure Swing',
        description: 'MFI enters overbought/oversold, fails to reach new extreme on retest, and reverses. Reliable reversal pattern when combined with price action.'
      }
    ],
    tradingRules: {
      entry: 'LONG: Enter when MFI rises from below 20 back above 20, preferably with bullish price action (hammer, engulfing). SHORT: Enter when MFI falls from above 80 back below 80. Divergence entries: Trade when price confirms the MFI divergence direction.',
      stopLoss: 'Place stop below recent low (longs) or above recent high (shorts). For oversold bounces, stop below the low that created the oversold reading. Risk should be defined by price structure, not MFI levels.',
      target: 'For overbought/oversold trades: Target the 50 level as initial target (neutral zone). For divergence trades: Target the high/low that created the divergence. Consider partial exits at opposite extreme zone.'
    },
    bestContext: [
      'Identifying capitulation bottoms (MFI below 10-20 with volume spike)',
      'Confirming distribution at tops (high MFI failing to make new highs)',
      'Volume-confirmed divergence trading',
      'Stock and futures markets with reliable volume data',
      'Swing trading timeframes (daily, 4-hour)',
      'Comparing to RSI—when MFI and RSI diverge, MFI often more accurate',
      'Earnings reactions and news-driven moves (volume matters)',
      'Identifying climax buying/selling conditions'
    ],
    commonMistakes: [
      'Selling immediately when MFI reaches 80 (can stay overbought in trends)',
      'Ignoring volume context that makes MFI valuable',
      'Using MFI in forex without reliable volume data (use tick volume cautiously)',
      'Not confirming MFI signals with price action',
      'Treating MFI exactly like RSI (volume weighting creates different behavior)',
      'Ignoring divergences which are MFI\'s strongest signals',
      'Using very short periods which create noise',
      'Not understanding that typical price smooths out some noise'
    ],
    prosAndCons: {
      pros: [
        'Volume weighting adds valuable dimension vs RSI',
        'Better at identifying capitulation and exhaustion points',
        'Divergences are highly reliable reversal warnings',
        'Typical price calculation smooths out some noise',
        'Clear overbought/oversold zones',
        'Effective at confirming or questioning price moves',
        'Works well with support/resistance analysis',
        'Identifies heavy-volume distribution/accumulation'
      ],
      cons: [
        'Requires reliable volume data to be meaningful',
        'Less effective in forex (volume data inconsistent)',
        'Can stay overbought/oversold during strong trends',
        'Volume spikes can cause erratic readings',
        'More complex calculation than RSI',
        'Needs price confirmation for best results',
        'Typical price can obscure some price action nuances',
        'Not suitable for markets with low volume or gaps'
      ]
    },
    advancedTechniques: [
      'MFI vs RSI Comparison: When MFI diverges from RSI at extremes, MFI often provides superior signal due to volume confirmation',
      'MFI Failure Swing: If MFI enters overbought (>80), pulls back to 60, then fails to reach 80 on next rally = sell signal. Inverse for oversold.',
      'Volume Climax + MFI: Look for extreme MFI (>90 or <10) combined with volume spike = likely exhaustion point and reversal zone',
      'MFI Trend Confirmation: In uptrends, MFI should hold above 40-50 on pullbacks. Drops below suggest weakening volume support.',
      'MFI + Price Breaks: Price breaking support/resistance while MFI confirms (breaking its own level) = high probability move',
      'Multi-timeframe MFI: Weekly MFI for bias, daily for entry timing. Oversold daily in oversold weekly = powerful accumulation signal'
    ]
  }
];

export const MFIVisualizer = () => (
  <IndicatorVisualizer
    title="Money Flow Index (MFI) Guide"
    subtitle="Master the 'volume-weighted RSI' that reveals whether money is flowing into or out of a security. MFI's volume component makes it superior to RSI for identifying capitulation and distribution at key turning points."
    variants={MFI_VARIANTS}
    category="volume"
  />
);

export default MFIVisualizer;
