import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const ENGULFING_VARIANTS: PatternVariant[] = [
  {
    id: 'bullish',
    name: 'Bullish Engulfing',
    patternKey: 'bullish-engulfing',
    bias: 'bullish',
    accuracy: '75%',
    description: 'The Bullish Engulfing is a two-candle reversal pattern with Japanese origins dating to 18th-century rice trading. The term describes how the second candle\'s body completely "engulfs" or swallows the first, signaling a dramatic shift from seller to buyer control. Studies show this pattern has approximately 63-79% reliability when appearing at key support levels with volume confirmation.',
    formation: 'First, a bearish (red) candle forms during an established downtrend of at least 3-5 candles. The next session opens below the prior close (gap down in some markets), then rallies strongly to close above the previous open—completely engulfing the prior body. The wicks do NOT need to be engulfed; only the real body matters for pattern validity.',
    psychology: 'The first candle confirms continued selling pressure. The second candle reveals a dramatic sentiment shift: buyers absorbed all selling at lower prices, then overwhelmed sellers so completely that they erased all losses and closed at new highs. This "absorption" of selling is why institutional traders watch this pattern closely at support. The larger the second candle relative to the first, the stronger the conviction signal.',
    keyCharacteristics: [
      'Must appear after a clear downtrend (minimum 3-5 red candles)',
      'Second candle body FULLY engulfs first candle body (wicks don\'t count)',
      'Gap down open on second candle adds strength (common in stocks, less in forex)',
      'Higher volume on the engulfing candle is critical confirmation',
      'The larger the engulfing candle, the stronger the reversal signal',
      'Green engulfing candle is stronger than red (close > open)',
      'Pattern at key support level dramatically increases reliability',
      'RSI divergence or oversold reading adds confluence'
    ],
    tradingRules: {
      entry: 'Conservative: Enter on break above engulfing high with confirmation. Aggressive: Enter at close of engulfing candle. Filter: Require volume spike >1.5x average.',
      stopLoss: 'Place stop below the low of the engulfing pattern (including wicks). This is the invalidation level—if price falls below, the pattern has failed.',
      target: 'Initial target: Previous swing high or 1:1 risk-reward. Extended target: Next major resistance or 2:1 R/R. Use trailing stop after 1R achieved.'
    },
    bestContext: [
      'At established support levels (horizontal, trendline, or moving average)',
      'After extended downtrends showing exhaustion (5+ consecutive red candles)',
      'Near major moving average support (20/50/200 EMA bounce)',
      'At oversold RSI levels (<30) with bullish divergence forming',
      'At Fibonacci retracement levels (61.8%, 78.6%)',
      'When VIX is elevated (fear-based selling often reverses)'
    ],
    commonMistakes: [
      'Trading engulfing patterns in sideways/ranging markets (low reliability)',
      'Ignoring the prior trend requirement—pattern needs context',
      'Setting stops too tight (must be below entire pattern low)',
      'Not waiting for candle close—premature entry on incomplete patterns',
      'Ignoring volume—weak volume engulfing patterns often fail',
      'Trading against the larger timeframe trend direction',
      'Confusing with "nearly engulfing" patterns that don\'t fully engulf'
    ]
  },
  {
    id: 'bearish',
    name: 'Bearish Engulfing',
    patternKey: 'bearish-engulfing',
    bias: 'bearish',
    accuracy: '72%',
    description: 'The Bearish Engulfing is the mirror image of its bullish counterpart—a two-candle reversal pattern where sellers completely overwhelm buyers. Originating from Japanese candlestick analysis, this pattern signals institutional distribution and potential trend reversal. Research indicates 60-74% reliability at resistance levels with volume confirmation.',
    formation: 'First, a bullish (green) candle forms during an established uptrend of at least 3-5 candles. The next session opens above the prior close (gap up in some markets), then sells off aggressively to close below the previous open—completely engulfing the prior body. This dramatic reversal within a single session signals distribution.',
    psychology: 'The first candle shows continued buying confidence. The second candle reveals a violent sentiment shift: early buyers become trapped as sellers flood the market. The gap up open attracts late buyers who then become "bag holders" as price reverses. This trapping of longs is why the pattern is so powerful—those trapped longs become future sellers.',
    keyCharacteristics: [
      'Must appear after a clear uptrend (minimum 3-5 green candles)',
      'Second candle body FULLY engulfs first candle body (wicks irrelevant)',
      'Gap up open on second candle traps late buyers (increases power)',
      'Higher volume on the engulfing candle confirms distribution',
      'The larger the engulfing candle, the stronger the reversal signal',
      'Red engulfing candle is stronger than green (close < open)',
      'Pattern at key resistance level increases reliability significantly',
      'RSI divergence or overbought reading (>70) adds confluence'
    ],
    tradingRules: {
      entry: 'Conservative: Enter short on break below engulfing low with confirmation. Aggressive: Enter at close of engulfing candle. Filter: Require volume spike >1.5x average.',
      stopLoss: 'Place stop above the high of the engulfing pattern (including wicks). This is the invalidation level—if price exceeds this, the pattern has failed.',
      target: 'Initial target: Previous swing low or 1:1 risk-reward. Extended target: Next major support or 2:1 R/R. Scale out at 1R, let remainder run.'
    },
    bestContext: [
      'At established resistance levels (horizontal, trendline, or MA)',
      'After extended uptrends showing exhaustion (5+ consecutive green candles)',
      'Near major moving average resistance (price rejecting 20/50/200 EMA)',
      'At overbought RSI levels (>70) with bearish divergence forming',
      'At Fibonacci extension levels (127.2%, 161.8%)',
      'Following parabolic moves or blow-off tops'
    ],
    commonMistakes: [
      'Shorting engulfing patterns in strong bullish trends (fighting momentum)',
      'Ignoring the prior trend requirement—no uptrend = no reversal pattern',
      'Setting stops too tight (must be above entire pattern high)',
      'Trading against major trend direction on higher timeframes',
      'Not confirming with volume analysis—volume validates conviction',
      'Entering during news events when volatility distorts patterns',
      'Mistaking consolidation engulfing for reversal engulfing'
    ]
  }
];

export const EngulfingPatternVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Engulfing Pattern Visual Guide"
    subtitle="Master the powerful two-candle reversal signals that mark major turning points. Originating from 18th-century Japanese rice trading, engulfing patterns remain among the most reliable candlestick formations when traded with proper context and confirmation."
    variants={ENGULFING_VARIANTS}
  />
);

export default EngulfingPatternVisualizer;
