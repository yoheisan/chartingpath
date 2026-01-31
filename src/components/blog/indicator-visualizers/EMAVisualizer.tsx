import { IndicatorVisualizer, IndicatorVariant } from './IndicatorVisualizer';

const EMA_VARIANTS: IndicatorVariant[] = [
  {
    id: 'ema-sma-comparison',
    name: 'EMA vs SMA',
    indicatorType: 'ema-crossover',
    description: 'Moving averages smooth price data to identify trends. The Simple Moving Average (SMA) gives equal weight to all periods, while the Exponential Moving Average (EMA) gives more weight to recent prices, making it more responsive. Understanding when to use each is crucial for effective trend analysis.',
    formula: `SMA = Sum of Prices / Number of Periods
EMA = (Close × Multiplier) + (Previous EMA × (1 - Multiplier))
Multiplier = 2 / (Period + 1)`,
    defaultSettings: 'Common EMAs: 9, 12, 20, 26, 50. Common SMAs: 20, 50, 100, 200. Golden/Death Cross: 50 & 200 SMA.',
    interpretation: [
      'EMA responds faster to price changes than SMA',
      'SMA is smoother with less whipsaws',
      'Price above MA = Bullish trend',
      'Price below MA = Bearish trend',
      'Fast MA crossing slow MA = Trend change signal'
    ],
    tradingRules: {
      entry: 'EMA Crossover: Buy when fast EMA crosses above slow EMA. Golden Cross: Buy when 50 SMA crosses above 200 SMA.',
      stopLoss: 'Below the slower moving average or recent swing low.',
      target: 'Hold until opposite crossover occurs. Use MA as trailing stop reference.'
    },
    bestContext: ['Trend identification', 'Dynamic support/resistance', 'Entry timing'],
    commonMistakes: ['Using MAs in ranging markets', 'Ignoring crossover lag', 'Not confirming with price action']
  }
];

export const EMAVisualizer = () => (
  <IndicatorVisualizer
    title="SMA vs EMA: Which Moving Average to Use"
    subtitle="Compare Simple and Exponential Moving Averages to understand when each works best for trend trading."
    variants={EMA_VARIANTS}
    category="trend"
  />
);

export default EMAVisualizer;
