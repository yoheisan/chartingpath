/**
 * IndicatorVisualizer - Base component for technical indicator education
 * 
 * Provides comprehensive educational content with interactive charts
 * for all technical indicator articles.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Activity,
  BarChart3,
  Shield,
  Lightbulb,
  BookOpen,
  Calculator,
  Settings
} from 'lucide-react';
import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { IndicatorType } from '@/components/charts/StrategyIndicatorChart';
import { generateDemoBars } from '@/utils/chartIndicators';

const StrategyIndicatorChart = lazy(() => 
  import('@/components/charts/StrategyIndicatorChart')
);

export interface IndicatorVariant {
  id: string;
  name: string;
  indicatorType: IndicatorType;
  description: string;
  origin?: string;
  formula?: string;
  defaultSettings?: string;
  interpretation?: string[];
  signalTypes?: {
    type: 'bullish' | 'bearish' | 'neutral';
    name: string;
    description: string;
  }[];
  tradingRules?: {
    entry: string;
    stopLoss: string;
    target: string;
  };
  bestContext?: string[];
  commonMistakes?: string[];
  prosAndCons?: {
    pros: string[];
    cons: string[];
  };
  advancedTechniques?: string[];
}

export interface IndicatorVisualizerProps {
  title: string;
  subtitle: string;
  variants: IndicatorVariant[];
  category?: 'momentum' | 'trend' | 'volatility' | 'volume';
}

const ChartSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-[400px] w-full" />
  </div>
);

const getCategoryBadge = (category: string) => {
  const colors: Record<string, string> = {
    momentum: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    trend: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    volatility: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    volume: 'bg-green-500/20 text-green-300 border-green-500/30',
  };
  return colors[category] || 'bg-muted text-muted-foreground';
};

export const IndicatorVisualizer = ({
  title,
  subtitle,
  variants,
  category = 'momentum',
}: IndicatorVisualizerProps) => {
  const demoBars = generateDemoBars(150);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <Badge className={getCategoryBadge(category)}>{category.charAt(0).toUpperCase() + category.slice(1)} Indicator</Badge>
          </div>
        </div>
        <p className="text-muted-foreground text-lg leading-relaxed">{subtitle}</p>
      </div>

      {/* Variant Tabs */}
      <Tabs defaultValue={variants[0]?.id} className="space-y-6">
        {variants.length > 1 && (
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            {variants.map((variant) => (
              <TabsTrigger key={variant.id} value={variant.id} className="text-sm">
                {variant.name}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        {variants.map((variant) => (
          <TabsContent key={variant.id} value={variant.id} className="space-y-6">
            {/* Interactive Chart */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Live {variant.name} Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<ChartSkeleton />}>
                  <StrategyIndicatorChart
                    bars={demoBars}
                    indicator={variant.indicatorType}
                    title={variant.name}
                    description={variant.description}
                    height={450}
                    showVolume={category === 'volume'}
                  />
                </Suspense>
              </CardContent>
            </Card>

            {/* Overview & Origin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  Overview & History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">{variant.description}</p>
                {variant.origin && (
                  <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm text-muted-foreground italic">{variant.origin}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Formula & Settings */}
            {(variant.formula || variant.defaultSettings) && (
              <div className="grid md:grid-cols-2 gap-6">
                {variant.formula && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calculator className="w-5 h-5 text-purple-400" />
                        Formula
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted/50 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap font-mono">
                        {variant.formula}
                      </pre>
                    </CardContent>
                  </Card>
                )}
                {variant.defaultSettings && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Settings className="w-5 h-5 text-gray-400" />
                        Default Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{variant.defaultSettings}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Interpretation */}
            {variant.interpretation && variant.interpretation.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    How to Interpret
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {variant.interpretation.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">
                          {idx + 1}
                        </span>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Signal Types */}
            {variant.signalTypes && variant.signalTypes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-400" />
                    Signal Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {variant.signalTypes.map((signal, idx) => (
                      <div key={idx} className={`p-4 rounded-lg border ${
                        signal.type === 'bullish' 
                          ? 'border-green-500/30 bg-green-500/10' 
                          : signal.type === 'bearish'
                          ? 'border-red-500/30 bg-red-500/10'
                          : 'border-gray-500/30 bg-gray-500/10'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {signal.type === 'bullish' && <TrendingUp className="w-4 h-4 text-green-400" />}
                          {signal.type === 'bearish' && <TrendingDown className="w-4 h-4 text-red-400" />}
                          {signal.type === 'neutral' && <Activity className="w-4 h-4 text-gray-400" />}
                          <span className="font-semibold">{signal.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{signal.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trading Rules */}
            {variant.tradingRules && (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Trading Rules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                      <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Entry
                      </h4>
                      <p className="text-sm text-muted-foreground">{variant.tradingRules.entry}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                      <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Stop Loss
                      </h4>
                      <p className="text-sm text-muted-foreground">{variant.tradingRules.stopLoss}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" /> Target
                      </h4>
                      <p className="text-sm text-muted-foreground">{variant.tradingRules.target}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Best Context */}
            {variant.bestContext && variant.bestContext.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Best Trading Contexts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {variant.bestContext.map((context, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{context}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Common Mistakes */}
            {variant.commonMistakes && variant.commonMistakes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    Common Mistakes to Avoid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {variant.commonMistakes.map((mistake, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                        <XCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{mistake}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pros and Cons */}
            {variant.prosAndCons && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      Advantages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {variant.prosAndCons.pros.map((pro, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg text-red-400">
                      <XCircle className="w-5 h-5" />
                      Limitations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {variant.prosAndCons.cons.map((con, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Advanced Techniques */}
            {variant.advancedTechniques && variant.advancedTechniques.length > 0 && (
              <Card className="border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    Advanced Techniques
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {variant.advancedTechniques.map((technique, idx) => (
                      <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm font-semibold">
                          {idx + 1}
                        </span>
                        <span className="text-muted-foreground">{technique}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default IndicatorVisualizer;
