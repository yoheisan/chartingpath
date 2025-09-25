import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  TrendingUp, 
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
import { SignalBuilder } from './chartingpath/SignalBuilder';
import { StrategyModules } from './chartingpath/StrategyModules';
import { MoneyManagement } from './chartingpath/MoneyManagement';
import { EnhancedBacktestEngine } from './chartingpath/EnhancedBacktestEngine';
import { ExportPanel } from './chartingpath/ExportPanel';
import { PresetManager } from './chartingpath/PresetManager';

export interface ChartingPathStrategy {
  id?: string;
  name: string;
  description?: string;
  market?: {
    instrumentCategory: string;
    instrument: string;
    timeframes: string[];
    tradingHours: string;
  };
  patterns: any[];
  indicators: any[];
  signals: any[];
  riskManagement: any;
  moneyManagement: any;
  orderTypes: any;
  stopLoss: any;
  takeProfit: any;
  advancedControls: any;
  sessionFilters: any;
  multiPatternSettings: {
    maxConcurrentPatterns: number;
    patternPriority: 'first' | 'highest_probability' | 'risk_reward';
    deduplication: boolean;
    portfolioRiskCap: number;
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
      name: 'New Professional Pattern Strategy',
      description: 'Multi-pattern strategy built with ChartingPath Builder',
      patterns: [],
      indicators: [],
      signals: [],
      market: {
        instrumentCategory: 'forex',
        instrument: '',
        timeframes: [],
        tradingHours: 'london-ny'
      },
      riskManagement: {
        riskPerTrade: 2.0,
        maxDrawdown: 10.0,
        maxTradesPerDay: 5,
        positionSizing: 'fixed_percent'
      },
      moneyManagement: {
        method: 'fixed_percent',
        amount: 2.0,
        scaling: false,
        martingale: false
      },
      orderTypes: {
        market: true,
        limit: false,
        stop: false,
        pending: false
      },
      stopLoss: {
        type: 'pattern',
        value: 2.0,
        trailing: false
      },
      takeProfit: {
        type: 'pattern',
        value: 2.0,
        trailing: false
      },
      advancedControls: {
        maxLifespan: 0,
        maxSpread: 0,
        pipGap: 0,
        timeGap: 0
      },
      sessionFilters: {
        enabled: false,
        sessions: [],
        excludeNews: false
      },
      multiPatternSettings: {
        maxConcurrentPatterns: 3,
        patternPriority: 'highest_probability',
        deduplication: true,
        portfolioRiskCap: 6.0
      }
    }
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestResults, setBacktestResults] = useState(null);

  const steps = [
    { id: 'market', title: 'Market Selection', description: 'Choose financial asset & timeframe' },
    { id: 'patterns', title: 'Pattern Selection', description: 'Select chart patterns to trade' },
    { id: 'money', title: 'Money Management', description: 'Configure risk & position sizing' },
    { id: 'backtest', title: 'Backtest & Optimize', description: 'Test strategy performance' },
    { id: 'export', title: 'Export Strategy', description: 'Generate trading code' }
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
      case 0: // Market
        return strategy.market?.instrument && strategy.market?.timeframes?.length > 0;
      case 1: // Patterns
        return strategy.patterns.length > 0 && strategy.patterns.some(p => p.enabled);
      case 2: // Money Management
        return strategy.riskManagement && strategy.moneyManagement;
      case 3: // Backtest
        return strategy.backtestResults != null;
      case 4: // Export
        return getStepCompletion(1) && getStepCompletion(2); // Can export if patterns and money mgmt are set
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
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                ChartingPath Strategy Builder
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Build multi-pattern trading strategies using professional chart patterns with the Detect → Confirm → Enter → Manage → Invalidate framework
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
                  <h3 className="text-lg font-semibold">Step 1: Market Selection</h3>
                </div>
                <MarketStep
                  answers={{ market: strategy.market }}
                  onAnswersChange={(_, data) => updateStrategy('market', data)}
                  subscriptionPlan="professional"
                />
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Step 2: Pattern Selection</h3>
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
                        <span>Please complete Market Selection first</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Step 3: Money Management</h3>
                </div>
                {getStepCompletion(1) ? (
                  <MoneyManagement
                    settings={strategy.moneyManagement}
                    riskSettings={strategy.riskManagement}
                    onChange={(data) => {
                      updateStrategy('moneyManagement', data.moneyManagement);
                      updateStrategy('riskManagement', data.riskSettings);
                    }}
                  />
                ) : (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Please complete Pattern Selection first</span>
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
                  <h3 className="text-lg font-semibold">Step 4: Backtest & Optimize</h3>
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
                        <span>Please complete Money Management setup first</span>
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
                        <span>Please complete Pattern Selection and Money Management first</span>
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
                <Zap className="w-4 h-4 text-accent" />
                <span>{strategy.signals.length} Signals</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span>Max {strategy.multiPatternSettings?.maxConcurrentPatterns || 3} Concurrent</span>
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