import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart3, TrendingUp, Activity, Filter, Eye, Info, HelpCircle } from 'lucide-react';
import { GuidedStrategyAnswers } from '../GuidedStrategyBuilder';

interface ToolsStepProps {
  answers: Partial<GuidedStrategyAnswers>;
  onAnswersChange: (stepKey: keyof GuidedStrategyAnswers, stepAnswers: any) => void;
  subscriptionPlan: string;
}

const indicatorCategories = {
  trend: {
    label: 'Trend Indicators',
    icon: TrendingUp,
    items: ['Moving Average', 'EMA', 'MACD', 'ADX', 'Parabolic SAR', 'Supertrend']
  },
  momentum: {
    label: 'Momentum Oscillators', 
    icon: Activity,
    items: ['RSI', 'Stochastic', 'CCI', 'Williams %R', 'Ultimate Oscillator', 'ROC']
  },
  volume: {
    label: 'Volume Indicators',
    icon: BarChart3,
    items: ['Volume MA', 'OBV', 'Chaikin MF', 'Volume Profile', 'VWAP', 'A/D Line']
  },
  volatility: {
    label: 'Volatility Indicators',
    icon: Eye,
    items: ['Bollinger Bands', 'ATR', 'Keltner Channels', 'Donchian Channels', 'VIX']
  }
};

const patterns = [
  'Double Top/Bottom', 'Head & Shoulders', 'Triangle', 'Flag/Pennant', 
  'Wedge', 'Cup & Handle', 'Doji', 'Hammer', 'Shooting Star', 'Engulfing'
];

const filters = [
  'Time of Day', 'Day of Week', 'Market Session', 'Economic News', 
  'Volatility Filter', 'Trend Filter', 'Volume Filter', 'Correlation Filter'
];

export const ToolsStep: React.FC<ToolsStepProps> = ({
  answers,
  onAnswersChange,
  subscriptionPlan
}) => {
  const currentAnswers = answers.tools || {
    indicators: [],
    patterns: [],
    filters: []
  };

  const handleToggleItem = (category: keyof typeof currentAnswers, item: string) => {
    const currentItems = currentAnswers[category] || [];
    const newItems = currentItems.includes(item)
      ? currentItems.filter(i => i !== item)
      : [...currentItems, item];
    
    onAnswersChange('tools', {
      ...currentAnswers,
      [category]: newItems
    });
  };

  const getTotalSelected = () => {
    return (currentAnswers.indicators?.length || 0) + 
           (currentAnswers.patterns?.length || 0) + 
           (currentAnswers.filters?.length || 0);
  };

  const isComplete = getTotalSelected() > 0;

  return (
    <TooltipProvider>
      <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Technical Analysis Tools
            <Badge variant="secondary" className="ml-2">
              {getTotalSelected()} selected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Technical Indicators */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Technical Indicators</h3>
            {Object.entries(indicatorCategories).map(([key, category]) => {
              const Icon = category.icon;
              return (
                <div key={key} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <h4 className="font-medium">{category.label}</h4>
                    <Badge variant="outline" className="text-xs">
                      {currentAnswers.indicators?.filter(ind => category.items.includes(ind)).length || 0} selected
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    {category.items.map((indicator) => (
                      <Button
                        key={indicator}
                        variant={currentAnswers.indicators?.includes(indicator) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleItem('indicators', indicator)}
                      >
                        {indicator}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Chart Patterns */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <h3 className="font-medium text-lg">Chart Patterns</h3>
              <Badge variant="outline" className="text-xs">
                {currentAnswers.patterns?.length || 0} selected
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {patterns.map((pattern) => (
                <Button
                  key={pattern}
                  variant={currentAnswers.patterns?.includes(pattern) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToggleItem('patterns', pattern)}
                >
                  {pattern}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Filters */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <h3 className="font-medium text-lg">Market Filters</h3>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <div className="space-y-2">
                    <p className="text-sm">
                      Filters act as exclusions: when selected, entries are blocked while the condition is unfavorable.
                    </p>
                    <ul className="list-disc pl-4 text-sm space-y-1">
                      <li><strong>Volatility Filter:</strong> Avoid extremes; trade only when volatility sits within a normal band.</li>
                      <li><strong>Trend Filter:</strong> Align with trend (e.g., allow longs only when price is above a chosen MA/EMA).</li>
                      <li><strong>Volume Filter:</strong> Skip low-liquidity periods; require minimum volume to enter.</li>
                      <li><strong>Correlation Filter:</strong> Block new entries highly correlated with existing positions.</li>
                      <li><strong>Time/Day/Session:</strong> Trade only inside selected windows; block outside.</li>
                      <li><strong>Economic News:</strong> Pause entries around high-impact releases (buffer window).</li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
              <Badge variant="outline" className="text-xs">
                {currentAnswers.filters?.length || 0} selected
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {filters.map((filter) => (
                <Button
                  key={filter}
                  variant={currentAnswers.filters?.includes(filter) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToggleItem('filters', filter)}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Tools Summary */}
      {getTotalSelected() > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Selected Analysis Tools
                </h4>
                <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  {currentAnswers.indicators && currentAnswers.indicators.length > 0 && (
                    <div>
                      <span className="font-medium">Indicators:</span> {currentAnswers.indicators.join(', ')}
                    </div>
                  )}
                  {currentAnswers.patterns && currentAnswers.patterns.length > 0 && (
                    <div>
                      <span className="font-medium">Patterns:</span> {currentAnswers.patterns.join(', ')}
                    </div>
                  )}
                  {currentAnswers.filters && currentAnswers.filters.length > 0 && (
                    <div>
                      <span className="font-medium">Filters:</span> {currentAnswers.filters.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isComplete && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-primary">
              <BarChart3 className="w-4 h-4" />
              <span className="font-medium">Analysis Tools Selected!</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {getTotalSelected()} tools selected for your strategy analysis.
            </p>
          </CardContent>
        </Card>
       )}
      </div>
    </TooltipProvider>
  );
};