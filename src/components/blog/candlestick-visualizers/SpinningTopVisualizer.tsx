import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const SPINNING_TOP_VARIANTS: PatternVariant[] = [
  {
    id: 'spinning-top',
    name: 'Spinning Top',
    patternKey: 'spinning-top',
    bias: 'neutral',
    accuracy: '62%',
    description: 'The Spinning Top is a single-candle indecision pattern characterized by a small body with long shadows on both sides. Unlike the Doji where open and close are nearly equal, the Spinning Top has a visible (though small) body. Japanese traders identified this pattern as representing the battle between bulls and bears ending in a draw—the long shadows show both sides had control at different times. This pattern signals market uncertainty and often precedes trend changes.',
    formation: 'A single candle with: (1) A small real body (open and close are close but not equal), (2) Long upper shadow extending above the body, (3) Long lower shadow extending below the body. The shadows should be at least 2x the body length on each side. The body can be green or red—color matters less than structure.',
    psychology: 'During the session, bulls and bears took turns controlling price. The upper shadow shows bulls pushed higher; the lower shadow shows bears pushed lower. However, by the close, neither side had achieved decisive victory—price ended near where it started. This tug-of-war signals that conviction is lacking. Following strong trends, spinning tops often precede reversals or consolidation.',
    keyCharacteristics: [
      'Small body relative to the shadows (body is <25% of total range)',
      'Long upper and lower shadows (2x+ body length each)',
      'Can be either green (bullish) or red (bearish)',
      'Body slightly larger than a Doji (visible difference)',
      'Shows indecision, not commitment to a direction',
      'More meaningful after extended trends',
      'Volume often decreases (lack of conviction)',
      'Indicates potential trend pause or reversal'
    ],
    tradingRules: {
      entry: 'Do NOT trade spinning tops directly—wait for confirmation candle in either direction. Bullish: If next candle closes above spinning top high, consider long. Bearish: If next candle closes below spinning top low, consider short.',
      stopLoss: 'Place stop beyond the opposite side of the spinning top. For bullish follow-through: stop below spinning top low. For bearish: stop above spinning top high. Wide stops required.',
      target: 'Target: Previous swing high/low based on breakout direction. Use measured move equal to spinning top\'s range. Risk management critical on neutral patterns.'
    },
    bestContext: [
      'After extended trends (potential reversal warning)',
      'At key support/resistance levels',
      'Before major news events or earnings',
      'When combined with other technical signals (divergence)',
      'During periods of market uncertainty',
      'At confluence zones (multiple S/R levels meeting)',
      'Following parabolic moves (exhaustion signal)',
      'When volume is declining (momentum loss)'
    ],
    commonMistakes: [
      'Trading spinning tops without waiting for confirmation',
      'Confusing with strong trend candles (body too large)',
      'Ignoring the context (trend, support/resistance levels)',
      'Over-trading neutral patterns (lower probability setup)',
      'Expecting immediate direction (pattern shows indecision)',
      'Using spinning tops in choppy/ranging markets (no signal)',
      'Setting stops too tight given pattern\'s range',
      'Treating spinning top as bullish or bearish (it\'s neutral)'
    ]
  },
  {
    id: 'high-wave',
    name: 'High Wave Candle',
    patternKey: 'spinning-top',
    bias: 'neutral',
    accuracy: '62%',
    description: 'The High Wave Candle is an extreme version of the Spinning Top with exceptionally long upper and lower shadows. This pattern indicates maximum market indecision and volatility—both bulls and bears made strong moves but neither prevailed. High Wave candles often appear at major turning points and frequently precede significant trend changes. The extreme shadows represent intense battle between opposing forces.',
    formation: 'Similar to Spinning Top but with even more extreme characteristics: (1) Very small body (doji-like), (2) Very long upper shadow (3x+ body length), (3) Very long lower shadow (3x+ body length). The total range is much larger than a normal candle, showing extreme volatility.',
    psychology: 'High Wave candles represent maximum uncertainty. The extreme range shows that significant forces pushed price in both directions—likely institutional-level activity. Neither bulls nor bears could maintain control. After trending markets, this extreme indecision often signals that a major shift is imminent. Smart traders wait for the market to "show its hand" with a confirmation candle.',
    keyCharacteristics: [
      'Extremely long shadows in both directions (3x+ body)',
      'Very small body (approaching doji)',
      'High volume often accompanies the pattern',
      'Shows intense volatility and indecision',
      'More significant than regular spinning top',
      'Often appears at major market turning points',
      'Represents institutional-level uncertainty',
      'Frequently precedes major moves in either direction'
    ],
    tradingRules: {
      entry: 'Wait for breakout above high or below low. Enter with confirmation candle in breakout direction. Do NOT predict direction—let price show you.',
      stopLoss: 'Opposite extreme of the High Wave candle. These will be wide stops—adjust position size accordingly. Accept that the pattern requires larger risk.',
      target: 'Measured move equal to the High Wave\'s full range. These setups can produce significant moves given the preceding volatility/indecision.'
    },
    bestContext: [
      'After extended trends showing exhaustion',
      'Before major news events or earnings',
      'At major confluence zones (multiple levels meeting)',
      'During market uncertainty (Fed meetings, elections)',
      'At all-time highs or multi-year lows',
      'When volume spikes significantly',
      'Following gap moves (showing indecision after gap)',
      'At major psychological levels (round numbers)'
    ],
    commonMistakes: [
      'Picking a direction without confirmation',
      'Underestimating the volatility that may follow',
      'Not widening stops for the increased range',
      'Trading the pattern too aggressively',
      'Ignoring that high wave often precedes major moves',
      'Using normal position sizes (need to reduce for wide stops)',
      'Expecting immediate resolution (may consolidate further)',
      'Treating as directional when it\'s purely neutral'
    ]
  }
];

export const SpinningTopVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Spinning Top & High Wave Visual Guide"
    subtitle="Understand these neutral indecision patterns signaling market uncertainty. When neither bulls nor bears prevail, these patterns often precede significant trend changes—wait for confirmation before acting."
    variants={SPINNING_TOP_VARIANTS}
  />
);

export default SpinningTopVisualizer;
