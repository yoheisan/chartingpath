import { IndicatorVisualizer, IndicatorVariant } from './IndicatorVisualizer';

const DONCHIAN_VARIANTS: IndicatorVariant[] = [
  {
    id: 'donchian-channels',
    name: 'Donchian Channels',
    indicatorType: 'donchian',
    description: 'Donchian Channels, developed by Richard Donchian (the "Father of Trend Following"), plot the highest high and lowest low over a specified period. Made famous by the Turtle Traders in the 1980s, this simple yet powerful indicator identifies breakouts and defines trend direction. When price breaks above the upper channel, it signals a potential long entry; breaking below the lower channel signals a short.',
    origin: 'Created by Richard Donchian in the 1960s. Donchian managed one of the first publicly held commodity funds and mentored many successful traders. The Turtle Trading experiment in 1983 proved that trend-following rules using Donchian Channels could be taught and replicated profitably.',
    formula: `Upper Channel = Highest High of last n periods
Lower Channel = Lowest Low of last n periods
Middle Line = (Upper + Lower) / 2`,
    defaultSettings: 'Standard Turtle: 20-period for entries, 10-period for exits. Day trading: 10-period. Position trading: 55-period.',
    interpretation: [
      'Price breaking ABOVE upper channel = Bullish breakout (long signal)',
      'Price breaking BELOW lower channel = Bearish breakout (short signal)',
      'Price above middle line = Bullish bias',
      'Price below middle line = Bearish bias',
      'Channel width indicates volatility'
    ],
    tradingRules: {
      entry: 'LONG: Price closes above 20-day high. SHORT: Price closes below 20-day low. The Turtle system added a 55-day breakout for missed signals.',
      stopLoss: 'Exit long if price hits 10-day low. Exit short if price hits 10-day high. Alternative: 2× ATR from entry.',
      target: 'Ride trends until exit signal. Turtle system pyramided positions, adding on each new 20-day breakout up to 4 units.'
    },
    bestContext: ['Trending markets', 'Breakout trading', 'Trend following systems', 'Position trading'],
    commonMistakes: ['Trading breakouts in ranging markets', 'Ignoring false breakouts', 'Not using proper position sizing']
  }
];

export const DonchianVisualizer = () => (
  <IndicatorVisualizer
    title="Donchian Channels Breakout Guide"
    subtitle="Master the Turtle Trading breakout system using Richard Donchian's price channel indicator."
    variants={DONCHIAN_VARIANTS}
    category="trend"
  />
);

export default DonchianVisualizer;
