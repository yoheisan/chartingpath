import { IndicatorVisualizer, IndicatorVariant } from './IndicatorVisualizer';

const ATR_VARIANTS: IndicatorVariant[] = [
  {
    id: 'atr-indicator',
    name: 'Average True Range',
    indicatorType: 'atr',
    description: 'The Average True Range (ATR), developed by J. Welles Wilder Jr. and introduced in his 1978 book "New Concepts in Technical Trading Systems," is the definitive measure of market volatility. Unlike other volatility measures that only consider high-low ranges, ATR captures the full extent of price movement including gaps. ATR is essential for position sizing, stop loss placement, and volatility-based strategy adaptation. It doesn\'t indicate direction—it measures how much an asset typically moves, making it invaluable for risk management.',
    origin: 'Created by J. Welles Wilder Jr., who also developed RSI, Parabolic SAR, and ADX. Wilder was a mechanical engineer turned real estate developer and trader. He designed ATR specifically to account for gaps in commodity futures, where limit-up and limit-down moves were common. The indicator was revolutionary because it captured "true" volatility that simple high-low ranges missed.',
    formula: `True Range (TR) = Maximum of:
1. Current High - Current Low
2. |Current High - Previous Close|
3. |Current Low - Previous Close|

ATR = Wilder Smoothing Average of TR over n periods

Wilder Smoothing (EMA variant):
ATR(today) = [(ATR(yesterday) × (n-1)) + TR(today)] / n

Where n = lookback period (default 14)

ATR Percentage = (ATR / Current Price) × 100`,
    defaultSettings: 'Standard: 14 periods (Wilder\'s original). Intraday trading: 10-period for faster response. Position trading: 20-period for smoother readings. Day trading volatile assets: 7-period. The 14-period setting represents approximately 2 weeks of trading data.',
    interpretation: [
      'HIGH ATR = High volatility market; expect larger price swings',
      'LOW ATR = Low volatility market; expect smaller, range-bound moves',
      'RISING ATR = Volatility expanding; often occurs at trend beginnings or during breakouts',
      'FALLING ATR = Volatility contracting; often precedes breakouts (calm before storm)',
      'ATR does NOT indicate direction—only magnitude of expected moves',
      'ATR at multi-period highs = Extreme volatility, potentially unsustainable',
      'ATR at multi-period lows = Consolidation, potential energy building for big move',
      'Compare current ATR to 20-period average for relative volatility context'
    ],
    signalTypes: [
      {
        type: 'neutral',
        name: 'Volatility Expansion',
        description: 'ATR rising above its 20-period average indicates increased volatility. Often occurs during breakouts or trend initiations. Widen stops and consider reducing position size.'
      },
      {
        type: 'neutral',
        name: 'Volatility Contraction (Squeeze)',
        description: 'ATR below its 20-period average and declining signals compression. Often precedes significant breakouts. Prepare for potential explosive moves.'
      },
      {
        type: 'bullish',
        name: 'Breakout with ATR Expansion',
        description: 'Price breakout accompanied by rising ATR confirms genuine move with momentum. Low ATR breakouts are more likely to fail (no conviction).'
      },
      {
        type: 'bearish',
        name: 'Spike ATR',
        description: 'Sudden ATR spike (2x+ normal) often occurs at capitulation points—panic selling or buying. Can signal exhaustion and potential reversal zones.'
      }
    ],
    tradingRules: {
      entry: 'ATR doesn\'t provide entry signals—use it to CONFIRM other signals. Breakouts with rising ATR have higher probability. Low ATR periods are ideal for range-bound strategies. High ATR periods favor trend-following approaches.',
      stopLoss: 'ATR Stop = Entry Price ± (ATR × Multiplier). Common multipliers: Conservative: 3× ATR. Moderate: 2× ATR. Aggressive: 1.5× ATR. Chandelier Exit: Highest High(22) - 3×ATR(22) for trailing stops. ATR-based stops adapt to current volatility automatically.',
      target: 'Use ATR multiples for profit targets: 1× ATR for scalping, 2× ATR for day trades, 3-4× ATR for swing trades. Risk:Reward of 1:2 means target should be 2× your ATR stop distance.'
    },
    bestContext: [
      'Position sizing: Divide risk capital by ATR to normalize position size across volatility',
      'Stop loss placement: ATR-based stops respect actual market volatility',
      'Trailing stops: Chandelier Exit (3× ATR from recent high) is a proven method',
      'Breakout confirmation: Rising ATR validates breakout authenticity',
      'Strategy selection: High ATR = trend following; Low ATR = mean reversion',
      'Comparing instruments: ATR% allows comparing volatility across different-priced assets',
      'Volatility-based entries: Enter at low ATR periods for potential breakouts',
      'Risk management across portfolio: Normalize exposure using ATR'
    ],
    commonMistakes: [
      'Trying to use ATR for directional signals (it only measures magnitude)',
      'Using fixed stop losses when ATR-based stops would be more appropriate',
      'Ignoring ATR when position sizing (same $ risk = different risk with different ATR)',
      'Not adjusting strategy when ATR regime changes (low vs high volatility)',
      'Using ATR in isolation rather than as a risk management overlay',
      'Expecting ATR to predict when volatility will change',
      'Using inappropriate ATR periods for the trading timeframe',
      'Forgetting that low ATR often precedes high volatility (not always stable)'
    ],
    prosAndCons: {
      pros: [
        'Objective, quantifiable measure of market volatility',
        'Accounts for gaps unlike simple high-low ranges',
        'Essential for proper position sizing and risk management',
        'Works across all markets and timeframes',
        'Adapts stops to current market conditions',
        'Helps compare volatility across different assets',
        'Foundation for many professional trading systems',
        'Simple calculation and clear interpretation'
      ],
      cons: [
        'No directional bias—must be combined with other indicators',
        'Lagging indicator—measures past volatility, not future',
        'Wilder smoothing can be slow to react to sudden changes',
        'ATR spikes can cause unexpectedly wide stops at worst times',
        'Requires context—raw ATR number meaningless without comparison',
        'Different assets need different ATR period optimization',
        'Can give false "calm before storm" signals',
        'Doesn\'t indicate whether volatility increase is bullish or bearish'
      ]
    },
    advancedTechniques: [
      'Keltner Channels: Use ATR (typically 10-period) to set channel width above/below EMA. Bands = EMA(20) ± 2×ATR(10). Breakouts beyond channels signal strong momentum.',
      'ATR Position Sizing: Risk$ / ATR = Position Size. If risking $500 with ATR=$2, buy 250 units. This normalizes risk across volatility.',
      'Volatility Percentile: Calculate where current ATR ranks vs. last 252 periods. Below 25th percentile = low vol regime. Above 75th = high vol regime.',
      'ATR Trailing Stop (Chandelier): Highest Close(22) - 3×ATR(22). Trails from highest point, widening in volatile markets.',
      'Multi-Timeframe ATR: Compare daily ATR to weekly ATR. If daily ATR >> weekly ATR, short-term volatility spike may revert.',
      'ATR Breakout Filter: Only take breakouts when ATR is expanding (today\'s ATR > 5-day ATR average). Filters many false breakouts.',
      'SuperTrend Indicator: Uses ATR × Multiplier above/below closing prices to create dynamic support/resistance zones that flip on trend change.'
    ]
  }
];

export const ATRVisualizer = () => (
  <IndicatorVisualizer
    title="ATR: Average True Range Guide"
    subtitle="Master J. Welles Wilder's essential volatility indicator for professional risk management. Learn ATR-based position sizing, stop loss placement, and volatility regime identification to adapt your trading to market conditions."
    variants={ATR_VARIANTS}
    category="volatility"
  />
);

export default ATRVisualizer;
