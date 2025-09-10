import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  TrendingUp, 
  Settings, 
  Zap, 
  ArrowRight,
  BookOpen,
  Play
} from 'lucide-react';
import { GuidedStrategyBuilder, GuidedStrategyAnswers } from './GuidedStrategyBuilder';
import { GuidedStrategyManager } from './GuidedStrategyManager';
import { UnifiedBacktestEngine } from './UnifiedBacktestEngine';
import BacktestResults from './BacktestResults';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';

interface SavedStrategy {
  id: string;
  name: string;
  answers: GuidedStrategyAnswers;
  backtest_results?: any;
}

export const StrategyWorkspaceInterface: React.FC = () => {
  const { user, subscriptionPlan } = useUserProfile();
  const [activeTab, setActiveTab] = useState('builder');
  const [currentStrategy, setCurrentStrategy] = useState<SavedStrategy | null>(null);
  const [strategyAnswers, setStrategyAnswers] = useState<GuidedStrategyAnswers>({
    market: { timeframes: [] },
    riskTolerance: { accountPrinciple: 10000, leverage: 1, maxDrawdown: 10, riskPerTrade: 2 },
    reward: { targetReturn: 15, winRate: 65, riskRewardRatio: 2 },
    style: { approach: '' }
  });
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);

  // Load strategy when selected from manager
  const handleLoadStrategy = (strategy: SavedStrategy) => {
    setCurrentStrategy(strategy);
    setStrategyAnswers(strategy.answers);
    if (strategy.backtest_results) {
      setBacktestResults(strategy.backtest_results);
    }
    setActiveTab('builder');
    toast.success(`Loaded strategy: ${strategy.name}`);
  };

  // Update current strategy when answers change
  const handleAnswersChange = (answers: GuidedStrategyAnswers) => {
    setStrategyAnswers(answers);
    if (currentStrategy) {
      setCurrentStrategy({
        ...currentStrategy,
        answers
      });
    }
  };

  // Handle strategy save from builder
  const handleStrategySaved = (strategy: SavedStrategy) => {
    setCurrentStrategy(strategy);
    toast.success('Strategy saved successfully!');
  };

  // Navigate to backtest tab when strategy is ready
  const handleMoveToBacktest = () => {
    if (!strategyAnswers.market?.timeframes || strategyAnswers.market.timeframes.length === 0 || !strategyAnswers.style?.approach) {
      toast.error('Please complete the strategy building process first');
      return;
    }
    setActiveTab('backtest');
  };

  // Handle backtest completion
  const handleBacktestComplete = (results: any) => {
    setBacktestResults(results);
    setActiveTab('results');
  };

  const isStrategyComplete = () => {
    return !!(strategyAnswers.market?.timeframes && strategyAnswers.market.timeframes.length > 0 && strategyAnswers.style?.approach);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            Strategy Workspace
            <Badge className="bg-gradient-to-r from-primary to-accent text-white">
              Unified Platform
            </Badge>
          </CardTitle>
          <p className="text-muted-foreground">
            Build, save, and backtest your trading strategies in one seamless workflow
          </p>
        </CardHeader>
      </Card>

      {/* Current Strategy Status */}
      {currentStrategy && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Working on: {currentStrategy.name}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Status: {isStrategyComplete() ? 'Ready for backtesting' : 'In development'}
                </p>
              </div>
              {isStrategyComplete() && (
                <Button 
                  onClick={handleMoveToBacktest} 
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Test Strategy
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Strategy Builder
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            My Strategies
          </TabsTrigger>
          <TabsTrigger 
            value="backtest" 
            className="flex items-center gap-2"
            disabled={!isStrategyComplete()}
          >
            <Zap className="w-4 h-4" />
            Backtest Engine
          </TabsTrigger>
          <TabsTrigger 
            value="results" 
            className="flex items-center gap-2"
            disabled={!backtestResults}
          >
            <TrendingUp className="w-4 h-4" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* Strategy Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          <GuidedStrategyBuilder
            initialStrategy={{ answers: strategyAnswers }}
            onAnswersChange={handleAnswersChange}
            onSaveStrategy={handleStrategySaved}
            onBacktest={() => handleMoveToBacktest()}
          />
        </TabsContent>

        {/* Strategy Library Tab */}
        <TabsContent value="library" className="space-y-6">
          <GuidedStrategyManager
            onLoadStrategy={handleLoadStrategy}
            onEditStrategy={handleLoadStrategy}
          />
        </TabsContent>

        {/* Backtest Engine Tab */}
        <TabsContent value="backtest" className="space-y-6">
          {isStrategyComplete() ? (
            <UnifiedBacktestEngine
              strategyAnswers={strategyAnswers}
              currentStrategy={currentStrategy}
              onBacktestComplete={handleBacktestComplete}
              isBacktesting={isBacktesting}
              setIsBacktesting={setIsBacktesting}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Strategy Required</h3>
                <p className="text-muted-foreground mb-4">
                  Complete building your strategy first, then return here to run backtests.
                </p>
                <Button onClick={() => setActiveTab('builder')}>
                  <Bot className="w-4 h-4 mr-2" />
                  Build Strategy
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {backtestResults ? (
            <BacktestResults 
              run={backtestResults}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Results Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Run a backtest to see detailed performance results and analytics.
                </p>
                <Button 
                  onClick={() => setActiveTab('backtest')}
                  disabled={!isStrategyComplete()}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Run Backtest
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Workflow Guide */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Bot className="w-4 h-4" />
              <span>1. Build</span>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-500" />
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <BookOpen className="w-4 h-4" />
              <span>2. Save</span>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-500" />
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Zap className="w-4 h-4" />
              <span>3. Test</span>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-500" />
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <TrendingUp className="w-4 h-4" />
              <span>4. Analyze</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};