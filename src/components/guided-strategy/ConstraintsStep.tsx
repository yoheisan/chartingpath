import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, Calendar, AlertTriangle, Shield, HelpCircle } from 'lucide-react';
import { GuidedStrategyAnswers } from '../GuidedStrategyBuilder';

interface ConstraintsStepProps {
  answers: Partial<GuidedStrategyAnswers>;
  onAnswersChange: (stepKey: keyof GuidedStrategyAnswers, stepAnswers: any) => void;
  subscriptionPlan: string;
}

const tradingHours = [
  { id: 'asia', label: 'Asian Session', desc: '00:00-09:00 GMT' },
  { id: 'london', label: 'London Session', desc: '08:00-17:00 GMT' },
  { id: 'newyork', label: 'New York Session', desc: '13:00-22:00 GMT' },
  { id: 'overlap_london_ny', label: 'London-NY Overlap', desc: '13:00-17:00 GMT' },
  { id: 'after_hours', label: 'After Hours', desc: 'Outside main sessions' },
];

const marketConditions = [
  { id: 'trending', label: 'Trending Markets', desc: 'Clear directional moves' },
  { id: 'ranging', label: 'Ranging Markets', desc: 'Sideways price action' },
  { id: 'high_volatility', label: 'High Volatility', desc: 'Large price swings' },
  { id: 'low_volatility', label: 'Low Volatility', desc: 'Quiet market periods' },
  { id: 'news_events', label: 'News Events', desc: 'Economic announcements' },
  { id: 'earnings', label: 'Earnings Season', desc: 'Company earnings reports' },
];

const excludedPeriods = [
  { id: 'major_holidays', label: 'Major Holidays', desc: 'Christmas, New Year, etc.' },
  { id: 'low_liquidity', label: 'Low Liquidity Periods', desc: 'Summer months, etc.' },
  { id: 'high_impact_news', label: 'High Impact News', desc: 'NFP, FOMC, etc.' },
  { id: 'market_open_close', label: 'Market Open/Close', desc: 'First/last 30 minutes' },
  { id: 'weekends', label: 'Weekend Gaps', desc: 'Sunday/Monday gaps' },
  { id: 'month_end', label: 'Month End', desc: 'Last 3 days of month' },
];

export const ConstraintsStep: React.FC<ConstraintsStepProps> = ({
  answers,
  onAnswersChange,
  subscriptionPlan
}) => {
  const currentAnswers = answers.constraints || {
    tradingHours: [],
    marketConditions: [],
    excludedPeriods: []
  };

  const handleToggleItem = (category: keyof typeof currentAnswers, item: string) => {
    const currentItems = currentAnswers[category] || [];
    const newItems = currentItems.includes(item)
      ? currentItems.filter(i => i !== item)
      : [...currentItems, item];
    
    onAnswersChange('constraints', {
      ...currentAnswers,
      [category]: newItems
    });
  };

  const getTotalSelected = () => {
    return (currentAnswers.tradingHours?.length || 0) + 
           (currentAnswers.marketConditions?.length || 0) + 
           (currentAnswers.excludedPeriods?.length || 0);
  };

  const isComplete = getTotalSelected() > 0;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Trading Constraints & Rules
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Constraints define when your strategy should <strong>NOT</strong> trade to avoid unfavorable conditions. 
                    <strong>Trading Hours</strong> limit active periods, <strong>Market Conditions</strong> specify favorable environments, 
                    <strong>Excluded Periods</strong> avoid high-risk times like news events or low liquidity periods.
                  </p>
                </TooltipContent>
              </Tooltip>
              <Badge variant="secondary" className="ml-2">
                {getTotalSelected()} constraints
              </Badge>
            </CardTitle>
          </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Trading Hours */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <h3 className="font-medium text-lg">Preferred Trading Hours</h3>
              <Badge variant="outline" className="text-xs">
                {currentAnswers.tradingHours?.length || 0} selected
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Select when you want your strategy to be active. Leave empty for 24/7 trading.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tradingHours.map((hour) => (
                <Button
                  key={hour.id}
                  variant={currentAnswers.tradingHours?.includes(hour.id) ? "default" : "outline"}
                  className="h-auto p-3 flex flex-col items-start text-left"
                  onClick={() => handleToggleItem('tradingHours', hour.id)}
                >
                  <span className="font-medium">{hour.label}</span>
                  <span className="text-xs text-muted-foreground">{hour.desc}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Market Conditions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <h3 className="font-medium text-lg">Market Conditions</h3>
              <Badge variant="outline" className="text-xs">
                {currentAnswers.marketConditions?.length || 0} selected
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose which market conditions your strategy should trade in.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {marketConditions.map((condition) => (
                <Button
                  key={condition.id}
                  variant={currentAnswers.marketConditions?.includes(condition.id) ? "default" : "outline"}
                  className="h-auto p-3 flex flex-col items-start text-left"
                  onClick={() => handleToggleItem('marketConditions', condition.id)}
                >
                  <span className="font-medium">{condition.label}</span>
                  <span className="text-xs text-muted-foreground">{condition.desc}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Excluded Periods */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="font-medium text-lg">Periods to Avoid</h3>
              <Badge variant="outline" className="text-xs">
                {currentAnswers.excludedPeriods?.length || 0} selected
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Select periods when your strategy should not trade to avoid risky conditions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {excludedPeriods.map((period) => (
                <Button
                  key={period.id}
                  variant={currentAnswers.excludedPeriods?.includes(period.id) ? "default" : "outline"}
                  className="h-auto p-3 flex flex-col items-start text-left"
                  onClick={() => handleToggleItem('excludedPeriods', period.id)}
                >
                  <span className="font-medium">{period.label}</span>
                  <span className="text-xs text-muted-foreground">{period.desc}</span>
                </Button>
              ))}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Constraints Summary */}
      {getTotalSelected() > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                  Trading Constraints Summary
                </h4>
                <div className="space-y-2 text-sm text-orange-700 dark:text-orange-300">
                  {currentAnswers.tradingHours && currentAnswers.tradingHours.length > 0 && (
                    <div>
                      <span className="font-medium">Active Hours:</span> {currentAnswers.tradingHours.length} sessions selected
                    </div>
                  )}
                  {currentAnswers.marketConditions && currentAnswers.marketConditions.length > 0 && (
                    <div>
                      <span className="font-medium">Market Conditions:</span> {currentAnswers.marketConditions.length} conditions selected
                    </div>
                  )}
                  {currentAnswers.excludedPeriods && currentAnswers.excludedPeriods.length > 0 && (
                    <div>
                      <span className="font-medium">Excluded Periods:</span> {currentAnswers.excludedPeriods.length} periods to avoid
                    </div>
                  )}
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                  These constraints will help ensure your strategy trades only in favorable conditions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Default message if no constraints */}
      {getTotalSelected() === 0 && (
        <Card className="border-muted bg-muted/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-medium text-muted-foreground mb-2">
                  No Constraints Selected
                </h4>
                <p className="text-sm text-muted-foreground">
                  Your strategy will trade 24/7 in all market conditions. You can add constraints to improve risk management.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-primary">
            <Shield className="w-4 h-4" />
            <span className="font-medium">Constraints Configured!</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {getTotalSelected() > 0 
              ? `${getTotalSelected()} trading constraints have been set.`
              : 'Strategy will trade with minimal constraints.'}
          </p>
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  );
};