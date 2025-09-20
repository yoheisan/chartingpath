import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, TrendingUp, Activity, BarChart3, Zap } from 'lucide-react';
import { GuidedStrategyAnswers } from './GuidedStrategyBuilder';

interface IndicatorBuilderStepProps {
  answers: Partial<GuidedStrategyAnswers>;
  onAnswersChange: (stepKey: keyof GuidedStrategyAnswers, stepAnswers: any) => void;
  subscriptionPlan: string;
}

interface IndicatorConfig {
  id: string;
  type: string;
  name: string;
  parameters: { [key: string]: any };
}

interface TradingCondition {
  id: string;
  type: 'entry' | 'exit';
  direction: 'long' | 'short';
  leftIndicator: string;
  operator: 'crosses_above' | 'crosses_below' | 'greater_than' | 'less_than' | 'equals';
  rightIndicator: string;
  enabled: boolean;
}

const AVAILABLE_INDICATORS = [
  { 
    id: 'ema', 
    name: 'Exponential Moving Average (EMA)', 
    category: 'Trend',
    icon: TrendingUp,
    parameters: { 
      length: { default: 20, min: 1, max: 500, step: 1, label: 'Length' }
    }
  },
  { 
    id: 'sma', 
    name: 'Simple Moving Average (SMA)', 
    category: 'Trend',
    icon: TrendingUp,
    parameters: { 
      length: { default: 20, min: 1, max: 500, step: 1, label: 'Length' }
    }
  },
  { 
    id: 'rsi', 
    name: 'Relative Strength Index (RSI)', 
    category: 'Momentum',
    icon: Activity,
    parameters: { 
      length: { default: 14, min: 2, max: 100, step: 1, label: 'Length' }
    }
  },
  { 
    id: 'macd', 
    name: 'MACD', 
    category: 'Momentum',
    icon: Activity,
    parameters: { 
      fastLength: { default: 12, min: 1, max: 100, step: 1, label: 'Fast Length' },
      slowLength: { default: 26, min: 1, max: 200, step: 1, label: 'Slow Length' },
      signalLength: { default: 9, min: 1, max: 50, step: 1, label: 'Signal Length' }
    }
  },
  { 
    id: 'bollinger_bands', 
    name: 'Bollinger Bands', 
    category: 'Volatility',
    icon: BarChart3,
    parameters: { 
      length: { default: 20, min: 2, max: 100, step: 1, label: 'Length' },
      stdDev: { default: 2.0, min: 0.1, max: 5.0, step: 0.1, label: 'Standard Deviation' }
    }
  },
  { 
    id: 'atr', 
    name: 'Average True Range (ATR)', 
    category: 'Volatility',
    icon: Zap,
    parameters: { 
      length: { default: 14, min: 1, max: 100, step: 1, label: 'Length' }
    }
  },
  { 
    id: 'stoch', 
    name: 'Stochastic Oscillator', 
    category: 'Momentum',
    icon: Activity,
    parameters: { 
      kPeriod: { default: 14, min: 1, max: 100, step: 1, label: 'K Period' },
      dPeriod: { default: 3, min: 1, max: 50, step: 1, label: 'D Period' },
      smooth: { default: 3, min: 1, max: 50, step: 1, label: 'Smoothing' }
    }
  }
];

const OPERATORS = [
  { id: 'crosses_above', label: 'Crosses Above', description: 'When indicator A crosses above indicator B' },
  { id: 'crosses_below', label: 'Crosses Below', description: 'When indicator A crosses below indicator B' },
  { id: 'greater_than', label: 'Greater Than', description: 'When indicator A is greater than indicator B' },
  { id: 'less_than', label: 'Less Than', description: 'When indicator A is less than indicator B' },
  { id: 'equals', label: 'Equals', description: 'When indicator A equals indicator B (within tolerance)' }
];

export const IndicatorBuilderStep: React.FC<IndicatorBuilderStepProps> = ({
  answers,
  onAnswersChange
}) => {
  const currentAnswers = answers.style || {
    indicators: [] as IndicatorConfig[],
    conditions: [] as TradingCondition[]
  };

  const [indicators, setIndicators] = useState<IndicatorConfig[]>(currentAnswers.indicators || []);
  const [conditions, setConditions] = useState<TradingCondition[]>(currentAnswers.conditions || []);

  const updateAnswers = () => {
    const newAnswers = {
      ...currentAnswers,
      indicators,
      conditions,
      approach: 'custom' // Set approach as custom for the new system
    };
    onAnswersChange('style', newAnswers);
  };

  React.useEffect(() => {
    updateAnswers();
  }, [indicators, conditions]);

  const addIndicator = (indicatorType: string) => {
    const indicatorDef = AVAILABLE_INDICATORS.find(i => i.id === indicatorType);
    if (!indicatorDef) return;

    const newIndicator: IndicatorConfig = {
      id: `${indicatorType}_${Date.now()}`,
      type: indicatorType,
      name: `${indicatorDef.name} #${indicators.filter(i => i.type === indicatorType).length + 1}`,
      parameters: Object.fromEntries(
        Object.entries(indicatorDef.parameters).map(([key, param]) => [key, param.default])
      )
    };

    setIndicators([...indicators, newIndicator]);
  };

  const removeIndicator = (indicatorId: string) => {
    setIndicators(indicators.filter(i => i.id !== indicatorId));
    // Remove conditions that reference this indicator
    setConditions(conditions.filter(c => 
      c.leftIndicator !== indicatorId && c.rightIndicator !== indicatorId
    ));
  };

  const updateIndicatorParameter = (indicatorId: string, paramKey: string, value: any) => {
    setIndicators(indicators.map(indicator => 
      indicator.id === indicatorId 
        ? { 
            ...indicator, 
            parameters: { ...indicator.parameters, [paramKey]: value }
          }
        : indicator
    ));
  };

  const addCondition = () => {
    if (indicators.length < 2) return;

    const newCondition: TradingCondition = {
      id: `condition_${Date.now()}`,
      type: 'entry',
      direction: 'long',
      leftIndicator: indicators[0].id,
      operator: 'crosses_above',
      rightIndicator: indicators[1].id,
      enabled: true
    };

    setConditions([...conditions, newCondition]);
  };

  const removeCondition = (conditionId: string) => {
    setConditions(conditions.filter(c => c.id !== conditionId));
  };

  const updateCondition = (conditionId: string, field: keyof TradingCondition, value: any) => {
    setConditions(conditions.map(condition =>
      condition.id === conditionId
        ? { ...condition, [field]: value }
        : condition
    ));
  };

  const getIndicatorOptions = () => {
    return indicators.map(indicator => ({
      value: indicator.id,
      label: indicator.name
    }));
  };

  return (
    <div className="space-y-6">
      {/* Indicators Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Technical Indicators
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select and configure the technical indicators for your strategy
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add Indicator Dropdown */}
            <div className="flex gap-2">
              <Select onValueChange={addIndicator}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select indicator to add..." />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_INDICATORS.map(indicator => (
                    <SelectItem key={indicator.id} value={indicator.id}>
                      <div className="flex items-center gap-2">
                        <indicator.icon className="w-4 h-4" />
                        {indicator.name}
                        <Badge variant="outline" className="ml-auto">
                          {indicator.category}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Indicators */}
            {indicators.length > 0 && (
              <div className="space-y-3">
                {indicators.map(indicator => {
                  const indicatorDef = AVAILABLE_INDICATORS.find(i => i.id === indicator.type);
                  if (!indicatorDef) return null;

                  return (
                    <Card key={indicator.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <indicatorDef.icon className="w-4 h-4" />
                            <span className="font-medium">{indicator.name}</span>
                            <Badge variant="outline">{indicatorDef.category}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIndicator(indicator.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Parameters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {Object.entries(indicatorDef.parameters).map(([paramKey, param]) => (
                            <div key={paramKey}>
                              <Label className="text-xs">{param.label}</Label>
                              <Input
                                type="number"
                                value={indicator.parameters[paramKey]}
                                min={param.min}
                                max={param.max}
                                step={param.step}
                                onChange={(e) => updateIndicatorParameter(
                                  indicator.id, 
                                  paramKey, 
                                  parseFloat(e.target.value)
                                )}
                                className="mt-1"
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trading Conditions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Trading Conditions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Define entry and exit conditions using your selected indicators
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add Condition Button */}
            <Button 
              onClick={addCondition} 
              disabled={indicators.length < 2}
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Trading Condition
            </Button>

            {indicators.length < 2 && (
              <p className="text-sm text-muted-foreground text-center">
                Add at least 2 indicators to create trading conditions
              </p>
            )}

            {/* Conditions List */}
            {conditions.map(condition => (
              <Card key={condition.id} className="border-l-4 border-l-accent">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={condition.type === 'entry' ? 'default' : 'secondary'}>
                        {condition.type}
                      </Badge>
                      <Badge variant={condition.direction === 'long' ? 'default' : 'destructive'}>
                        {condition.direction}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(condition.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    {/* Condition Type */}
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={condition.type}
                        onValueChange={(value) => updateCondition(condition.id, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry">Entry</SelectItem>
                          <SelectItem value="exit">Exit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Direction */}
                    <div>
                      <Label className="text-xs">Direction</Label>
                      <Select
                        value={condition.direction}
                        onValueChange={(value) => updateCondition(condition.id, 'direction', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="long">Long</SelectItem>
                          <SelectItem value="short">Short</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Left Indicator */}
                    <div>
                      <Label className="text-xs">When</Label>
                      <Select
                        value={condition.leftIndicator}
                        onValueChange={(value) => updateCondition(condition.id, 'leftIndicator', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getIndicatorOptions().map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Operator */}
                    <div>
                      <Label className="text-xs">Condition</Label>
                      <Select
                        value={condition.operator}
                        onValueChange={(value) => updateCondition(condition.id, 'operator', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATORS.map(op => (
                            <SelectItem key={op.id} value={op.id}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Right Indicator */}
                    <div>
                      <Label className="text-xs">Than</Label>
                      <Select
                        value={condition.rightIndicator}
                        onValueChange={(value) => updateCondition(condition.id, 'rightIndicator', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getIndicatorOptions().map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {(indicators.length > 0 || conditions.length > 0) && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Activity className="w-4 h-4" />
              <span className="font-medium">Strategy Configuration</span>
            </div>
            <div className="text-sm space-y-1">
              <p><strong>Indicators:</strong> {indicators.length} configured</p>
              <p><strong>Conditions:</strong> {conditions.length} trading rules defined</p>
              <p><strong>Status:</strong> {indicators.length > 0 && conditions.length > 0 ? 'Ready for backtesting' : 'Add conditions to complete'}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};