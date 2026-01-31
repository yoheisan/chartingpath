import { IndicatorVisualizer, IndicatorVariant } from './IndicatorVisualizer';

const PARABOLIC_SAR_VARIANTS: IndicatorVariant[] = [
  {
    id: 'parabolic-sar-indicator',
    name: 'Parabolic SAR',
    indicatorType: 'parabolic-sar',
    description: 'The Parabolic SAR (Stop and Reverse), developed by J. Welles Wilder Jr., is a trend-following indicator that provides potential entry and exit points. The indicator appears as dots above or below price: dots below price indicate uptrend (bullish), dots above indicate downtrend (bearish). "SAR" stands for Stop And Reverse because the system is always in the market—when the trend changes, the position reverses. The "parabolic" name comes from the curved shape the dots make as they accelerate toward price during extended trends.',
    origin: 'Created by J. Welles Wilder Jr. and introduced in his 1978 book "New Concepts in Technical Trading Systems" alongside RSI, ATR, and ADX. Wilder designed Parabolic SAR as a mechanical trading system that would keep traders in trends while providing clear exit points. The acceleration factor was designed to capture more profit by tightening stops as trends mature.',
    formula: `Parabolic SAR Calculation:

For Rising SAR (Uptrend):
SAR(tomorrow) = SAR(today) + AF × (EP - SAR(today))

For Falling SAR (Downtrend):
SAR(tomorrow) = SAR(today) - AF × (SAR(today) - EP)

Where:
- AF = Acceleration Factor (starts at 0.02)
- EP = Extreme Point (highest high in uptrend, lowest low in downtrend)
- AF increases by 0.02 each time new EP is made
- Maximum AF = 0.20

Reversal occurs when price crosses through SAR`,
    defaultSettings: 'Wilder\'s original: AF Start = 0.02, AF Step = 0.02, AF Max = 0.20. Aggressive: Start 0.025, Step 0.025, Max 0.25. Conservative: Start 0.01, Step 0.01, Max 0.10. Higher AF = tighter stops but more whipsaws. Lower AF = wider stops but catches bigger moves.',
    interpretation: [
      'Dots BELOW price = Uptrend in force (bullish)',
      'Dots ABOVE price = Downtrend in force (bearish)',
      'Dots flip from below to above = Sell signal (uptrend ends)',
      'Dots flip from above to below = Buy signal (downtrend ends)',
      'Dots serve as trailing stop loss levels',
      'Dots accelerate toward price as trend matures (tightening stop)',
      'When dots flip, also represents potential entry for new position',
      'Dots never decrease in an uptrend or increase in a downtrend',
      'Gap between price and dots indicates trend strength'
    ],
    signalTypes: [
      {
        type: 'bullish',
        name: 'SAR Flip Bullish',
        description: 'Dots flip from above price to below price. Indicates downtrend has ended and uptrend may be beginning. Buy signal in the SAR system.'
      },
      {
        type: 'bullish',
        name: 'Strong Uptrend Confirmation',
        description: 'Price well above SAR dots with dots accelerating upward (curve tightening). Indicates healthy uptrend with momentum.'
      },
      {
        type: 'bearish',
        name: 'SAR Flip Bearish',
        description: 'Dots flip from below price to above price. Indicates uptrend has ended and downtrend may be beginning. Sell/short signal.'
      },
      {
        type: 'bearish',
        name: 'Strong Downtrend Confirmation',
        description: 'Price well below SAR dots with dots accelerating downward. Indicates healthy downtrend with selling momentum.'
      },
      {
        type: 'neutral',
        name: 'Approaching Flip',
        description: 'Dots rapidly converging toward price (parabolic curve tightening). Trend maturation warning—prepare for potential reversal.'
      }
    ],
    tradingRules: {
      entry: 'Wilder\'s method: Enter LONG when dots flip from above to below price. Enter SHORT when dots flip from below to above. The system is always in the market—exit and reverse at each flip. Most traders filter signals with trend direction from higher timeframe.',
      stopLoss: 'Use the SAR dot itself as your trailing stop. Dots automatically tighten as trend extends. Exit immediately if price touches/crosses the SAR level. For discretionary traders: confirm flip with additional indicator before reversing.',
      target: 'Hold until SAR flip occurs (built-in exit mechanism). The parabolic acceleration means stops tighten over time, automatically capturing profits. For partial exits: take some profit when dots visibly accelerate (curve steepens).'
    },
    bestContext: [
      'Trending markets with clear directional moves',
      'Trailing stop mechanism for position management',
      'Systematic/mechanical trading systems',
      'Higher timeframes (daily, weekly) for trend following',
      'Confirming trend direction from other indicators',
      'Forex majors and liquid markets with clean trends',
      'Swing trading with defined entry/exit rules',
      'Position trading in strong secular trends'
    ],
    commonMistakes: [
      'Using Parabolic SAR in choppy/ranging markets (constant whipsaws)',
      'Using default settings without market adaptation',
      'Ignoring higher timeframe trend when trading SAR flips',
      'Not understanding SAR is a always-in-market system',
      'Setting AF too high causing premature exits',
      'Using SAR for counter-trend trades (it\'s trend-following)',
      'Ignoring the acceleration mechanics (dots tighten over time)',
      'Not combining with volatility or trend filters'
    ],
    prosAndCons: {
      pros: [
        'Clear, visual trend identification (dots above/below)',
        'Built-in stop loss levels (dots as trailing stops)',
        'Automatic profit capture via acceleration',
        'Simple entry/exit rules (flip = signal)',
        'Works well in trending markets',
        'Objective, no subjective interpretation needed',
        'Acceleration feature captures trend exhaustion',
        'Created by proven market technician'
      ],
      cons: [
        'Terrible performance in sideways/choppy markets',
        'Frequent whipsaws during consolidation',
        'Always in market (can be exhausting without filter)',
        'Ignores support/resistance levels',
        'AF parameter optimization challenging',
        'Exits often too early in extended trends (acceleration)',
        'No consideration of volume or market structure',
        'Lagging by design (confirms after reversal starts)'
      ]
    },
    advancedTechniques: [
      'SAR + ADX Filter: Only take SAR signals when ADX > 25 (trending market). Ignore flips when ADX < 20 (ranging). Dramatically reduces whipsaws.',
      'Multi-timeframe SAR: Use weekly SAR for direction bias, daily SAR for entry timing. Only trade daily SAR flips in direction of weekly trend.',
      'SAR + Support/Resistance: Wait for SAR flip to occur at key support/resistance level. Confluence increases probability of successful signal.',
      'Modified AF Settings: Reduce starting AF to 0.01 for less sensitive system that catches bigger moves. Increase for faster exits in volatile markets.',
      'SAR Confirmation: Wait for two bars of price action confirming the flip before entering. First flip bar often retraces.',
      'SAR + Trailing ATR: Use SAR direction but set actual stop using 2× ATR from entry. Combines SAR\'s trend signal with more dynamic stop placement.'
    ]
  }
];

export const ParabolicSARVisualizer = () => (
  <IndicatorVisualizer
    title="Parabolic SAR Indicator Guide"
    subtitle="Master J. Welles Wilder's 'Stop and Reverse' system that provides clear trend signals and built-in trailing stops. Learn how the parabolic acceleration captures profits as trends mature and signals potential reversals."
    variants={PARABOLIC_SAR_VARIANTS}
    category="trend"
  />
);

export default ParabolicSARVisualizer;
