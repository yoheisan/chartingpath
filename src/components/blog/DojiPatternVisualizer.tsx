import { lazy, Suspense, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Shield, 
  CheckCircle, 
  XCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

// Lazy load the heavy chart component
const DynamicPatternChart = lazy(() => 
  import('@/components/DynamicPatternChart').then(mod => ({ default: mod.DynamicPatternChart }))
);

interface DojiVariant {
  id: string;
  name: string;
  patternKey: string;
  bias: 'bullish' | 'bearish' | 'neutral';
  accuracy: string;
  description: string;
  anatomy: {
    body: string;
    upperShadow: string;
    lowerShadow: string;
  };
  keyCharacteristics: string[];
  tradingRules: {
    entry: string;
    stopLoss: string;
    target: string;
  };
  bestContext: string[];
  commonMistakes: string[];
}

const DOJI_VARIANTS: DojiVariant[] = [
  {
    id: 'standard',
    name: 'Standard Doji',
    patternKey: 'standard-doji',
    bias: 'neutral',
    accuracy: '65%',
    description: 'The classic Doji with open and close at the same price, and roughly equal upper and lower shadows. Represents perfect market indecision.',
    anatomy: {
      body: 'Virtually none (open = close)',
      upperShadow: 'Moderate length',
      lowerShadow: 'Moderate length (similar to upper)'
    },
    keyCharacteristics: [
      'Open and close are identical or nearly identical',
      'Upper and lower shadows are roughly equal',
      'Looks like a plus sign (+) or cross',
      'Volume often decreases during formation'
    ],
    tradingRules: {
      entry: 'Enter on close of confirmation candle in the breakout direction',
      stopLoss: 'Place beyond the opposite shadow of the Doji',
      target: 'Previous swing high/low or 2:1 risk/reward'
    },
    bestContext: [
      'After extended trends (5+ candles in one direction)',
      'At key support/resistance levels',
      'Near Fibonacci retracement levels',
      'At psychological round numbers'
    ],
    commonMistakes: [
      'Trading the Doji without waiting for confirmation',
      'Ignoring the context (trend, S/R levels)',
      'Using Dojis in choppy sideways markets'
    ]
  },
  {
    id: 'dragonfly',
    name: 'Dragonfly Doji',
    patternKey: 'dragonfly-doji',
    bias: 'bullish',
    accuracy: '72%',
    description: 'A powerful bullish reversal signal. Open and close are at the high of the session with a long lower shadow. Shows that sellers pushed price down aggressively, but buyers brought it all the way back.',
    anatomy: {
      body: 'None or tiny at the TOP of the range',
      upperShadow: 'None or very small',
      lowerShadow: 'Very long (at least 2x the body)'
    },
    keyCharacteristics: [
      'Looks like a "T" shape',
      'Open, high, and close are all at the same level',
      'Long lower shadow shows strong buying pressure',
      'Most bullish when appearing at support levels'
    ],
    tradingRules: {
      entry: 'Enter long on close of bullish confirmation candle',
      stopLoss: 'Below the low of the Dragonfly\'s shadow',
      target: 'Previous resistance or 2:1 R/R minimum'
    },
    bestContext: [
      'At established support levels',
      'After a downtrend (reversal signal)',
      'Near moving average support (20/50/200 EMA)',
      'At oversold RSI levels (<30)'
    ],
    commonMistakes: [
      'Going long immediately without confirmation candle',
      'Ignoring the downtrend context requirement',
      'Setting stop loss too tight (below shadow is key)'
    ]
  },
  {
    id: 'gravestone',
    name: 'Gravestone Doji',
    patternKey: 'gravestone-doji',
    bias: 'bearish',
    accuracy: '74%',
    description: 'A powerful bearish reversal signal. Open and close are at the low of the session with a long upper shadow. Shows that buyers pushed price up aggressively, but sellers rejected it completely.',
    anatomy: {
      body: 'None or tiny at the BOTTOM of the range',
      upperShadow: 'Very long (at least 2x the body)',
      lowerShadow: 'None or very small'
    },
    keyCharacteristics: [
      'Looks like an inverted "T" or tombstone',
      'Open, low, and close are all at the same level',
      'Long upper shadow shows strong selling pressure',
      'Most bearish when appearing at resistance levels'
    ],
    tradingRules: {
      entry: 'Enter short on close of bearish confirmation candle',
      stopLoss: 'Above the high of the Gravestone\'s shadow',
      target: 'Previous support or 2:1 R/R minimum'
    },
    bestContext: [
      'At established resistance levels',
      'After an uptrend (reversal signal)',
      'Near moving average resistance',
      'At overbought RSI levels (>70)'
    ],
    commonMistakes: [
      'Shorting immediately without confirmation',
      'Ignoring the uptrend context requirement',
      'Trading against strong momentum without patience'
    ]
  },
  {
    id: 'long-legged',
    name: 'Long-Legged Doji',
    patternKey: 'long-legged-doji',
    bias: 'neutral',
    accuracy: '68%',
    description: 'Represents maximum indecision and volatility. Both upper and lower shadows are very long, showing extreme battle between bulls and bears. Often precedes major moves.',
    anatomy: {
      body: 'None or tiny in the MIDDLE of the range',
      upperShadow: 'Very long',
      lowerShadow: 'Very long (similar to upper)'
    },
    keyCharacteristics: [
      'Very long shadows in both directions',
      'Open and close near the middle of the range',
      'High volume often accompanies this pattern',
      'Shows intense volatility and indecision'
    ],
    tradingRules: {
      entry: 'Wait for breakout above high or below low, then enter with confirmation',
      stopLoss: 'Opposite extreme of the Long-Legged Doji',
      target: 'Measured move equal to the Doji\'s range'
    },
    bestContext: [
      'After extended trends showing exhaustion',
      'Before major news events or earnings',
      'At major confluence zones (multiple S/R levels)',
      'During market uncertainty (Fed meetings, elections)'
    ],
    commonMistakes: [
      'Picking a direction without confirmation',
      'Underestimating the volatility that follows',
      'Not widening stops for the increased range'
    ]
  },
  {
    id: 'four-price',
    name: 'Four-Price Doji',
    patternKey: 'four-price-doji',
    bias: 'neutral',
    accuracy: 'N/A',
    description: 'A rare pattern where open, high, low, and close are all the same price. Represents complete market standstill, typically seen in illiquid markets or during holidays.',
    anatomy: {
      body: 'A single horizontal line',
      upperShadow: 'None',
      lowerShadow: 'None'
    },
    keyCharacteristics: [
      'Appears as a simple horizontal dash (—)',
      'Open = High = Low = Close',
      'Very low or no volume',
      'Rare in liquid markets'
    ],
    tradingRules: {
      entry: 'Do not trade this pattern directly',
      stopLoss: 'Wait for normal market activity to resume',
      target: 'Use subsequent candles for trading decisions'
    },
    bestContext: [
      'Holiday sessions with thin trading',
      'Pre-market or after-hours on illiquid stocks',
      'During market halts or circuit breakers'
    ],
    commonMistakes: [
      'Trying to derive meaning from lack of activity',
      'Trading in illiquid conditions',
      'Not waiting for volume to return'
    ]
  }
];

const ChartSkeleton = () => (
  <div className="w-full aspect-[16/10] bg-muted/30 rounded-lg animate-pulse flex items-center justify-center">
    <Skeleton className="w-full h-full rounded-lg" />
  </div>
);

const BiasIndicator = ({ bias }: { bias: 'bullish' | 'bearish' | 'neutral' }) => {
  const config = {
    bullish: { icon: ArrowUp, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Bullish' },
    bearish: { icon: ArrowDown, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Bearish' },
    neutral: { icon: Minus, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Neutral' }
  };
  const { icon: Icon, color, bg, label } = config[bias];
  
  return (
    <Badge className={`${bg} ${color} border-0`}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
};

export const DojiPatternVisualizer = () => {
  const [activeTab, setActiveTab] = useState('standard');

  return (
    <div className="my-8 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Doji Pattern Visual Guide</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Interactive exploration of all Doji candlestick variations. Click each tab to see the pattern in action with trading rules.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl mx-auto mb-6">
          {DOJI_VARIANTS.map(variant => (
            <TabsTrigger 
              key={variant.id} 
              value={variant.id}
              className="text-xs sm:text-sm"
            >
              {variant.name.replace(' Doji', '')}
            </TabsTrigger>
          ))}
        </TabsList>

        {DOJI_VARIANTS.map(variant => (
          <TabsContent key={variant.id} value={variant.id} className="space-y-6">
            {/* Header with badges */}
            <div className="flex flex-wrap items-center gap-3 justify-center">
              <h3 className="text-xl font-semibold">{variant.name}</h3>
              <BiasIndicator bias={variant.bias} />
              <Badge variant="outline">{variant.accuracy} Accuracy</Badge>
            </div>

            {/* Chart */}
            <div className="rounded-xl overflow-hidden border border-border bg-card">
              <Suspense fallback={<ChartSkeleton />}>
                <DynamicPatternChart 
                  patternType={variant.patternKey}
                  height={400}
                  showTitle={false}
                />
              </Suspense>
            </div>

            {/* Description */}
            <p className="text-center text-muted-foreground max-w-3xl mx-auto">
              {variant.description}
            </p>

            {/* Anatomy & Characteristics Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Anatomy Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Candlestick Anatomy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Body:</span>
                    <span className="text-right max-w-[200px]">{variant.anatomy.body}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Upper Shadow:</span>
                    <span className="text-right max-w-[200px]">{variant.anatomy.upperShadow}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">Lower Shadow:</span>
                    <span className="text-right max-w-[200px]">{variant.anatomy.lowerShadow}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Key Characteristics Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Key Characteristics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {variant.keyCharacteristics.map((char, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-muted-foreground">{char}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Trading Rules */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Trading Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      Entry
                    </div>
                    <p className="text-sm text-muted-foreground">{variant.tradingRules.entry}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Shield className="h-4 w-4 text-red-500" />
                      Stop Loss
                    </div>
                    <p className="text-sm text-muted-foreground">{variant.tradingRules.stopLoss}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Target className="h-4 w-4 text-blue-500" />
                      Target
                    </div>
                    <p className="text-sm text-muted-foreground">{variant.tradingRules.target}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Best Context & Mistakes Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Best Context */}
              <Card className="border-green-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Best Trading Context
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {variant.bestContext.map((ctx, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{ctx}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Common Mistakes */}
              <Card className="border-red-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Common Mistakes to Avoid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {variant.commonMistakes.map((mistake, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Comparison Table */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Doji Pattern Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Pattern</th>
                  <th className="text-center py-3 px-2">Bias</th>
                  <th className="text-center py-3 px-2">Accuracy</th>
                  <th className="text-left py-3 px-2">Best When</th>
                  <th className="text-left py-3 px-2">Key Feature</th>
                </tr>
              </thead>
              <tbody>
                {DOJI_VARIANTS.map(variant => (
                  <tr key={variant.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 font-medium">{variant.name}</td>
                    <td className="py-3 px-2 text-center">
                      <BiasIndicator bias={variant.bias} />
                    </td>
                    <td className="py-3 px-2 text-center">{variant.accuracy}</td>
                    <td className="py-3 px-2 text-muted-foreground">{variant.bestContext[0]}</td>
                    <td className="py-3 px-2 text-muted-foreground">{variant.keyCharacteristics[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DojiPatternVisualizer;
