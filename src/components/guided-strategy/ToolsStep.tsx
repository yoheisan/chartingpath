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
    patterns: [],
    filters: []
  };

  const handleToggleItem = (category: 'patterns' | 'filters', item: string) => {
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
    return (currentAnswers.patterns?.length || 0) + 
           (currentAnswers.filters?.length || 0);
  };

  const isComplete = getTotalSelected() > 0;

  return (
    <TooltipProvider>
      <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Analysis Tools
            <Badge variant="secondary" className="ml-2">
              {getTotalSelected()} selected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Chart Patterns */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <h3 className="font-medium text-lg">Chart Patterns</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Chart patterns predict price movements based on historical formations. 
                    <strong>Reversal patterns</strong> (Double Top, Head & Shoulders) signal trend changes, 
                    <strong>Continuation patterns</strong> (Flags, Triangles) suggest trend persistence, 
                    <strong>Candlestick patterns</strong> (Doji, Hammer) provide short-term signals.
                  </p>
                </TooltipContent>
              </Tooltip>
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
                      <li><strong>Trend Filter:</strong> Block counter-trend trades (e.g., no longs in downtrend below MA, no shorts in uptrend above MA).</li>
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