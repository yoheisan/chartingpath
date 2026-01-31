import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const PIERCING_DARK_CLOUD_VARIANTS: PatternVariant[] = [
  {
    id: 'piercing',
    name: 'Piercing Line',
    patternKey: 'piercing-line',
    bias: 'bullish',
    accuracy: '64%',
    description: 'The Piercing Line is a two-candle bullish reversal pattern that forms after a downtrend. The second bullish candle "pierces" into the body of the first bearish candle, closing above its midpoint. Similar to but weaker than the Bullish Engulfing, this pattern shows significant buying absorption of selling pressure. Japanese traders valued the pattern for showing buyers stepping in at lower levels and reversing most of the prior damage.',
    formation: 'Two candles: (1) A long bearish candle confirming the downtrend. (2) A bullish candle that opens below the first candle\'s low (gap down) and closes above the midpoint (50%+) of the first candle\'s body. The deeper the penetration, the stronger the signal—70% penetration is more reliable than 50%.',
    psychology: 'The gap down opening triggers panic and capitulation—weak hands sell at the lows. However, buyers absorb this selling and push prices significantly higher throughout the session. The close above the first candle\'s midpoint shows that buyers have reversed most of the previous day\'s damage. The deeper the close into the first candle, the more decisive the reversal.',
    keyCharacteristics: [
      'First candle is a long bearish candle (confirms downtrend)',
      'Second candle gaps down below first\'s low (opening gap)',
      'Second candle closes above 50% of first candle\'s body',
      'Deeper penetration (60-70%) = significantly stronger signal',
      'Must appear after established downtrend',
      'Similar to but weaker than Bullish Engulfing',
      'Gap down open is important (not just open below close)',
      'Volume should be high on the second (piercing) candle'
    ],
    tradingRules: {
      entry: 'Conservative: Wait for confirmation candle above piercing high. Aggressive: Enter at piercing candle close if penetration >60%. Filter: Require high volume on second candle and support level context.',
      stopLoss: 'Place stop below the low of the pattern (second candle\'s gap low). This is the capitulation point—if broken, the pattern has failed completely.',
      target: 'Target 1: Previous swing high or nearest resistance. Target 2: 38.2% Fibonacci retracement of prior downtrend. Adjust expectations for moderate pattern accuracy.'
    },
    bestContext: [
      'At key horizontal support levels',
      'After 3+ consecutive red candles (trend context)',
      'When second candle has high volume (conviction)',
      'At oversold RSI levels (<30)',
      'At Fibonacci retracement support (61.8%, 78.6%)',
      'When penetration is >60% (not barely 50%)',
      'Near major moving average support',
      'Following capitulation gap down'
    ],
    commonMistakes: [
      'Trading when close is barely above 50% (weak signal)',
      'Ignoring the prior downtrend requirement',
      'Not waiting for confirmation candle (optional but recommended)',
      'Confusing with weak inside bar patterns',
      'Ignoring that gap down open is part of the criteria',
      'Expecting engulfing-level reliability (piercing is weaker)',
      'Trading without volume confirmation',
      'Setting stops too tight above the gap low'
    ]
  },
  {
    id: 'dark-cloud',
    name: 'Dark Cloud Cover',
    patternKey: 'dark-cloud-cover',
    bias: 'bearish',
    accuracy: '60%',
    description: 'Dark Cloud Cover is a two-candle bearish reversal pattern that forms after an uptrend. The bearish second candle "covers" the first bullish candle like a dark cloud, opening above the high and closing below the midpoint. Japanese traders saw this as an omen—a dark cloud obscuring the bullish sun. It\'s the bearish counterpart to the Piercing Line, though slightly less reliable.',
    formation: 'Two candles: (1) A long bullish candle confirming the uptrend. (2) A bearish candle that opens above the first candle\'s high (gap up) and closes below the midpoint (50%+) of the first candle\'s body. Deeper penetration signals stronger reversal conviction.',
    psychology: 'The gap up opening attracts late buyers chasing the trend—they buy at the highs expecting continuation. However, sellers overwhelm them and push prices significantly lower throughout the session. Those who bought the gap become trapped and will sell on any bounce, adding to future selling pressure. The close below the midpoint shows distribution is underway.',
    keyCharacteristics: [
      'First candle is a long bullish candle (confirms uptrend)',
      'Second candle gaps up above first\'s high (opening gap)',
      'Second candle closes below 50% of first candle\'s body',
      'Deeper penetration (60-70%) = significantly stronger signal',
      'Must appear after established uptrend',
      'Similar to but weaker than Bearish Engulfing',
      'Gap up open traps late buyers (psychological component)',
      'Volume spike on second candle confirms distribution'
    ],
    tradingRules: {
      entry: 'Conservative: Wait for confirmation candle below dark cloud low. Aggressive: Enter at dark cloud close if penetration >60% and at resistance. Volume spike adds confidence.',
      stopLoss: 'Place stop above the high of the pattern (second candle\'s gap high). This is where longs were trapped—if exceeded, buyers remain in control.',
      target: 'Target 1: Previous swing low or nearest support. Target 2: 38.2% Fibonacci retracement of prior uptrend. Consider the pattern\'s moderate reliability in sizing.'
    },
    bestContext: [
      'At key resistance levels',
      'After 3+ consecutive green candles (trend context)',
      'When second candle has high volume (distribution)',
      'At overbought RSI levels (>70)',
      'At Fibonacci extension levels (127.2%, 161.8%)',
      'When penetration is >60% (stronger than 50%)',
      'Near major moving average resistance',
      'Following extended or parabolic moves'
    ],
    commonMistakes: [
      'Shorting when close is barely below 50% (weak signal)',
      'Ignoring prior uptrend requirement',
      'Not waiting for confirmation in strong trends',
      'Trading against strong momentum without patience',
      'Ignoring that gap up is part of pattern criteria',
      'Expecting high accuracy (60% is moderate)',
      'Aggressive sizing on a lower-probability pattern',
      'Not checking for nearby support that might hold'
    ]
  }
];

export const PiercingLineVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Piercing Line Pattern Guide"
    subtitle="Learn this bullish reversal pattern where buyers absorb gap-down selling and push prices back above the prior candle's midpoint—a sign of potential trend reversal."
    variants={[PIERCING_DARK_CLOUD_VARIANTS[0]]}
  />
);

export const DarkCloudCoverVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Dark Cloud Cover Pattern Guide"
    subtitle="Master this bearish reversal pattern where sellers overwhelm gap-up buyers—the 'dark cloud' covering the bullish sun signals potential distribution and reversal."
    variants={[PIERCING_DARK_CLOUD_VARIANTS[1]]}
  />
);

export const PiercingDarkCloudVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Piercing Line & Dark Cloud Cover Guide"
    subtitle="Master these complementary two-candle reversal patterns. The Piercing Line shows bullish absorption at lows while Dark Cloud Cover signals bearish distribution at highs."
    variants={PIERCING_DARK_CLOUD_VARIANTS}
  />
);

export default PiercingDarkCloudVisualizer;
