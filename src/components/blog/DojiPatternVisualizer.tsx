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
    description: 'The Standard Doji is the classic indecision candle where open and close are virtually identical with moderate shadows on both sides. The word "doji" comes from Japanese, meaning "the same thing"—referring to the open and close being at the same price. While rare, this pattern signals a potential equilibrium between buyers and sellers that often precedes trend changes. Studies show 60-70% reliability when appearing at key levels with confirmation.',
    anatomy: {
      body: 'Virtually none—open and close at same or nearly same price',
      upperShadow: 'Moderate length (neither very long nor very short)',
      lowerShadow: 'Moderate length (approximately equal to upper shadow)'
    },
    keyCharacteristics: [
      'Open and close are identical or within 0.1% of each other',
      'Upper and lower shadows are roughly equal length',
      'Appears as a plus sign (+) or cross on the chart',
      'Volume often decreases during formation (indecision)',
      'More meaningful after extended trends (5+ candles)',
      'Signals potential reversal OR continuation—needs confirmation',
      'Rarity increases significance when it does appear',
      'Part of many compound patterns (morning star, harami cross)'
    ],
    tradingRules: {
      entry: 'Wait for confirmation candle in the breakout direction. Bullish: enter if next candle closes above doji high. Bearish: enter if next candle closes below doji low. Never trade doji in isolation.',
      stopLoss: 'Place stop beyond the opposite shadow of the Doji. For bullish setup: stop below doji low. For bearish: stop above doji high.',
      target: 'Previous swing high/low or 2:1 risk/reward minimum. Adjust position size given the pattern\'s moderate accuracy.'
    },
    bestContext: [
      'After extended trends (5+ candles in one direction)',
      'At key horizontal support/resistance levels',
      'Near Fibonacci retracement levels (50%, 61.8%)',
      'At psychological round numbers ($100, $50)',
      'When RSI shows divergence from price',
      'Following high-volume moves (exhaustion sign)',
      'At major moving average confluence',
      'Before significant news or earnings'
    ],
    commonMistakes: [
      'Trading the Doji without waiting for confirmation',
      'Ignoring the context (trend, support/resistance levels)',
      'Using Dojis in choppy sideways markets (low signal value)',
      'Expecting immediate direction (doji signals pause)',
      'Treating all dojis equally (location matters enormously)',
      'Ignoring volume profile (low volume = less significance)',
      'Not adjusting expectations for moderate accuracy',
      'Confusing doji with small-body candles (body must be near-zero)'
    ]
  },
  {
    id: 'dragonfly',
    name: 'Dragonfly Doji',
    patternKey: 'dragonfly-doji',
    bias: 'bullish',
    accuracy: '72%',
    description: 'The Dragonfly Doji is a powerful bullish reversal signal characterized by open and close at the session\'s high with a very long lower shadow. Named for its resemblance to a dragonfly, this pattern shows that sellers pushed prices down aggressively during the session, but buyers absorbed all selling and rallied prices back to the open. In Japanese, this concept represents complete rejection of lower prices. Studies show 68-76% reliability at support levels.',
    anatomy: {
      body: 'Virtually none—positioned at the TOP of the trading range',
      upperShadow: 'None or very small (price didn\'t exceed open/close)',
      lowerShadow: 'Very long—at least 2-3x the body length'
    },
    keyCharacteristics: [
      'Forms a "T" shape on the chart',
      'Open, high, and close are all at the same level',
      'Long lower shadow shows aggressive buying at lows (2x+ body)',
      'Most bullish when appearing at support levels',
      'More reliable after established downtrends',
      'Volume spike on the dragonfly adds confirmation',
      'The longer the lower shadow, the stronger the rejection',
      'Similar psychology to hammer but more extreme'
    ],
    tradingRules: {
      entry: 'Wait for bullish confirmation candle that closes above dragonfly high. Entry: at confirmation close or next bar open. Given higher accuracy, can enter aggressively if at major support with volume.',
      stopLoss: 'Below the low of the Dragonfly\'s shadow—this represents the rejection level where buyers stepped in forcefully.',
      target: 'Previous resistance or 2:1 R/R minimum. Target 2: 50% retracement of prior downtrend. Strong dragonflies at support often start significant rallies.'
    },
    bestContext: [
      'At established horizontal support levels',
      'After a downtrend (reversal signal context)',
      'Near major moving average support (20/50/200 EMA)',
      'At oversold RSI levels (<30) with divergence',
      'At Fibonacci retracement levels (61.8%, 78.6%)',
      'Following capitulation or panic selling',
      'At prior significant lows',
      'When volume spikes on the rejection'
    ],
    commonMistakes: [
      'Going long immediately without confirmation candle',
      'Ignoring the downtrend context requirement',
      'Setting stop loss too tight (below shadow is key level)',
      'Trading dragonfly in sideways markets (needs trend)',
      'Confusing with small-shadow doji (shadow must be long)',
      'Ignoring volume (high volume rejection is more meaningful)',
      'Expecting pattern in all market conditions (relatively rare)',
      'Not adjusting for the pattern\'s higher accuracy'
    ]
  },
  {
    id: 'gravestone',
    name: 'Gravestone Doji',
    patternKey: 'gravestone-doji',
    bias: 'bearish',
    accuracy: '74%',
    description: 'The Gravestone Doji is a powerful bearish reversal signal with open and close at the session\'s low and a very long upper shadow. The pattern resembles a gravestone or tombstone—an ominous visual that Japanese traders associated with the "death" of an uptrend. Buyers pushed prices up aggressively but sellers rejected the advance completely, driving price back to the open. At 70-78% reliability at resistance, it\'s among the more dependable bearish signals.',
    anatomy: {
      body: 'Virtually none—positioned at the BOTTOM of the trading range',
      upperShadow: 'Very long—at least 2-3x the body length',
      lowerShadow: 'None or very small (price didn\'t fall below open/close)'
    },
    keyCharacteristics: [
      'Forms an inverted "T" or tombstone shape',
      'Open, low, and close are all at the same level',
      'Long upper shadow shows aggressive selling at highs (2x+ body)',
      'Most bearish when appearing at resistance levels',
      'More reliable after established uptrends',
      'Volume spike on the gravestone suggests distribution',
      'The longer the upper shadow, the stronger the rejection',
      'Similar psychology to shooting star but more extreme'
    ],
    tradingRules: {
      entry: 'Wait for bearish confirmation candle that closes below gravestone low. Entry: at confirmation close or next bar open. At major resistance with volume, can enter more aggressively.',
      stopLoss: 'Above the high of the Gravestone\'s shadow—this represents the rejection level where sellers stepped in forcefully.',
      target: 'Previous support or 2:1 R/R minimum. Target 2: 50% retracement of prior uptrend. Strong gravestones at resistance often start significant declines.'
    },
    bestContext: [
      'At established resistance levels',
      'After an uptrend (reversal signal context)',
      'Near major moving average resistance',
      'At overbought RSI levels (>70) with divergence',
      'At Fibonacci extension levels (127.2%, 161.8%)',
      'Following blow-off tops or parabolic moves',
      'At prior all-time highs or significant peaks',
      'When volume spikes on the rejection'
    ],
    commonMistakes: [
      'Shorting immediately without confirmation candle',
      'Ignoring the uptrend context requirement',
      'Trading against strong momentum without patience',
      'Setting stops too tight (above shadow is key)',
      'Confusing with regular small-shadow doji',
      'Ignoring volume profile on the rejection',
      'Fighting strong uptrends without clear resistance',
      'Expecting the pattern too frequently'
    ]
  },
  {
    id: 'long-legged',
    name: 'Long-Legged Doji',
    patternKey: 'long-legged-doji',
    bias: 'neutral',
    accuracy: '68%',
    description: 'The Long-Legged Doji represents maximum indecision and volatility—both upper and lower shadows are very long, showing an extreme battle between bulls and bears that ended in a draw. The open and close are near the middle of the range. This pattern often appears at major turning points and frequently precedes significant moves in either direction. Japanese traders called this "juji" (cross) and treated it as a major warning signal.',
    anatomy: {
      body: 'Virtually none—positioned in the MIDDLE of the trading range',
      upperShadow: 'Very long (3x+ body length)',
      lowerShadow: 'Very long (similar to upper shadow—3x+ body)'
    },
    keyCharacteristics: [
      'Very long shadows extending in both directions',
      'Open and close near the middle of the range (cross shape)',
      'High volume often accompanies this pattern',
      'Shows intense volatility and complete indecision',
      'More significant than standard or dragonfly/gravestone doji',
      'Often appears at major market turning points',
      'Represents maximum uncertainty—market at crossroads',
      'Frequently precedes major moves in either direction'
    ],
    tradingRules: {
      entry: 'Wait for breakout above high or below low with confirmation candle. Enter with the breakout direction. Do NOT predict direction—let price resolve first.',
      stopLoss: 'Opposite extreme of the Long-Legged Doji. Accept wide stops and adjust position size accordingly. This pattern requires more risk tolerance.',
      target: 'Measured move equal to the Doji\'s full range. These setups can produce significant moves given the preceding volatility and indecision resolution.'
    },
    bestContext: [
      'After extended trends showing exhaustion',
      'Before major news events or earnings announcements',
      'At major confluence zones (multiple S/R levels meeting)',
      'During market uncertainty periods (Fed decisions, elections)',
      'At all-time highs or multi-year lows',
      'When volume is significantly elevated',
      'At psychological round number levels',
      'Following gap moves (showing indecision after gap)'
    ],
    commonMistakes: [
      'Picking a direction without waiting for confirmation',
      'Underestimating the volatility that often follows',
      'Not widening stops for the increased range',
      'Using normal position sizes (reduce for wide stops)',
      'Trading the pattern too aggressively before resolution',
      'Ignoring that resolution may take multiple sessions',
      'Expecting immediate directional clarity',
      'Not recognizing the pattern\'s significance at turning points'
    ]
  },
  {
    id: 'four-price',
    name: 'Four-Price Doji',
    patternKey: 'four-price-doji',
    bias: 'neutral',
    accuracy: 'N/A',
    description: 'The Four-Price Doji is a rare anomaly where open, high, low, and close are all the same price—representing complete market standstill. This pattern appears as a single horizontal dash with no shadows whatsoever. It typically occurs in illiquid markets, during holidays, or after trading halts. While technically a doji, it signals absence of trading activity rather than indecision between active participants. Professional traders generally do NOT trade this pattern.',
    anatomy: {
      body: 'A single horizontal line (dash)',
      upperShadow: 'None whatsoever',
      lowerShadow: 'None whatsoever'
    },
    keyCharacteristics: [
      'Appears as a simple horizontal dash (—) on the chart',
      'Open = High = Low = Close (all four prices equal)',
      'Very low or no trading volume',
      'Rare in liquid, actively traded markets',
      'NOT a tradeable pattern—signals market absence',
      'Often seen in extended hours or holidays',
      'May appear during trading halts or circuit breakers',
      'Should be excluded from pattern analysis'
    ],
    tradingRules: {
      entry: 'Do NOT trade this pattern directly. Wait for normal market activity to resume before making any trading decisions.',
      stopLoss: 'N/A—pattern is not tradeable. Wait for subsequent candles with normal activity.',
      target: 'Use following candles for analysis once volume and activity return to normal levels.'
    },
    bestContext: [
      'Holiday sessions with thin trading',
      'Pre-market or after-hours on illiquid stocks',
      'During market halts or circuit breakers',
      'In very thinly traded instruments',
      'Following trading suspensions',
      'During market closures or partial sessions',
      'In newly listed or delisted securities',
      'During extreme market stress (halts)'
    ],
    commonMistakes: [
      'Trying to derive meaning from complete lack of activity',
      'Trading in illiquid conditions based on this "pattern"',
      'Not recognizing it as a sign of no market participation',
      'Confusing with other doji types that ARE meaningful',
      'Trading immediately after four-price doji appears',
      'Using standard pattern analysis on non-liquid periods',
      'Not waiting for volume and activity to normalize',
      'Including in backtests or pattern statistics'
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
