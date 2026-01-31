import { CandlestickPatternVisualizer, PatternVariant } from '../CandlestickPatternVisualizer';

const SHOOTING_STAR_VARIANTS: PatternVariant[] = [
  {
    id: 'shooting-star',
    name: 'Shooting Star',
    patternKey: 'shooting-star',
    bias: 'bearish',
    accuracy: '68%',
    description: 'A bearish reversal pattern that forms at the top of an uptrend. The long upper shadow shows that buyers pushed prices significantly higher, but sellers stepped in and pushed prices back down, closing near the open.',
    formation: 'A single candle with a small body at the lower end of the trading range and a long upper shadow (wick) at least 2x the body length. Little to no lower shadow. The body can be green or red.',
    psychology: 'Bulls attempted to push prices higher but were met with strong resistance from sellers. The rejection of higher prices and close near the lows signals that selling pressure may be overwhelming buying interest.',
    keyCharacteristics: [
      'Small body at the bottom of the candle',
      'Upper shadow at least 2x the body length',
      'Little or no lower shadow',
      'Must appear after an uptrend',
      'Red body is more bearish than green',
      'Gaps up from prior candle increase reliability'
    ],
    tradingRules: {
      entry: 'Enter short on bearish confirmation candle (close below shooting star low)',
      stopLoss: 'Above the high of the shooting star\'s shadow',
      target: 'Previous swing low or 2:1 risk/reward'
    },
    bestContext: [
      'At key resistance levels',
      'After 3+ consecutive green candles',
      'Near round number resistance',
      'At overbought conditions (RSI > 70)'
    ],
    commonMistakes: [
      'Trading without bearish confirmation candle',
      'Ignoring strong bullish trend context',
      'Setting stops too close to the high',
      'Confusing with Inverted Hammer (downtrend pattern)'
    ]
  }
];

export const ShootingStarVisualizer = () => (
  <CandlestickPatternVisualizer
    title="Shooting Star Pattern Visual Guide"
    subtitle="Master this powerful bearish reversal signal that appears at market tops when buyers lose control."
    variants={SHOOTING_STAR_VARIANTS}
  />
);

export default ShootingStarVisualizer;
