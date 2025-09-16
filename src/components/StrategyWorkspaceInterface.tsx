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
  Play
} from 'lucide-react';
import { GuidedStrategyBuilder, GuidedStrategyAnswers } from './GuidedStrategyBuilder';
import { GuidedStrategyManager } from './GuidedStrategyManager';
import BacktesterV2Engine from './BacktesterV2Engine';
import BacktestResults from './BacktestResults';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import { mapAnswersToBacktestParams } from '@/utils/StrategyTemplates';

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
  const backtestSectionRef = useRef<HTMLDivElement>(null);

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
    // Scroll to the backtesting section
    backtestSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast.success('Scrolled to Backtest Engine');
  };

  // Handle backtest completion
  const handleBacktestComplete = (results: any) => {
    setBacktestResults(results);
    setActiveTab('results');
  };

  // Generate strategy name from answers for V2 engine
  const generateStrategyName = () => {
    const approach = strategyAnswers.style?.approach?.replace('-', ' ') || 'Custom';
    const instrument = strategyAnswers.market?.instrument || 'Strategy';
    const timeframe = strategyAnswers.market?.timeframes?.[0] || '1h';
    
    return `${instrument} ${approach} ${timeframe}`.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Convert strategy answers to backtest params for V2 engine using templates
  // GUIDED BUILDER: Limited to past 30 days only (service differentiator)
  const convertToBacktestParams = () => {
    const templateParams = mapAnswersToBacktestParams(strategyAnswers);
    
    // Calculate past 30 days from current date for guided builder
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    return {
      instrument: templateParams.instrument || 'EURUSD',
      timeframe: templateParams.timeframe || '1H',
      period: 'past_30_days', // Fixed period for guided builder
      fromDate: thirtyDaysAgo.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0],
      initialCapital: templateParams.initialCapital || 10000,
      positionSizingType: 'percentage',
      positionSize: templateParams.positionSize || 2,
      orderType: 'market',
      commission: templateParams.commission || 0.1,
      slippage: templateParams.slippage || 0.05,
      stopLoss: templateParams.stopLoss,
      takeProfit: templateParams.takeProfit
    };
  };

  // Handle V2 backtest execution
  const handleRunV2Backtest = async () => {
    if (!isStrategyComplete()) {
      toast.error('Please complete the strategy building process first');
      return;
    }

    setIsBacktesting(true);
    
    try {
      // Import the BacktesterV2Adapter dynamically
      const { BacktesterV2Adapter } = await import('@/adapters/backtesterV2');
      const adapter = new BacktesterV2Adapter();
      
      // Convert strategy answers to backtest parameters
      const backtestParams = convertToBacktestParams();
      
      // Run real backtest
      const results = await adapter.runBacktest(backtestParams, strategyAnswers);
      
      setBacktestResults(results);
      setIsBacktesting(false);
      setActiveTab('results');
      toast.success('V2 Backtest completed successfully!');
    } catch (error) {
      console.error('V2 Backtest error:', error);
      toast.error('V2 Backtest failed: ' + (error as Error).message);
      setIsBacktesting(false);
    }
  };

  const isStrategyComplete = () => {
    return !!(strategyAnswers.market?.instrument && strategyAnswers.market?.timeframes && strategyAnswers.market.timeframes.length > 0 && strategyAnswers.style?.approach);
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Strategy Builder
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            My Strategies
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
            onBacktest={handleRunV2Backtest}
            isBacktesting={isBacktesting}
          />
          
          {/* Advanced Backtest Engine Section - Premium Feature */}
          {isStrategyComplete() && (
            <Card className="border-primary/20" ref={backtestSectionRef}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Advanced Backtest Engine
                  <Badge variant="outline" className="ml-2">Pro+ Feature</Badge>
                </CardTitle>
                <p className="text-muted-foreground">
                  Custom date ranges, advanced parameters, and unlimited historical data access
                </p>
              </CardHeader>
              <CardContent>
            <BacktesterV2Engine
              selectedStrategy={generateStrategyName()}
              params={convertToBacktestParams()}
              onRunV2Backtest={handleRunV2Backtest}
              isRunning={isBacktesting}
              strategyAnswers={strategyAnswers}
              isStrategyComplete={isStrategyComplete()}
              onBacktestComplete={() => setActiveTab('results')}
              isGuidedBuilder={false}
              onParamsChange={() => {}} // Parameters are managed by parent in this context
            />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Strategy Library Tab */}
        <TabsContent value="library" className="space-y-6">
          <GuidedStrategyManager
            onLoadStrategy={handleLoadStrategy}
            onEditStrategy={handleLoadStrategy}
          />
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {backtestResults ? (
            <BacktestResults 
              run={backtestResults}
              strategyAnswers={strategyAnswers}
              onStrategySaved={() => {
                // Optionally redirect to My Strategies or show success message
                toast.success('Strategy saved! You can find it in My Strategies tab.');
              }}
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
                   onClick={handleRunV2Backtest}
                   disabled={!isStrategyComplete()}
                 >
                   <Zap className="w-4 h-4 mr-2" />
                   Run V2 Backtest
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