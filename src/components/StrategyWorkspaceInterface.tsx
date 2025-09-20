import React, { useState, useEffect, useRef } from 'react';
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
  Play,
  Target
} from 'lucide-react';
import { GuidedStrategyBuilder, GuidedStrategyAnswers } from './GuidedStrategyBuilder';
import { GuidedStrategyManager } from './GuidedStrategyManager';
import { ProfessionalStrategyLibrary } from './ProfessionalStrategyLibrary';
import { ConsolidatedBacktestEngine } from './ConsolidatedBacktestEngine';
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
  const [activeTab, setActiveTab] = useState('quick-select');
  const [currentStrategy, setCurrentStrategy] = useState<SavedStrategy | null>(null);
  const [strategyAnswers, setStrategyAnswers] = useState<GuidedStrategyAnswers>({
    market: { 
      instrumentCategory: 'forex',
      instrument: 'EUR/USD',
      timeframes: ['1h'],
      tradingHours: 'london-ny'
    },
    risk: { 
      maxDrawdown: 10,
      riskPerTrade: 2,
      leverage: 10
    },
    style: { 
      approach: 'trend-following',
      timeHorizon: 'intraday',
      complexity: 'intermediate'
    }
  });
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);

  // Handle backtest completion
  const handleBacktestComplete = (results: any) => {
    setBacktestResults(results);
    setActiveTab('results');
  };

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

  // Navigate to backtest section when strategy is ready
  const handleMoveToBacktest = () => {
    if (!strategyAnswers.market?.instrument || !strategyAnswers.market?.timeframes || strategyAnswers.market.timeframes.length === 0 || !strategyAnswers.style?.approach) {
      toast.error('Please complete the strategy building process first (instrument, timeframe, and approach required)');
      return;
    }
    // Switch to the backtest tab
    setActiveTab('backtest');
    toast.success('Switched to Backtest Engine');
  };

  const isStrategyComplete = () => {
    return !!(strategyAnswers.market?.instrument && strategyAnswers.market?.timeframes && strategyAnswers.market.timeframes.length > 0 && strategyAnswers.style?.approach);
  };

  // Handle asset-focused strategy selection
  const handleAssetStrategySelect = (strategy: any) => {
    // Convert professional strategy template to guided strategy answers
    const newAnswers: GuidedStrategyAnswers = {
      market: { 
        instrumentCategory: 'forex',
        timeframes: [strategy.timeframes.optimal],
        instrument: '',
        tradingHours: 'london-ny'
      },
      risk: { 
        maxDrawdown: 15, 
        riskPerTrade: parseFloat(strategy.parameters.riskManagement.positionSizing.match(/[\d.]+/)?.[0] || '2'),
        leverage: 10
      },
      style: { 
        approach: strategy.id,
        timeHorizon: 'intraday',
        complexity: 'intermediate'
      }
    };
    
    setStrategyAnswers(newAnswers);
    setActiveTab('builder');
    
    // Scroll to top of Strategy Builder after a brief delay to ensure tab change completes
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
    
    toast.success(`${strategy.name} selected! Please choose your financial instrument and timeframe in Strategy Builder.`);
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

      {/* Strategy Connected Status - Only show when strategy is actually loaded */}
      {currentStrategy && currentStrategy.id && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Strategy Connected
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Parameters automatically synced from Strategy Builder
                </p>
                <p className="text-xs text-green-500 dark:text-green-300 mt-1">
                  "{currentStrategy.name}" has been loaded successfully from My Strategies
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
      <Tabs value={activeTab} onValueChange={(value) => {
        console.log('Tab changed to:', value);
        setActiveTab(value);
      }} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick-select" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Professional Library
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Strategy Builder
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            My Strategies
          </TabsTrigger>
        </TabsList>

        {/* Quick Select Tab */}
        <TabsContent value="quick-select" className="space-y-6">
          <ProfessionalStrategyLibrary
            onStrategySelect={handleAssetStrategySelect}
          />
        </TabsContent>

        {/* Strategy Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          <GuidedStrategyBuilder
            initialStrategy={{ answers: strategyAnswers }}
            onAnswersChange={handleAnswersChange}
            onSaveStrategy={handleStrategySaved}
            onBacktestComplete={handleBacktestComplete}
          />
        </TabsContent>

        {/* My Strategies Tab */}
        <TabsContent value="library" className="space-y-6">
          <GuidedStrategyManager 
            onLoadStrategy={handleLoadStrategy} 
            onEditStrategy={handleLoadStrategy}
          />
        </TabsContent>

      </Tabs>

      {/* Workflow Guide */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Target className="w-4 h-4" />
              <span>1. Select or Build</span>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-500" />
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Settings className="w-4 h-4" />
              <span>2. Configure & Test</span>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-500" />
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <BookOpen className="w-4 h-4" />
              <span>3. Save & Export</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StrategyWorkspaceInterface;