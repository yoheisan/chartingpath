import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AlertTriangle
} from 'lucide-react';
import { IndicatorLibrary } from './chartingpath/IndicatorLibrary';
import { SignalBuilder } from './chartingpath/SignalBuilder';
import { StrategyModules } from './chartingpath/StrategyModules';
import { MoneyManagement } from './chartingpath/MoneyManagement';
import { BacktestEngine } from './chartingpath/BacktestEngine';
import { ExportPanel } from './chartingpath/ExportPanel';
import { PresetManager } from './chartingpath/PresetManager';

export interface ChartingPathStrategy {
  id?: string;
  name: string;
  description?: string;
  indicators: any[];
  signals: any[];
  riskManagement: any;
  moneyManagement: any;
  orderTypes: any;
  stopLoss: any;
  takeProfit: any;
  advancedControls: any;
  sessionFilters: any;
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
      name: 'New Professional Strategy',
      description: 'Custom strategy built with ChartingPath Builder',
      indicators: [],
      signals: [],
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
        type: 'atr',
        value: 2.0,
        trailing: false
      },
      takeProfit: {
        type: 'ratio',
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
      }
    }
  );

  const [activeTab, setActiveTab] = useState('indicators');
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestResults, setBacktestResults] = useState(null);

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

  const getCompletionPercentage = () => {
    let completed = 0;
    let total = 6;

    if (strategy.indicators.length > 0) completed++;
    if (strategy.signals.length > 0) completed++;
    if (strategy.riskManagement) completed++;
    if (strategy.moneyManagement) completed++;
    if (strategy.stopLoss && strategy.takeProfit) completed++;
    if (strategy.backtestResults) completed++;

    return (completed / total) * 100;
  };

  const canBacktest = () => {
    return strategy.indicators.length > 0 && strategy.signals.length > 0;
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
                Design, test, and deploy professional trading strategies with visual clarity and smart defaults
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

      {/* Main Builder Interface */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Professional Builder Interface</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure every aspect of your trading strategy with professional-grade tools
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7 mb-6">
              <TabsTrigger value="indicators" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Indicators</span>
              </TabsTrigger>
              <TabsTrigger value="signals" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Signals</span>
              </TabsTrigger>
              <TabsTrigger value="strategy" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Strategy</span>
              </TabsTrigger>
              <TabsTrigger value="money" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Money</span>
              </TabsTrigger>
              <TabsTrigger value="backtest" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Backtest</span>
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </TabsTrigger>
              <TabsTrigger value="presets" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Presets</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="indicators" className="mt-6">
              <IndicatorLibrary
                indicators={strategy.indicators}
                onChange={(indicators) => updateStrategy('indicators', indicators)}
              />
            </TabsContent>

            <TabsContent value="signals" className="mt-6">
              <SignalBuilder
                indicators={strategy.indicators}
                signals={strategy.signals}
                onChange={(signals) => updateStrategy('signals', signals)}
              />
            </TabsContent>

            <TabsContent value="strategy" className="mt-6">
              <StrategyModules
                strategy={strategy}
                onChange={updateStrategy}
              />
            </TabsContent>

            <TabsContent value="money" className="mt-6">
              <MoneyManagement
                settings={strategy.moneyManagement}
                riskSettings={strategy.riskManagement}
                onChange={(data) => {
                  updateStrategy('moneyManagement', data.moneyManagement);
                  updateStrategy('riskManagement', data.riskSettings);
                }}
              />
            </TabsContent>

            <TabsContent value="backtest" className="mt-6">
              <BacktestEngine
                strategy={strategy}
                results={backtestResults}
                isRunning={isBacktesting}
                onBacktest={handleBacktest}
              />
            </TabsContent>

            <TabsContent value="export" className="mt-6">
              <ExportPanel
                strategy={strategy}
              />
            </TabsContent>

            <TabsContent value="presets" className="mt-6">
              <PresetManager
                currentStrategy={strategy}
                onLoadPreset={(preset) => setStrategy(preset)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Status Bar */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span>{strategy.indicators.length} Indicators</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                <span>{strategy.signals.length} Signals</span>
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