import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const KICKER_VARIANTS: PatternVariant[] = [
  {
    id: 'bullish',
    name: 'Bullish Kicker',
    patternKey: 'kicker-bullish',
    bias: 'bullish',
    accuracy: '87%',
    description: 'The Bullish Kicker is one of the most powerful and reliable candlestick reversal patterns in technical analysis. A bearish candle is followed by a bullish candle that gaps ABOVE the previous candle\'s open—not just above the close, but above the OPEN—completely negating all prior selling. Studies show 82-92% reliability, making it among the highest-probability setups. The pattern typically follows major news, earnings surprises, or dramatic sentiment shifts.',
    formation: 'Two candles: (1) A bearish candle confirming the current downward pressure. (2) A bullish candle that opens with a gap ABOVE the first candle\'s OPEN (not just its close) and closes strongly bullish. The key distinction: the gap must clear the previous candle\'s opening price, creating a "kick" that invalidates all selling.',
    psychology: 'Something dramatic changed overnight or during the gap period. The gap above the previous open shows that buyers are so confident they\'re willing to pay significantly more than where sellers even started the prior session. This often follows earnings beats, positive guidance, acquisitions, or FDA approvals. The conviction is so strong that normal market dynamics are overwhelmed.',
    keyCharacteristics: [
      'Gap up opens ABOVE the prior candle\'s OPEN (critical distinction)',
      'Not just above the close—must clear the open price',
      'Both candles have substantial bodies (conviction)',
      'The gap should not be filled intraday (remains open)',
      'Often follows major news, earnings, or catalyst',
      'One of highest accuracy patterns (87%+ historical)',
      'Very rare pattern—don\'t see often',
      'Typically leads to extended multi-day moves'
    ],
    tradingRules: {
      entry: 'Given the high reliability, entry options include: (1) Immediately on pattern recognition, (2) On any pullback toward the gap (often fills partially), (3) On break above day 2\'s high. Speed matters—high-conviction pattern.',
      stopLoss: 'Below the gap (below second candle\'s open). If the gap fills completely, the pattern has failed. Some traders use tighter stops at 50% of the gap.',
      target: 'Extended targets justified due to high reliability—3:1 R/R or higher. Let winners run with trailing stops. Kicker patterns often start multi-day moves.'
    },
    bestContext: [
      'After unexpected positive news or earnings beat',
      'Following market-moving announcements (M&A, FDA approval)',
      'When sentiment shifts dramatically overnight',
      'At major inflection points in the business cycle',
      'After capitulation selling (recovery catalyst)',
      'When gap is large and decisive (not marginal)',
      'With above-average volume on gap day',
      'Sector or market-wide bullish catalysts'
    ],
    commonMistakes: [
      'Confusing with regular gap up (MUST clear previous open)',
      'Trading false kickers where gap fills quickly intraday',
      'Not sizing position appropriately for high-conviction pattern',
      'Ignoring pattern in choppy/ranging markets (need trend context)',
      'Expecting kickers frequently (they\'re rare events)',
      'Not verifying the gap remains unfilled',
      'Using same risk as lower-probability patterns',
      'Missing the pattern by waiting too long'
    ]
  },
  {
    id: 'bearish',
    name: 'Bearish Kicker',
    patternKey: 'kicker-bearish',
    bias: 'bearish',
    accuracy: '87%',
    description: 'The Bearish Kicker is the mirror image of the Bullish Kicker—equally powerful and reliable. A bullish candle is followed by a bearish candle that gaps BELOW the previous candle\'s open, completely negating all prior buying. This pattern typically follows earnings misses, negative guidance, or shocking news that fundamentally changes the outlook. At 82-92% reliability, it\'s among the most actionable bearish signals.',
    formation: 'Two candles: (1) A bullish candle confirming the current upward pressure. (2) A bearish candle that opens with a gap BELOW the first candle\'s OPEN (not just its close) and closes strongly bearish. The gap must clear the previous candle\'s opening price downward.',
    psychology: 'Something dramatic changed overnight. The gap below the previous open shows that sellers are so panicked they\'re willing to sell at significantly less than where buyers even started the prior session. This often follows earnings misses, guidance cuts, competitive threats, or regulatory issues. Longs are trapped and must sell into weakness.',
    keyCharacteristics: [
      'Gap down opens BELOW the prior candle\'s OPEN (critical)',
      'Not just below the close—must clear the open price',
      'Both candles have substantial bodies (conviction)',
      'The gap should not be filled intraday (remains open)',
      'Often follows major negative news or catalyst',
      'One of highest accuracy patterns (87%+ historical)',
      'Very rare pattern—don\'t force identification',
      'Typically leads to extended multi-day declines'
    ],
    tradingRules: {
      entry: 'Given high reliability: (1) Enter short immediately on recognition, (2) On any bounce toward the gap (often partially fills), (3) On break below day 2\'s low. Don\'t wait too long—pattern is actionable.',
      stopLoss: 'Above the gap (above second candle\'s open). If the gap fills completely, the pattern has failed. Tight stops above 50% of gap are common.',
      target: 'Extended targets justified—3:1 R/R or higher. Kickers often start multi-day moves. Trail stops as position moves in your favor.'
    },
    bestContext: [
      'After unexpected negative news or earnings miss',
      'Following market-moving negative announcements',
      'When sentiment shifts dramatically overnight',
      'At major distribution tops',
      'Following euphoric buying (reality check catalyst)',
      'When gap is large and decisive',
      'With above-average volume on gap day',
      'Sector or market-wide bearish catalysts'
    ],
    commonMistakes: [
      'Confusing with regular gap down (MUST clear previous open)',
      'Trading false kickers where gap fills quickly',
      'Not sizing appropriately for high-conviction setup',
      'Ignoring pattern in choppy markets (need context)',
      'Expecting kickers frequently (rare events)',
      'Not verifying gap remains unfilled through session',
      'Using overly conservative targets',
      'Hesitating due to fear of catching falling knife'
    ]
  }
];

export const KickerPatternVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Kicker Pattern Visual Guide"
    subtitle="Master this rare but highly reliable reversal pattern with 87%+ historical accuracy—one of the strongest signals in candlestick analysis. The key: the gap must clear the previous candle's OPEN, not just its close."
    variants={KICKER_VARIANTS}
  />
);

export default KickerPatternVisualizer;
