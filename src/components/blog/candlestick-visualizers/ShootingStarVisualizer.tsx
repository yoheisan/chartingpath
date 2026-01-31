import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const SHOOTING_STAR_VARIANTS: PatternVariant[] = [
  {
    id: 'shooting-star',
    name: 'Shooting Star',
    patternKey: 'shooting-star',
    bias: 'bearish',
    accuracy: '68%',
    description: 'The Shooting Star is a single-candle bearish reversal pattern that forms at the top of uptrends. Named for its resemblance to a shooting star falling from the sky, the long upper shadow represents a failed attempt to reach higher prices—bulls pushed up aggressively but were rejected by sellers who drove prices back down. Japanese traders called this "nagare boshi" (shooting star). Studies show 62-74% reliability at resistance with confirmation.',
    formation: 'A single candle with: (1) A small real body at the LOWER end of the trading range, (2) A long upper shadow at least 2x the body length (ideal: 3x+), (3) Little to no lower shadow. The body can be green or red, though a red body is more bearish. The pattern MUST appear after an established uptrend to be valid.',
    psychology: 'During the session, bulls pushed prices to new highs—often triggering breakout buyers and stop-loss orders. However, at these elevated levels, sellers emerged in force and pushed prices all the way back down near the open. The long upper shadow represents trapped buyers who purchased at the highs—these traders will become sellers when they cut losses, adding to downside pressure.',
    keyCharacteristics: [
      'Small body at the BOTTOM of the candle range',
      'Upper shadow at least 2x body length (3x+ is stronger)',
      'Little or no lower shadow (<10% of range)',
      'Must appear after uptrend (context is critical)',
      'Red body is more bearish than green body',
      'Gap up from prior candle increases pattern strength',
      'Requires confirmation candle to validate reversal',
      'Most effective at resistance levels and round numbers'
    ],
    tradingRules: {
      entry: 'Wait for bearish confirmation: next candle closes below shooting star low. Entry: At confirmation close or on break of shooting star low. Never short shooting star without confirmation—bulls may resume.',
      stopLoss: 'Place stop above the high of the shooting star\'s shadow. This represents the rejection level—if exceeded, the reversal has failed and bulls are back in control.',
      target: 'Target 1: Previous swing low or 1:1 R/R. Target 2: 20/50 EMA if price is extended above. Target 3: Prior support zone. Adjust for pattern\'s moderate accuracy.'
    },
    bestContext: [
      'At key horizontal resistance levels',
      'After 3+ consecutive green candles (uptrend)',
      'Near round number resistance ($100, $150, etc.)',
      'At overbought RSI conditions (>70)',
      'At Fibonacci extension levels (127.2%, 161.8%)',
      'Following parabolic or extended moves',
      'At prior significant highs',
      'When volume spikes on the rejection (distribution)'
    ],
    commonMistakes: [
      'Shorting without waiting for confirmation candle',
      'Ignoring strong bullish trend context (may resume)',
      'Setting stops too close to the shadow high (need buffer)',
      'Confusing with Inverted Hammer (appears in downtrend)',
      'Trading small-shadow shooting stars (shadow must be 2x+)',
      'Ignoring that pattern often fails in strong uptrends',
      'Not checking for nearby resistance confluence',
      'Over-positioning on a moderate-accuracy pattern'
    ]
  },
  {
    id: 'inverted-hammer',
    name: 'Inverted Hammer',
    patternKey: 'inverted-hammer',
    bias: 'bullish',
    accuracy: '65%',
    description: 'The Inverted Hammer is the bullish counterpart to the Shooting Star—identical in shape but appearing after downtrends rather than uptrends. The long upper shadow shows that buyers attempted to rally, and while sellers pushed back, the very attempt at buying signals that downside momentum may be exhausting. This pattern requires confirmation but can mark significant bottoms.',
    formation: 'A single candle with: (1) A small real body at the LOWER end of the range, (2) A long upper shadow at least 2x the body length, (3) Little or no lower shadow. Must appear after a downtrend. The shadow shows buyers testing higher levels—a sign of potential trend change.',
    psychology: 'During the downtrend, sellers controlled the action. The Inverted Hammer shows the first sign of buyer interest: prices rallied significantly intraday. Although sellers pushed back, the mere appearance of buying pressure is bullish. If the next candle confirms with a higher close, it validates that buyers are taking control.',
    keyCharacteristics: [
      'Identical shape to Shooting Star (small body, long upper shadow)',
      'Must appear after a downtrend (context makes it bullish)',
      'Long upper shadow shows buying attempt (bullish intent)',
      'Green inverted hammer is more bullish than red',
      'Requires confirmation candle (bullish close above high)',
      'Gap down open followed by rally increases strength',
      'More reliable at support levels',
      'Lower shadow should be minimal (<10% of range)'
    ],
    tradingRules: {
      entry: 'Wait for bullish confirmation: next candle closes above inverted hammer high. Entry: At confirmation close or break of inverted hammer high. Confirmation is mandatory given pattern\'s lower reliability.',
      stopLoss: 'Place stop below the low of the inverted hammer. This represents the pattern\'s base—if broken, the downtrend continues.',
      target: 'Target 1: Previous swing high or resistance. Target 2: 50% retracement of prior downtrend. Target 3: Moving average above (20/50 EMA). Adjust position size for moderate accuracy.'
    },
    bestContext: [
      'At established support levels',
      'After extended downtrend (5+ red candles)',
      'Near major moving average support',
      'At oversold RSI levels (<30)',
      'At Fibonacci retracement levels (61.8%, 78.6%)',
      'Following capitulation or panic selling',
      'When volume spikes showing exhaustion',
      'At prior significant lows'
    ],
    commonMistakes: [
      'Going long without confirmation (lower success rate)',
      'Confusing with Shooting Star (uptrend pattern)',
      'Setting stops too tight below the low',
      'Expecting immediate reversal without confirmation',
      'Ignoring that this is a lower-probability pattern',
      'Not combining with other reversal signals',
      'Trading in strong downtrends without momentum shift',
      'Over-leveraging on a moderate-accuracy signal'
    ]
  }
];

export const ShootingStarVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Shooting Star & Inverted Hammer Guide"
    subtitle="Master these single-candle reversal patterns with distinctive long upper shadows. The Shooting Star warns of potential tops while the Inverted Hammer hints at potential bottoms—context determines meaning."
    variants={SHOOTING_STAR_VARIANTS}
  />
);

export default ShootingStarVisualizer;
