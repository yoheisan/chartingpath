import { IndicatorVisualizer, IndicatorVariant } from './IndicatorVisualizer';

const CCI_VARIANTS: IndicatorVariant[] = [
  {
    id: 'cci-indicator',
    name: 'Commodity Channel Index',
    indicatorType: 'cci',
    description: 'The Commodity Channel Index (CCI), developed by Donald Lambert in 1980, measures the current price level relative to an average price level over a specified period. Originally designed for commodities, CCI has become popular across all markets for identifying cyclical trends and extreme conditions. Unlike most oscillators bounded between 0-100, CCI is unbounded and can reach extreme values during strong trends, making it valuable for identifying both trend strength and potential reversal points.',
    origin: 'Created by Donald Lambert and introduced in Commodities magazine (now Futures) in 1980. Lambert designed CCI to identify cyclical turns in commodities, based on the theory that commodities move in cycles and that detecting when price deviates significantly from its mean can identify turning points. The indicator uses a constant of 0.015 to ensure approximately 70-80% of values fall within -100 to +100.',
    formula: `CCI Calculation:

Typical Price (TP):
TP = (High + Low + Close) / 3

Mean Deviation (MD):
MD = Average of |TP - SMA(TP, n)| over n periods

CCI = (TP - SMA(TP, n)) / (0.015 × MD)

Where:
- n = lookback period (typically 20)
- 0.015 = Lambert's constant for scaling
- SMA = Simple Moving Average

CCI is unbounded: can exceed ±200 in strong trends`,
    defaultSettings: 'Standard: 20 periods (Lambert\'s original). Short-term trading: 14 periods. Day trading: 10 periods. Key levels: +100 = overbought threshold, -100 = oversold threshold. Some traders use ±200 for extreme conditions.',
    interpretation: [
      'CCI > +100 = Overbought / Strong uptrend momentum',
      'CCI < -100 = Oversold / Strong downtrend momentum',
      'CCI crossing above +100 = Start of new uptrend (bullish entry)',
      'CCI crossing below -100 = Start of new downtrend (bearish entry)',
      'CCI between -100 and +100 = Normal/ranging market conditions',
      'CCI at extreme values (±200+) = Very strong trend or exhaustion',
      'Zero line crossover = Shift in momentum direction',
      'Divergence between CCI and price = Potential reversal warning',
      'CCI staying above +100 = Sustained bullish momentum (ride the trend)'
    ],
    signalTypes: [
      {
        type: 'bullish',
        name: 'Zero Line Cross Up',
        description: 'CCI crosses from negative to positive territory. Basic bullish signal indicating momentum shifting upward. Best when occurring at support levels.'
      },
      {
        type: 'bullish',
        name: '+100 Breakout',
        description: 'CCI breaks above +100, indicating strong bullish momentum establishing. Lambert\'s original bullish signal for trend trading.'
      },
      {
        type: 'bearish',
        name: 'Zero Line Cross Down',
        description: 'CCI crosses from positive to negative territory. Basic bearish signal indicating momentum shifting downward. Best at resistance levels.'
      },
      {
        type: 'bearish',
        name: '-100 Breakdown',
        description: 'CCI breaks below -100, indicating strong bearish momentum establishing. Lambert\'s original bearish signal for shorting.'
      },
      {
        type: 'neutral',
        name: 'Divergence',
        description: 'Price and CCI move in opposite directions. Bullish divergence at -100 or bearish divergence at +100 warns of potential trend exhaustion.'
      }
    ],
    tradingRules: {
      entry: 'Lambert\'s Method: Enter LONG when CCI rises above +100 (new uptrend starting). Enter SHORT when CCI falls below -100 (new downtrend starting). Alternative (mean reversion): Buy at -100, sell at +100 for range-bound markets. Zero-line crossover method for faster signals.',
      stopLoss: 'For trend trades (+100/-100 breaks): Stop at recent swing low/high before the signal. For mean reversion trades: Stop if CCI makes new extreme beyond entry level. Consider ATR-based stops for volatility adjustment.',
      target: 'Trend trades: Ride until CCI crosses back below +100 (or above -100 for shorts). Mean reversion: Target zero line or opposite extreme. Many traders use partial exits at zero line, remainder at opposite zone.'
    },
    bestContext: [
      'Cyclical markets (commodities, seasonal stocks)',
      'Trending markets for +100/-100 breakout trading',
      'Range-bound markets for mean reversion at extremes',
      'Identifying the start of new trends after consolidation',
      'Divergence analysis at key support/resistance',
      'Confirming breakouts with momentum',
      'Swing trading on daily timeframe',
      'Combined with trend indicators (MA, ADX) for context'
    ],
    commonMistakes: [
      'Treating +100/-100 as automatic reversal levels (trends can persist)',
      'Using CCI in isolation without trend context',
      'Ignoring divergences which are powerful signals',
      'Not understanding CCI is unbounded (can exceed ±300 in strong trends)',
      'Using the same strategy in trending and ranging markets',
      'Trading every zero-line cross (many false signals in chop)',
      'Setting stops too tight when CCI at extremes',
      'Confusing CCI with bounded oscillators like RSI'
    ],
    prosAndCons: {
      pros: [
        'Unbounded nature captures strong trends other oscillators miss',
        'Works for both trend-following and mean reversion strategies',
        'Clear thresholds (+100/-100) simplify interpretation',
        'Effective at identifying cyclical turning points',
        'Good at confirming breakouts and momentum',
        'Zero line provides additional signal',
        'Divergences reliable at extremes',
        'Works across all markets despite "commodity" in name'
      ],
      cons: [
        'Can stay overbought/oversold for extended periods',
        'Zero line crossovers can whipsaw in choppy markets',
        'Unbounded nature can make extreme readings ambiguous',
        'Requires understanding of market context (trending vs ranging)',
        'Constant 0.015 is somewhat arbitrary',
        'Less familiar to traders than RSI/MACD',
        'Mean deviation calculation more complex than simple MA',
        'Signals can lag at trend changes'
      ]
    },
    advancedTechniques: [
      'CCI + MA Trend Filter: Only take long CCI signals when price > 50 EMA, short signals when price < 50 EMA. Filters many false signals.',
      'Dual CCI System: Use 14-period CCI for entry signals, 50-period CCI for trend direction. Trade when both align.',
      'CCI Divergence + Price Action: Combine CCI divergence with candlestick patterns at support/resistance for high-probability reversals.',
      'CCI Turnaround Strategy: After extreme reading (±200), wait for CCI to cross back through ±100 threshold = exhaustion reversal signal.',
      'Zero Line Rejection: CCI approaches zero line but fails to cross and reverses = continuation signal in direction of prior trend.',
      'Multi-timeframe CCI: Weekly CCI for bias direction, daily CCI for entry timing. Only trade when weekly and daily CCI signals align.'
    ]
  }
];

export const CCIVisualizer = () => (
  <IndicatorVisualizer
    title="CCI: Commodity Channel Index Guide"
    subtitle="Master Donald Lambert's unbounded momentum oscillator for identifying cyclical trends and extreme market conditions. Learn to use CCI's unique properties for both trend-following and mean reversion strategies."
    variants={CCI_VARIANTS}
    category="momentum"
  />
);

export default CCIVisualizer;
