import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const HAMMER_VARIANTS: PatternVariant[] = [
  {
    id: 'hammer',
    name: 'Hammer',
    patternKey: 'hammer',
    bias: 'bullish',
    accuracy: '70%',
    description: 'The Hammer is a single-candle bullish reversal pattern that forms at the bottom of downtrends. Named for its distinctive shape resembling a hammer, this pattern originated in Japanese candlestick analysis (called "takuri" meaning "trying to gauge depth"). The long lower shadow demonstrates that sellers pushed prices significantly lower during the session, but buyers absorbed all selling and rallied prices back near the open—a powerful display of buying pressure at key levels.',
    formation: 'A single candle with: (1) a small real body located at the upper end of the trading range, (2) a long lower shadow at least 2x the body length (3-5x is ideal), and (3) little to no upper shadow. The body can be green or red, though a green body (close > open) is considered more bullish. The pattern MUST appear after an established downtrend.',
    psychology: 'During the session, bears pushed prices aggressively lower—often triggering stop-loss orders from existing longs. However, at these lower levels, buyers stepped in decisively. The subsequent rally back to the open demonstrates that buying pressure has overwhelmed selling pressure. The longer the lower shadow, the more dramatic the rejection of lower prices and the stronger the bullish conviction.',
    keyCharacteristics: [
      'Small body at the top of the candle range',
      'Lower shadow at least 2x the body length (ideal: 3-5x)',
      'Little or no upper shadow (shadow should be <5% of total range)',
      'Must appear after a downtrend (minimum 3+ red candles)',
      'Green hammer (close > open) is more bullish than red hammer',
      'Volume spike on hammer adds significant confirmation',
      'Gap down open followed by rally increases pattern strength',
      'Most effective at prior support levels or round numbers'
    ],
    tradingRules: {
      entry: 'Step 1: Identify hammer at support. Step 2: Wait for bullish confirmation candle (closes above hammer high). Step 3: Enter at confirmation close or next bar open. Aggressive: Enter at hammer close if green body + high volume.',
      stopLoss: 'Place stop below the low of the hammer\'s shadow. This is your invalidation—if price breaks below, the buying pressure wasn\'t strong enough. Allow for spread + volatility buffer.',
      target: 'Target 1: Previous swing high or nearest resistance (1:1 R/R minimum). Target 2: Next major resistance level (2:1 R/R). Use position sizing that allows holding to Target 2 if momentum continues.'
    },
    bestContext: [
      'At established horizontal support levels',
      'After 3+ consecutive red candles (downtrend exhaustion)',
      'Near major moving average support (20/50/200 EMA bounce)',
      'At round number psychological support ($100, $50, etc.)',
      'At oversold RSI levels (<30) with bullish divergence',
      'At Fibonacci retracement levels (50%, 61.8%, 78.6%)',
      'Following high-volume capitulation selling',
      'When VIX is elevated (fear often reverses)'
    ],
    commonMistakes: [
      'Trading hammer without waiting for confirmation candle',
      'Ignoring the trend context (must be downtrend pattern)',
      'Confusing with Hanging Man (identical shape but appears in uptrend)',
      'Setting stops too close to hammer low (need volatility buffer)',
      'Trading small-body hammers (body should be clearly defined)',
      'Ignoring volume—weak volume hammers often fail',
      'Mistaking normal pullback candle for reversal hammer'
    ]
  },
  {
    id: 'hanging-man',
    name: 'Hanging Man',
    patternKey: 'hanging-man',
    bias: 'bearish',
    accuracy: '59%',
    description: 'The Hanging Man is a bearish warning signal that appears at the TOP of an uptrend. Despite looking identical to a Hammer, its appearance after an uptrend gives it the opposite meaning. The Japanese name suggests a man being hanged—an ominous sign. The long lower shadow reveals that sellers mounted a significant intraday attack; although buyers recovered, the selling pressure is a warning that distribution may be occurring.',
    formation: 'A single candle with: (1) a small real body at the upper end of the trading range, (2) a long lower shadow at least 2x the body length, and (3) little to no upper shadow. Must appear after an established uptrend. The key difference from a Hammer is CONTEXT—identical shape, opposite meaning.',
    psychology: 'During the uptrend, bulls were in control. The Hanging Man reveals cracks in that control: sellers were able to push prices significantly lower during the session. Although buyers managed to recover, the mere fact that such selling pressure emerged is a warning. Smart money may be distributing to retail buyers. The pattern requires bearish confirmation to validate the reversal.',
    keyCharacteristics: [
      'Identical shape to Hammer (small body, long lower shadow)',
      'Must appear after an uptrend—this is what makes it bearish',
      'Red hanging man is more bearish than green',
      'Requires confirmation (next candle must close lower)',
      'More reliable at resistance levels',
      'Gap up open followed by selloff increases warning strength',
      'Volume spike on hanging man suggests distribution',
      'Often appears after extended parabolic moves'
    ],
    tradingRules: {
      entry: 'Wait for bearish confirmation: next candle must close below hanging man low. Entry: at confirmation close or next bar open. Never short hanging man without confirmation—pattern often fails.',
      stopLoss: 'Place stop above the high of the hanging man (including any upper wick). The high represents the failure point—if exceeded, bulls remain in control.',
      target: 'Target 1: Previous swing low or nearest support (1:1 R/R). Target 2: 20/50 EMA if price is extended above. Be prepared for lower success rate than Hammer pattern.'
    },
    bestContext: [
      'At established resistance levels',
      'After extended uptrend (5+ consecutive green candles)',
      'Near round number resistance ($100, $150, etc.)',
      'At overbought RSI levels (>70) with bearish divergence',
      'Following parabolic or blow-off moves',
      'At prior all-time high or significant peak',
      'When put/call ratio is very low (complacency)',
      'Near Fibonacci extension levels (127.2%, 161.8%)'
    ],
    commonMistakes: [
      'Shorting without bearish confirmation candle (lower success rate)',
      'Confusing with Hammer (context matters—uptrend vs downtrend)',
      'Ignoring strong bullish momentum when fighting the trend',
      'Not considering the overall market trend',
      'Over-relying on pattern (59% accuracy requires strict risk management)',
      'Ignoring that pattern often fails in strong uptrends',
      'Setting stops too tight given pattern\'s lower reliability'
    ]
  }
];

export const HammerPatternVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Hammer & Hanging Man Visual Guide"
    subtitle="Master these single-candle patterns that signal potential reversals at market extremes. The Hammer (called 'takuri' in Japanese) forms at lows while the Hanging Man warns of potential tops—same shape, opposite contexts, different outcomes."
    variants={HAMMER_VARIANTS}
  />
);

export default HammerPatternVisualizer;
