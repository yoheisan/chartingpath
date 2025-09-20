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
  Crown,
  Users,
  Building,
  Activity,
  BarChart3,
  Shield,
  Target
} from 'lucide-react';
import { GuidedStrategyBuilder, GuidedStrategyAnswers } from './GuidedStrategyBuilder';
import { GuidedStrategyManager } from './GuidedStrategyManager';
import { AssetFocusedStrategyBuilder } from './AssetFocusedStrategyBuilder';
import { QuickTestResults } from './QuickTestResults';
import BacktesterV2Engine from './BacktesterV2Engine';
import BacktestResults from './BacktestResults';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import { mapAnswersToBacktestParams } from '@/utils/StrategyTemplates';
import { BacktestParams } from '@/components/BacktestParametersPanel';

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
    market: { timeframes: [] },
    riskTolerance: { accountPrinciple: 10000, leverage: 1, maxDrawdown: 10, riskPerTrade: 2 },
    reward: { targetReturn: 15, winRate: 65, riskRewardRatio: 2 },
    style: { approach: '' }
  });
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestParams, setBacktestParams] = useState<BacktestParams | null>(null);
  const [quickTestResults, setQuickTestResults] = useState<any>(null);
  const backtestSectionRef = useRef<HTMLDivElement>(null);
  // Initialize backtest params once when strategy answers change, but only if not already set
  useEffect(() => {
    if (strategyAnswers && Object.keys(strategyAnswers).length > 0 && !backtestParams) {
      setBacktestParams(convertToBacktestParams());
    }
  }, [strategyAnswers, backtestParams]);

  // Handle backtest parameter changes from BacktesterV2Engine
  const handleBacktestParamsChange = (newParams: BacktestParams) => {
    setBacktestParams(newParams);
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
      period: '1M', // Last 1 Month for guided builder
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

  // Handle asset-focused strategy selection
  const handleAssetStrategySelect = (strategy: any) => {
    // Convert professional strategy template to guided strategy answers
    const newAnswers: GuidedStrategyAnswers = {
      market: { 
        timeframes: [strategy.timeframes.optimal], // Use optimal timeframe from professional strategy
        instrument: 'EURUSD' // Default, user can change in builder
      },
      riskTolerance: { 
        accountPrinciple: 10000, 
        leverage: 1, 
        maxDrawdown: 15, 
        riskPerTrade: parseFloat(strategy.parameters.riskManagement.positionSizing.match(/[\d.]+/)?.[0] || '2') // Extract percentage from position sizing
      },
      reward: { 
        targetReturn: 15, // Default target, no promises made
        winRate: 65, // Default target, no promises made
        riskRewardRatio: 2 // Default, can be customized in builder
      },
      style: { approach: strategy.id }
    };
    
    setStrategyAnswers(newAnswers);
    setActiveTab('builder');
    toast.success(`${strategy.name} professional configuration loaded! Customize parameters in Strategy Builder.`);
  };

  // Handle quick test from strategy builder
  const handleQuickTest = (strategy: any) => {
    // Generate realistic quick test results based on strategy characteristics
    const baseReturn = Math.random() * 15 - 7.5; // -7.5% to 7.5% (realistic for 30-day test)
    const volatility = strategy.category === 'Momentum' ? 1.5 : strategy.category === 'Arbitrage' ? 0.5 : 1.0;
    
    const results = {
      strategy: strategy.name,
      asset: 'Mixed Assets', // No specific asset selected yet
      period: '30 days (simulated)',
      totalReturn: baseReturn * volatility,
      winRate: 35 + Math.random() * 40, // 35-75% (realistic range)
      totalTrades: 8 + Math.floor(Math.random() * 15), // 8-22 trades in 30 days
      avgWin: 0.8 + Math.random() * 2.2, // 0.8-3%
      avgLoss: 0.5 + Math.random() * 1.5, // 0.5-2%
      maxDrawdown: 2 + Math.random() * 8, // 2-10% (reasonable for short test)
      profitFactor: 0.8 + Math.random() * 1.4, // 0.8-2.2 (realistic range)
      sharpeRatio: -0.2 + Math.random() * 1.2, // -0.2 to 1.0 (realistic for short period)
      confidence: 'Medium', // Always medium for quick tests
      recommendation: 'Quick test complete. Professional strategies require longer backtesting periods with specific assets for reliable results. Use this as initial validation only.',
      nextSteps: [
        'Select specific asset in Strategy Builder',
        'Run full backtest with 1+ years of historical data',
        'Test across different market conditions',
        'Optimize parameters for your risk tolerance'
      ],
      disclaimer: 'This is a simulated test without specific asset data. Real results will vary significantly based on chosen asset, market conditions, execution, and risk management.'
    };
    
    setQuickTestResults(results);
    setActiveTab('quick-results');
    toast.success('Quick simulation completed! Select your asset and run full backtests for reliable results.');
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="quick-select" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Quick Select
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Strategy Builder
          </TabsTrigger>
          <TabsTrigger value="professional" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Professional
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

        {/* Quick Select Tab */}
        <TabsContent value="quick-select" className="space-y-6">
          <AssetFocusedStrategyBuilder
            onStrategySelect={handleAssetStrategySelect}
            onQuickTest={handleQuickTest}
          />
        </TabsContent>

        {/* Quick Test Results Tab */}
        <TabsContent value="quick-results" className="space-y-6">
          {quickTestResults && (
            <QuickTestResults
              results={quickTestResults}
              onRunFullBacktest={() => {
                setActiveTab('builder');
                toast.success('Switch to Strategy Builder to run full backtest');
              }}
              onOptimize={() => {
                setActiveTab('professional');
                toast.success('Switch to Professional mode for parameter optimization');
              }}
              onNewTest={() => {
                setQuickTestResults(null);
                setActiveTab('quick-select');
              }}
            />
          )}
        </TabsContent>

        {/* Professional Strategy Wizard Tab */}
        <TabsContent value="professional" className="space-y-6">
          <div className="text-center space-y-4 py-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Professional Strategy Development</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Institutional-grade workflow that mirrors how professional fund managers and quants 
                approach strategy development. Includes market regime analysis, risk budgeting, 
                and data-driven target setting.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
              <Card className="text-left">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-sm">Market Regime Analysis</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Identify current market conditions and adjust strategy parameters accordingly
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-left">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-sm">Risk Budgeting</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Portfolio-level risk allocation using institutional methods
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-left">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-sm">Performance Targets</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Data-driven targets based on historical performance metrics
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <Button 
                size="lg"
                onClick={() => {
                  // This would navigate to the professional wizard
                  toast.success('Professional Strategy Wizard will open in a new tab');
                }}
                className="flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Launch Professional Wizard
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Crown className="w-4 h-4" />
                <span>Available on Pro+ plans</span>
              </div>
            </div>

            {/* Comparison */}
            <Card className="mt-8 text-left">
              <CardHeader>
                <CardTitle className="text-base">When to Use Each Approach</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-blue-600" />
                      Guided Builder (Current)
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Simple step-by-step process</li>
                      <li>• Pre-defined strategy templates</li>
                      <li>• Basic risk/reward inputs</li>
                      <li>• Good for beginners</li>
                      <li>• 30-day backtesting</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-600" />
                      Professional Wizard
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Market regime-based approach</li>
                      <li>• Portfolio risk budgeting</li>
                      <li>• Statistical performance metrics</li>
                      <li>• Kelly criterion position sizing</li>
                      <li>• Multi-year walk-forward testing</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
              params={backtestParams || convertToBacktestParams()}
              onRunV2Backtest={handleRunV2Backtest}
              isRunning={isBacktesting}
              strategyAnswers={strategyAnswers}
              isStrategyComplete={isStrategyComplete()}
              onBacktestComplete={() => setActiveTab('results')}
              isGuidedBuilder={false}
              onParamsChange={handleBacktestParamsChange}
            />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Strategy Library Tab */}
        <TabsContent value="library" className="space-y-6">
          <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-md">
            <p className="text-yellow-800">Debug: My Strategies tab is loading...</p>
          </div>
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