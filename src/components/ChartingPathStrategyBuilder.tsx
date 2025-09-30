import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  TrendingUp,
  TrendingDown,
  Shield, 
  DollarSign, 
  Target, 
  Download,
  Play,
  Save,
  Share,
  Settings,
  Zap,
  BarChart3,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Globe,
  CheckCircle
} from 'lucide-react';
import { MarketStep } from './guided-strategy/MarketStep';
import { PatternLibrary } from './chartingpath/PatternLibrary';
import { TargetStopLossSettings } from './chartingpath/TargetStopLossSettings';
import { EnhancedBacktestEngine } from './chartingpath/EnhancedBacktestEngine';
import { ExportPanel } from './chartingpath/ExportPanel';

export interface ChartingPathStrategy {
  id?: string;
  name: string;
  description?: string;
  market?: {
    instrumentCategory: string;
    instrument: string;
    timeframes: string[]; // Array to match MarketStep component
    tradingHours: string;
  };
  patterns: any[]; // Selected chart patterns to trade
  targetGainPercent: number; // Target profit in %
  stopLossPercent: number; // Stop loss in %
  positionSizing: {
    method: 'fixed_percent' | 'fixed_amount' | 'risk_based';
    riskPerTrade: number; // % of account to risk per trade
    maxPositions: number; // Max concurrent positions
  };
  backtestResults?: any;
  created_at?: Date;
  updated_at?: Date;
}

interface ChartingPathStrategyBuilderProps {
  initialStrategy?: ChartingPathStrategy;
  onSave?: (strategy: ChartingPathStrategy) => void;
  onBacktest?: (strategy: ChartingPathStrategy) => Promise<any>;
}

export const ChartingPathStrategyBuilder: React.FC<ChartingPathStrategyBuilderProps> = ({
  initialStrategy,
  onSave,
  onBacktest
}) => {
  const [strategy, setStrategy] = useState<ChartingPathStrategy>(
    initialStrategy || {
      name: 'New Chart Pattern Strategy',
      description: 'Pattern-based trading strategy',
      patterns: [],
      targetGainPercent: 3.0,
      stopLossPercent: 1.5,
      market: {
        instrumentCategory: 'forex',
        instrument: '',
        timeframes: ['1H'],
        tradingHours: 'london-ny'
      },
      positionSizing: {
        method: 'risk_based',
        riskPerTrade: 2.0,
        maxPositions: 3
      }
    }
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestResults, setBacktestResults] = useState(null);

  const steps = [
    { id: 'market', title: 'Asset & Timeframe', description: 'Select financial instrument & chart period' },
    { id: 'patterns', title: 'Chart Patterns', description: 'Choose patterns to trade' },
    { id: 'targets', title: 'Target & Stop Loss', description: 'Set profit target % and stop loss %' },
    { id: 'backtest', title: 'Backtest', description: 'Test pattern performance' },
    { id: 'export', title: 'Export', description: 'Generate trading code' }
  ];

  const updateStrategy = (section: keyof ChartingPathStrategy, data: any) => {
    setStrategy(prev => ({
      ...prev,
      [section]: data,
      updated_at: new Date()
    }));
  };

  const handleBacktest = async () => {
    setIsBacktesting(true);
    try {
      const results = await onBacktest?.(strategy);
      setBacktestResults(results);
      updateStrategy('backtestResults', results);
    } catch (error) {
      console.error('Backtest failed:', error);
    } finally {
      setIsBacktesting(false);
    }
  };

  const handleSave = () => {
    onSave?.(strategy);
  };

  const getStepCompletion = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Market & Timeframe
        return strategy.market?.instrument && strategy.market?.timeframes?.length > 0;
      case 1: // Patterns
        return strategy.patterns.length > 0 && strategy.patterns.some(p => p.enabled);
      case 2: // Target & Stop Loss
        return strategy.targetGainPercent > 0 && strategy.stopLossPercent > 0;
      case 3: // Backtest
        return strategy.backtestResults != null;
      case 4: // Export
        return getStepCompletion(1) && getStepCompletion(2);
      default:
        return false;
    }
  };

  const canProceedToStep = (stepIndex: number) => {
    if (stepIndex === 0) return true;
    return getStepCompletion(stepIndex - 1);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1 && canProceedToStep(currentStep + 1)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (canProceedToStep(stepIndex)) {
      setCurrentStep(stepIndex);
    }
  };

  const getCompletionPercentage = () => {
    const completedSteps = steps.filter((_, index) => getStepCompletion(index)).length;
    return (completedSteps / steps.length) * 100;
  };

  const canBacktest = () => {
    return getStepCompletion(0) && getStepCompletion(1); // Market + Patterns selected
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                Chart Pattern Strategy Builder
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Build pattern-based strategies by selecting chart patterns, setting target % gains and stop loss %, then backtest and export
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-background">
                Professional v2.0
              </Badge>
              <Badge 
                variant={getCompletionPercentage() === 100 ? "default" : "secondary"}
                className="px-3"
              >
                {Math.round(getCompletionPercentage())}% Complete
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Strategy Configuration Progress</span>
              <span>{Math.round(getCompletionPercentage())}%</span>
            </div>
            <Progress value={getCompletionPercentage()} className="h-2" />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={handleSave}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Strategy
            </Button>
            
            <Button
              onClick={handleBacktest}
              disabled={!canBacktest() || isBacktesting}
              size="sm"
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {isBacktesting ? 'Backtesting...' : 'Quick Test'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Share className="w-4 h-4" />
              Share
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Step-Based Builder Interface */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Professional Strategy Builder</CardTitle>
          <p className="text-sm text-muted-foreground">
            Follow the step-by-step process to build your professional trading strategy
          </p>
        </CardHeader>
        <CardContent>
          {/* Step Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <Button
                    variant={index === currentStep ? "default" : getStepCompletion(index) ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => goToStep(index)}
                    disabled={!canProceedToStep(index)}
                    className={`flex items-center gap-2 ${
                      index === currentStep ? 'bg-primary text-primary-foreground' : 
                      getStepCompletion(index) ? 'bg-green-50 border-green-200 text-green-700' : 
                      'text-muted-foreground'
                    }`}
                  >
                    {getStepCompletion(index) ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-current/10 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                    )}
                    <span className="hidden md:inline">{step.title}</span>
                  </Button>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Step 1: Select Financial Instrument & Timeframe</h3>
                </div>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <MarketStep
                      answers={{ market: strategy.market }}
                      onAnswersChange={(_, data) => updateStrategy('market', data)}
                      subscriptionPlan="professional"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Step 2: Select Chart Patterns to Trade</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {strategy.patterns.filter(p => p.enabled).length} Selected
                  </Badge>
                </div>
                {getStepCompletion(0) ? (
                  <PatternLibrary
                    patterns={strategy.patterns}
                    onChange={(patterns) => updateStrategy('patterns', patterns)}
                  />
                ) : (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Please select a financial instrument and timeframe first</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Step 3: Set Target % Gain & Stop Loss %</h3>
                </div>
                {getStepCompletion(1) ? (
                  <TargetStopLossSettings
                    targetGainPercent={strategy.targetGainPercent}
                    stopLossPercent={strategy.stopLossPercent}
                    positionSizing={strategy.positionSizing}
                    onChange={(data) => {
                      updateStrategy('targetGainPercent', data.targetGainPercent);
                      updateStrategy('stopLossPercent', data.stopLossPercent);
                      updateStrategy('positionSizing', data.positionSizing);
                    }}
                  />
                ) : (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Please select chart patterns first</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Step 4: Backtest Pattern Strategy</h3>
                </div>
                {getStepCompletion(2) ? (
                  <EnhancedBacktestEngine
                    strategy={strategy}
                    results={backtestResults}
                    isRunning={isBacktesting}
                    onBacktest={handleBacktest}
                  />
                ) : (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Please set target % and stop loss % first</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Download className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Step 5: Export Strategy</h3>
                </div>
                {getStepCompletion(1) && getStepCompletion(2) ? (
                  <ExportPanel strategy={strategy} />
                ) : (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Please complete pattern selection and target/stop loss setup first</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>

            <Button
              onClick={nextStep}
              disabled={currentStep === steps.length - 1 || !getStepCompletion(currentStep)}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Bar */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span>{strategy.patterns.length} Patterns</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>Target: {strategy.targetGainPercent}%</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span>Stop: {strategy.stopLossPercent}%</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span>Risk: {strategy.positionSizing.riskPerTrade}% / trade</span>
              </div>
              {backtestResults && (
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-green-500" />
                  <span>Backtest Complete</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Last updated: {strategy.updated_at ? new Date(strategy.updated_at).toLocaleTimeString() : 'Never'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};