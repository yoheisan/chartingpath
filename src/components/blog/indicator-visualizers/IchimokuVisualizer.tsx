import { IndicatorVisualizer, IndicatorVariant } from './IndicatorVisualizer';

const ICHIMOKU_VARIANTS: IndicatorVariant[] = [
  {
    id: 'ichimoku-complete',
    name: 'Ichimoku Kinko Hyo',
    indicatorType: 'ichimoku',
    description: 'The Ichimoku Cloud (Ichimoku Kinko Hyo, meaning "one-glance equilibrium chart") is a comprehensive technical analysis system developed by Japanese journalist Goichi Hosoda over 30 years of research before its public release in 1968. Unlike Western indicators that typically measure one aspect of price action, Ichimoku provides a complete trading system in a single view—showing trend direction, momentum, support/resistance levels, and trading signals simultaneously. The five-line system with its distinctive "cloud" (Kumo) has become one of the most respected indicators among institutional traders worldwide.',
    origin: 'Developed by Goichi Hosoda (pen name "Ichimoku Sanjin") starting in 1930s Japan. He enlisted university students to hand-calculate data across rice markets. After 30+ years of refinement using pre-computer manual backtesting, he published the system in 1968. Originally designed for Japanese markets trading 6 days/week, the default settings (9, 26, 52) corresponded to 1.5 weeks, one month, and two months of trading data.',
    formula: `Tenkan-sen (Conversion Line):
(9-period High + 9-period Low) / 2

Kijun-sen (Base Line):
(26-period High + 26-period Low) / 2

Senkou Span A (Leading Span A):
(Tenkan-sen + Kijun-sen) / 2
(Plotted 26 periods ahead)

Senkou Span B (Leading Span B):
(52-period High + 52-period Low) / 2
(Plotted 26 periods ahead)

Chikou Span (Lagging Span):
Current Close plotted 26 periods back

Kumo (Cloud):
Area between Senkou Span A and B`,
    defaultSettings: 'Standard: (9, 26, 52). Modern adaptation for 5-day weeks: (7, 22, 44). Crypto/forex 24/7 markets: (10, 30, 60). Short-term: (6, 13, 26). The 26-period displacement for cloud projection remains constant.',
    interpretation: [
      'Price ABOVE cloud = Bullish trend; trading above cloud provides strong support',
      'Price BELOW cloud = Bearish trend; cloud acts as overhead resistance',
      'Price INSIDE cloud = Consolidation/no-trade zone; trend is undefined',
      'Tenkan-sen crossing ABOVE Kijun-sen = Bullish signal (TK Cross)',
      'Tenkan-sen crossing BELOW Kijun-sen = Bearish signal (TK Cross)',
      'THICK cloud = Strong support/resistance; harder to break through',
      'THIN cloud = Weak support/resistance; easy breakout zone',
      'Chikou Span ABOVE price (26 periods back) = Confirms bullish momentum',
      'GREEN cloud (Senkou A > Senkou B) = Future bullish outlook',
      'RED cloud (Senkou B > Senkou A) = Future bearish outlook'
    ],
    signalTypes: [
      {
        type: 'bullish',
        name: 'Strong Bullish Signal',
        description: 'TK Cross bullish + Price above cloud + Chikou above price = Highest probability long entry. All five lines confirm bullish bias.'
      },
      {
        type: 'bullish',
        name: 'Kumo Breakout (Bullish)',
        description: 'Price breaks above cloud resistance after consolidating inside. Cloud twist (Senkou A crossing above B) confirms trend change.'
      },
      {
        type: 'bearish',
        name: 'Strong Bearish Signal',
        description: 'TK Cross bearish + Price below cloud + Chikou below price = Highest probability short entry. Complete bearish alignment.'
      },
      {
        type: 'bearish',
        name: 'Kumo Breakout (Bearish)',
        description: 'Price breaks below cloud support. Cloud twist (Senkou A crossing below B) confirms bearish trend continuation.'
      },
      {
        type: 'neutral',
        name: 'Kumo Twist',
        description: 'When Senkou Span A and B cross, signaling potential trend change 26 periods in the future. Often precedes major reversals.'
      },
      {
        type: 'neutral',
        name: 'Inside Cloud',
        description: 'Price trading within the Kumo indicates market equilibrium. Avoid trading until clear breakout direction is established.'
      }
    ],
    tradingRules: {
      entry: 'Enter LONG when: (1) TK Cross bullish occurs, (2) Price is above cloud OR breaking out of cloud, (3) Chikou Span is above price from 26 periods ago. Enter SHORT on inverse conditions. Wait for all confirmations for highest probability trades.',
      stopLoss: 'Place stop below Kijun-sen for long trades (it acts as dynamic support). For aggressive entries, use opposite cloud edge. Cloud thickness determines stop distance—thicker clouds = wider stops.',
      target: 'Target previous swing high/low or use Kijun-sen as trailing stop. Many traders hold positions until opposite TK Cross occurs. Cloud twists 26 periods ahead can indicate profit-taking zones.'
    },
    bestContext: [
      'Trending markets with clear directional bias (Ichimoku excels in trends)',
      'Daily and weekly timeframes (originally designed for these)',
      'Japanese markets (JPY pairs, Nikkei) where it has cultural adoption',
      'Confirming breakouts from consolidation zones',
      'Position trading and swing trading timeframes',
      'When you need multiple confirmations in a single indicator',
      'Markets with sufficient volatility to generate clear signals',
      'After cloud twists signal potential trend changes'
    ],
    commonMistakes: [
      'Trading TK Crosses inside the cloud (low probability signals)',
      'Ignoring the Chikou Span confirmation (it validates momentum)',
      'Using default settings on non-traditional markets without adjustment',
      'Trading against the cloud direction (fighting major support/resistance)',
      'Expecting immediate results from Kumo Twist (it projects 26 periods ahead)',
      'Using Ichimoku on very short timeframes where noise dominates',
      'Ignoring cloud thickness when setting stops (thin cloud = tight stops)',
      'Not considering all five components together (the system is holistic)'
    ],
    prosAndCons: {
      pros: [
        'Complete trading system in one indicator (trend, momentum, S/R)',
        'Projects future support/resistance levels (cloud is forward-looking)',
        'Clear visual representation reduces subjective interpretation',
        'Works well across multiple asset classes and timeframes',
        'Chikou Span provides unique momentum confirmation',
        'Cloud thickness indicates strength of levels',
        'Reduces need for multiple overlapping indicators'
      ],
      cons: [
        'Complex learning curve with five components to understand',
        'Visual clutter on charts with many lines displayed',
        'Default settings may not suit all markets (need adaptation)',
        'Lagging nature of some components in fast-moving markets',
        'Less effective in ranging/sideways markets',
        'Requires sufficient historical data (52 periods minimum)',
        'Can produce conflicting signals between components'
      ]
    },
    advancedTechniques: [
      'Multi-timeframe Ichimoku: Check cloud direction on higher timeframe before trading TK Crosses on lower timeframe for trend alignment',
      'Kijun-sen Bounce: Use Kijun as dynamic support/resistance for pullback entries within established trends',
      'Cloud Edge Trading: Enter on retests of cloud edges after successful breakouts, using cloud as support/resistance',
      'Chikou Span Analysis: Project where Chikou will be relative to price to anticipate future signal confirmations',
      'Time Analysis (Ichimoku Numbers): Hosoda\'s original system included time cycles using 9, 17, 26, 33, 42 periods for forecasting turning points',
      'Wave Theory Integration: Combine Ichimoku with Elliott Wave counts for higher-probability reversal zones'
    ]
  }
];

export const IchimokuVisualizer = () => (
  <IndicatorVisualizer
    title="Ichimoku Cloud Complete Guide"
    subtitle="Master the comprehensive Japanese trading system that reveals trend, momentum, and support/resistance at a glance. Originally developed through 30+ years of research, Ichimoku Kinko Hyo ('one-glance equilibrium chart') provides institutional-grade analysis in a single indicator."
    variants={ICHIMOKU_VARIANTS}
    category="trend"
  />
);

export default IchimokuVisualizer;
