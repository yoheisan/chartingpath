import { lazy, Suspense, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  CheckCircle, 
  XCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
  Zap
} from 'lucide-react';

// Lazy load the heavy chart component
const DynamicPatternChart = lazy(() => 
  import('@/components/DynamicPatternChart').then(mod => ({ default: mod.DynamicPatternChart }))
);

export interface PatternVariant {
  id: string;
  name: string;
  patternKey: string;
  bias: 'bullish' | 'bearish' | 'neutral';
  accuracy: string;
  description: string;
  formation: string;
  psychology: string;
  keyCharacteristics: string[];
  tradingRules: {
    entry: string;
    stopLoss: string;
    target: string;
  };
  bestContext: string[];
  commonMistakes: string[];
}

interface CandlestickPatternVisualizerProps {
  title: string;
  subtitle: string;
  variants: PatternVariant[];
}

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

export const CandlestickPatternVisualizer = ({ 
  title, 
  subtitle, 
  variants 
}: CandlestickPatternVisualizerProps) => {
  const [activeTab, setActiveTab] = useState(variants[0]?.id || '');

  if (!variants.length) return null;

  const gridCols = variants.length <= 2 ? 'grid-cols-2' : 
                   variants.length <= 3 ? 'grid-cols-3' : 
                   variants.length <= 4 ? 'grid-cols-4' : 'grid-cols-5';

  return (
    <div className="my-8 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid ${gridCols} w-full max-w-3xl mx-auto mb-6`}>
          {variants.map(variant => (
            <TabsTrigger 
              key={variant.id} 
              value={variant.id}
              className="text-xs sm:text-sm"
            >
              {variant.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {variants.map(variant => (
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

            {/* Formation & Psychology */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Pattern Formation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{variant.formation}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Market Psychology
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{variant.psychology}</p>
                </CardContent>
              </Card>
            </div>

            {/* Key Characteristics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Key Characteristics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {variant.keyCharacteristics.map((char, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-muted-foreground">{char}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

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
      {variants.length > 1 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Pattern Comparison
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
                  </tr>
                </thead>
                <tbody>
                  {variants.map(variant => (
                    <tr key={variant.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{variant.name}</td>
                      <td className="py-3 px-2 text-center">
                        <BiasIndicator bias={variant.bias} />
                      </td>
                      <td className="py-3 px-2 text-center">{variant.accuracy}</td>
                      <td className="py-3 px-2 text-muted-foreground">{variant.bestContext[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CandlestickPatternVisualizer;
