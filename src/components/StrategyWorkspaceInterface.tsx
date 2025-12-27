import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GuidedStrategyAnswers } from './GuidedStrategyBuilder';
import { GuidedStrategyManager } from './GuidedStrategyManager';
import { Save, SaveAll, Edit, FolderOpen, MoreVertical, Globe, Target, TrendingUp, TrendingDown, BarChart3, Bell, Share2, ExternalLink, Copy, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChartingPathStrategyBuilder, ChartingPathStrategy, ChartingPathStrategyBuilderRef } from './ChartingPathStrategyBuilder';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import { savePlaybookContextStatic } from '@/hooks/usePlaybookContext';
import { supabase } from '@/integrations/supabase/client';
import { ChartingPathManager } from './ChartingPathManager';
import { CryptoPresetPanel } from './CryptoPresetPanel';
import { wedgeConfig, getFullSymbol } from '@/config/wedge';
import { useNavigate } from 'react-router-dom';
import { openTradingView } from '@/utils/tradingViewLinks';
import { trackShareCreated, trackTradingViewOpened, track } from '@/services/analytics';

interface SavedStrategy {
  id: string;
  name: string;
  answers: GuidedStrategyAnswers;
  backtest_results?: any;
}

interface SavedChartingPathStrategy {
  id: string;
  name: string;
  strategy: ChartingPathStrategy;
  backtest_results?: any;
}

export const StrategyWorkspaceInterface: React.FC<{ initialTab?: string }> = ({ initialTab = 'builder' }) => {
  const { user, subscriptionPlan } = useUserProfile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentStrategy, setCurrentStrategy] = useState<SavedStrategy | null>(null);
  const [currentChartingPathStrategy, setCurrentChartingPathStrategy] = useState<ChartingPathStrategy | null>(null);
  
  // Default to crypto 1H in wedge mode
  const defaultInstrumentCategory = wedgeConfig.wedgeEnabled ? wedgeConfig.defaultInstrumentCategory : 'stocks';
  const defaultInstrument = wedgeConfig.wedgeEnabled ? getFullSymbol(wedgeConfig.featuredSymbols[0]) : 'AAPL';
  const defaultTimeframe = wedgeConfig.wedgeEnabled ? wedgeConfig.wedgeTimeframe : '1h';
  
  const [strategyAnswers, setStrategyAnswers] = useState<GuidedStrategyAnswers>({
    market: { 
      instrumentCategory: defaultInstrumentCategory,
      instrument: defaultInstrument,
      timeframes: [defaultTimeframe],
      tradingHours: 'round-the-clock'
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
  
  // Strategy menu state
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  const [renameName, setRenameName] = useState('');
  const builderRef = useRef<ChartingPathStrategyBuilderRef | null>(null);
  const [summaryData, setSummaryData] = useState<{
    instrument?: string;
    timeframes?: string[];
    patternsCount: number;
    targetGainPercent: number;
    stopLossPercent: number;
    backtestReturn?: number;
    completedSteps: number;
    totalSteps: number;
  }>({ patternsCount: 0, targetGainPercent: 0, stopLossPercent: 0, completedSteps: 0, totalSteps: 7 });

  // Sync summary data from builder ref
  useEffect(() => {
    const interval = setInterval(() => {
      if (builderRef.current) {
        const strategy = builderRef.current.getStrategy();
        const results = builderRef.current.getBacktestResults();
        setSummaryData({
          instrument: strategy.market?.instrument,
          timeframes: strategy.market?.timeframes,
          patternsCount: strategy.patterns?.filter((p: any) => p.enabled).length || 0,
          targetGainPercent: strategy.targetGainPercent || 0,
          stopLossPercent: strategy.stopLossPercent || 0,
          backtestReturn: results?.totalReturn,
          completedSteps: builderRef.current.getCompletedStepsCount(),
          totalSteps: builderRef.current.getTotalStepsCount()
        });
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

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

  // Handle ChartingPath strategy save
  const handleChartingPathStrategySave = async (strategy: ChartingPathStrategy) => {
    if (!user) {
      toast.error('Please sign in to save strategies');
      return;
    }

    try {
      const strategyData = {
        user_id: user.id,
        name: strategy.name,
        description: strategy.description || '',
        strategy_code: JSON.stringify(strategy),
        strategy_type: 'charting_path',
        is_active: false
      };

      if (strategy.id) {
        // Update existing strategy
        const { error } = await supabase
          .from('user_strategies')
          .update({
            ...strategyData,
            updated_at: new Date().toISOString()
          })
          .eq('id', strategy.id);

        if (error) throw error;
      } else {
        // Create new strategy
        const { data, error } = await supabase
          .from('user_strategies')
          .insert([strategyData])
          .select()
          .single();

        if (error) throw error;
        
        // Update local state with new ID
        strategy.id = data.id;
      }

      setCurrentChartingPathStrategy(strategy);
      toast.success('Strategy saved successfully!');
    } catch (error) {
      console.error('Error saving strategy:', error);
      toast.error('Failed to save strategy');
    }
  };

  // Handle ChartingPath strategy backtest
  // Progress state for backtest
  const [backtestProgress, setBacktestProgress] = useState(0);
  const [backtestPhase, setBacktestPhase] = useState('');

  // Absolute safety guard: never let the UI stay in a "running" state forever
  useEffect(() => {
    if (!isBacktesting) return;

    const safetyTimeout = setTimeout(() => {
      console.error('Client-side backtest safety timeout hit – resetting UI state.');
      setIsBacktesting(false);
      setBacktestProgress(0);
      setBacktestPhase('Backtest reset after unexpected delay. Try a shorter range or daily timeframe.');
      toast.error('Backtest took too long and was reset. Please try again with a shorter range or daily timeframe.');
    }, 120000); // 2 minutes

    return () => clearTimeout(safetyTimeout);
  }, [isBacktesting]);

  const handleChartingPathBacktest = async (strategy: ChartingPathStrategy): Promise<any> => {
    setIsBacktesting(true);
    setBacktestProgress(0);
    setBacktestPhase('Initializing...');
    
    try {
      // Ensure strategy has required properties
      if (!strategy.market?.instrument) {
        throw new Error('Please select an instrument before running backtest');
      }
      if (!strategy.backtestPeriod?.startDate || !strategy.backtestPeriod?.endDate) {
        throw new Error('Please set backtest period dates');
      }
      if (!strategy.patterns?.some(p => p.enabled)) {
        throw new Error('Please enable at least one pattern');
      }

      // Progress simulation
      setBacktestProgress(10);
      setBacktestPhase('Connecting to data provider...');
      
      console.log('Starting real backtest with strategy:', {
        instrument: strategy.market.instrument,
        instrumentCategory: strategy.market.instrumentCategory,
        patterns: strategy.patterns.filter(p => p.enabled).map(p => p.name),
        dateRange: `${strategy.backtestPeriod.startDate} to ${strategy.backtestPeriod.endDate}`
      });

      setBacktestProgress(20);
      setBacktestPhase('Fetching historical data...');

      // Start a gentle fake progress while the backtest runs so the UI doesn't feel stuck
      let progressInterval: ReturnType<typeof setInterval> | undefined;
      progressInterval = setInterval(() => {
        setBacktestProgress((prev) => {
          // Drift up to 65% max while waiting for real updates
          if (prev >= 65) return prev;
          return prev + 3;
        });
      }, 1500);

      // Call the real backtest edge function with appropriate timeout
      // Professional backtests need 60-90s for intraday data with multiple patterns
      const timeoutMs = 90000; // 90s for comprehensive backtests

      console.log('Invoking backtest-strategy edge function', {
        timeoutMs,
        symbol: strategy.market?.instrument,
        timeframe: strategy.market?.timeframes?.[0],
        patterns: strategy.patterns?.filter((p) => p.enabled).length,
      });

      // Implement a real timeout using Promise.race so the UI never hangs
      let timeoutId: ReturnType<typeof setTimeout>;

      // Use the already-loaded profile user for usage tracking
      const userId = user?.id;

      // Call Supabase Edge Function via direct HTTP to avoid client misconfiguration issues
      const backtestPromise = fetch(
        'https://dgznlsckoamseqcpzfqm.supabase.co/functions/v1/backtest-strategy',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8',
          },
          body: JSON.stringify({ strategy, userId, wedgeEnabled: wedgeConfig.wedgeEnabled }),
        },
      )
        .then(async (response) => {
          console.log('backtest-strategy HTTP response status', response.status);
          const text = await response.text();
          try {
            const json = text ? JSON.parse(text) : {};
            console.log('backtest-strategy parsed JSON response', json);
            return { data: json, error: null };
          } catch (parseError) {
            console.error('Failed to parse backtest-strategy response JSON', parseError, text);
            return {
              data: null,
              error: new Error(
                `Invalid JSON from backtest-strategy (status ${response.status})`,
              ),
            };
          }
        })
        .catch((invokeError) => {
          console.error('backtest-strategy HTTP invoke error', invokeError);
          throw invokeError;
        });

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          console.error('Backtest timed out after', timeoutMs, 'ms');
          // Hard safety so UI never remains stuck at 65%
          setIsBacktesting(false);
          setBacktestProgress(0);
          setBacktestPhase('Backtest timed out. Try a shorter range or daily timeframe.');
          reject(new Error('Backtest timed out. Try a shorter date range or daily timeframe.'));
        }, timeoutMs);
      });

      try {
        const { data, error } = (await Promise.race([
          backtestPromise,
          timeoutPromise,
        ])) as { data: any; error: any };

        clearTimeout(timeoutId);
        if (progressInterval) clearInterval(progressInterval);

        console.log('Backtest edge function resolved');
        setBacktestProgress(70);
        setBacktestPhase('Analyzing patterns & signals...');

        if (error) {
          console.error('Backtest error:', error);
          throw new Error(error.message || 'Failed to start backtest');
        }

        // Handle rate limit exceeded
        if (data?.limitExceeded) {
          toast.error(
            `Daily limit reached (${data.usage?.max_daily_runs}/day). Upgrade for more backtests.`,
          );
          setIsBacktesting(false);
          setBacktestProgress(0);
          return null;
        }

        if (!data?.success) {
          const errorMsg = data?.error || 'Backtest failed';
          console.error('Backtest failed:', errorMsg, data);
          throw new Error(errorMsg);
        }

        // Show cache indicator
        if (data.cached) {
          console.log('Result served from cache');
        }

        setBacktestProgress(90);
        setBacktestPhase('Calculating performance metrics...');

        console.log('Backtest completed successfully:', {
          totalTrades: data.results.totalTrades,
          winRate: data.results.winRate,
          totalReturn: data.results.totalReturn,
          dataPoints: data.dataPoints,
        });

        const results = {
          ...data.results,
          trades: data.trades,
          disciplineStats: data.disciplineStats,
          rawSignals: data.rawSignals,
          engineNote: `Real backtest on ${data.dataPoints} historical data points`,
        };

        setBacktestProgress(100);
        setBacktestPhase('Complete!');

        setBacktestResults(results);
        setIsBacktesting(false);
        setBacktestProgress(0);

        toast.success(
          `Backtest complete! ${data.results.totalTrades} trades executed on real data.`,
        );

        return results;
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (progressInterval) clearInterval(progressInterval);
        console.error('Backtest invocation failed:', fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error('Backtest error:', error);
      setIsBacktesting(false);
      setBacktestProgress(0);
      setBacktestPhase('');
      
      // Extract meaningful error message
      let errorMessage = 'Backtest failed. Please check your configuration.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as any).message;
      }
      
      toast.error(errorMessage, {
        duration: 6000,
        description: errorMessage.includes('timeout') || errorMessage.includes('Yahoo Finance') ? 
          'Try using daily (1d) timeframe for longer date ranges, or reduce your date range for intraday data.' : 
          undefined
      });
      throw error;
    }
  };

  // Navigate to backtest section when strategy is ready (now integrated in builder)
  const handleMoveToBacktest = () => {
    if (!strategyAnswers.market?.instrument || !strategyAnswers.market?.timeframes || strategyAnswers.market.timeframes.length === 0 || !strategyAnswers.style?.approach) {
      toast.error('Please complete the strategy building process first (instrument, timeframe, and approach required)');
      return;
    }
    // Stay in builder tab since backtest is now integrated
    toast.success('Continue to the Backtest step within Strategy Builder');
  };

  const isStrategyComplete = () => {
    return !!(strategyAnswers.market?.instrument && strategyAnswers.market?.timeframes && strategyAnswers.market.timeframes.length > 0 && strategyAnswers.style?.approach);
  };


  // Handle loading a charting path strategy
  const handleLoadChartingPathStrategy = (strategy: ChartingPathStrategy) => {
    setCurrentChartingPathStrategy(strategy);
    setShowLoadDialog(false);
    toast.success(`Loaded strategy: ${strategy.name}`);
  };

  // Handle preset load from CryptoPresetPanel
  const handlePresetLoad = (preset: { symbol: string; pattern: string; timeframe: string }) => {
    const strategy = builderRef.current?.getStrategy();
    if (strategy && builderRef.current) {
      const updatedStrategy = {
        ...strategy,
        market: {
          ...strategy.market,
          instrumentCategory: 'crypto' as const,
          instrument: preset.symbol,
          timeframes: [preset.timeframe],
        },
      };
      builderRef.current.setStrategy(updatedStrategy);
      toast.success(`Loaded preset: ${preset.symbol} ${preset.timeframe} ${preset.pattern}`);
    }
  };

  // Handle one-click backtest - loads BTC preset and immediately runs backtest
  const handleOneClickBacktest = () => {
    const strategy = builderRef.current?.getStrategy();
    if (strategy && builderRef.current) {
      // Set up default BTC 1H Breakout preset
      const updatedStrategy = {
        ...strategy,
        market: {
          ...strategy.market,
          instrumentCategory: 'crypto' as const,
          instrument: 'BTCUSDT',
          timeframes: ['1h'],
        },
        backtestPeriod: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        },
        patterns: strategy.patterns?.map((p: any) => ({
          ...p,
          enabled: p.name === 'Breakout' || p.name === 'Channel Breakout',
        })) || [],
      };
      builderRef.current.setStrategy(updatedStrategy);
      
      // Trigger the backtest
      setTimeout(() => {
        const finalStrategy = builderRef.current?.getStrategy();
        if (finalStrategy) {
          handleChartingPathBacktest(finalStrategy);
        }
      }, 200);
    }
  };

  // State for share link
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Handle share backtest
  const handleShareBacktest = async () => {
    if (!user || !backtestResults) {
      toast.error('Please run a backtest first');
      return;
    }

    setIsSharing(true);
    try {
      const strategy = builderRef.current?.getStrategy();
      const newToken = crypto.randomUUID();
      
      // Insert or update backtest_runs with share info
      const { error } = await supabase
        .from('backtest_runs')
        .insert({
          user_id: user.id,
          strategy_name: strategy?.name || 'Pattern Strategy',
          instrument: strategy?.market?.instrument || '',
          timeframe: strategy?.market?.timeframes?.[0] || '1h',
          from_date: strategy?.backtestPeriod?.startDate || new Date().toISOString(),
          to_date: strategy?.backtestPeriod?.endDate || new Date().toISOString(),
          win_rate: backtestResults.winRate,
          profit_factor: backtestResults.profitFactor,
          net_pnl: backtestResults.totalReturn,
          max_drawdown: backtestResults.maxDrawdown,
          sharpe_ratio: backtestResults.sharpeRatio,
          total_trades: backtestResults.totalTrades,
          avg_win: backtestResults.avgWin,
          avg_loss: backtestResults.avgLoss,
          is_shared: true,
          share_token: newToken,
        });

      if (error) throw error;

      setShareToken(newToken);
      
      // Copy to clipboard
      const shareUrl = `${window.location.origin}/share/${newToken}`;
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
      
      // Track analytics
      trackShareCreated({
        symbol: strategy?.market?.instrument || '',
        pattern: strategy?.patterns?.find((p: any) => p.enabled)?.name || '',
        timeframe: strategy?.market?.timeframes?.[0] || '1h',
      });
      
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing backtest:', error);
      toast.error('Failed to create share link');
    } finally {
      setIsSharing(false);
    }
  };

  // Handle open in TradingView
  const handleOpenTradingView = () => {
    const strategy = builderRef.current?.getStrategy();
    const symbol = strategy?.market?.instrument || 'BTCUSDT';
    const instrumentCategory = (strategy?.market?.instrumentCategory || 'crypto') as 'crypto' | 'stocks' | 'forex' | 'commodities';
    const timeframe = strategy?.market?.timeframes?.[0] || '1h';
    
    trackTradingViewOpened({ symbol, context: 'backtest' });
    openTradingView(symbol, instrumentCategory, timeframe);
  };

  // Handle create alert after backtest - save playbook context before navigating
  const handleCreateAlert = () => {
    // Track create alert clicked
    track('create_alert_clicked', {
      source: 'backtest_results',
      symbol: builderRef.current?.getStrategy()?.market?.instrument,
    });
    
    // Get current strategy from builder ref
    const strategy = builderRef.current?.getStrategy();
    
    // Build playbook context to prefill alerts
    const playbookContext = {
      symbol: strategy?.market?.instrument || '',
      pattern: strategy?.patterns?.find((p: any) => p.enabled)?.name || '',
      timeframe: strategy?.market?.timeframes?.[0] || '1h',
      instrumentCategory: strategy?.market?.instrumentCategory || 'crypto',
    };
    
    // Save context before redirect (works for both logged-in and logged-out users)
    savePlaybookContextStatic(playbookContext);
    console.log('[StrategyWorkspace] Saved playbook context:', playbookContext);
    
    if (!user) {
      navigate('/auth?redirect=/members/alerts');
      return;
    }
    navigate('/members/alerts');
  };

  // Strategy menu handlers
  const handleSaveFromMenu = () => {
    const strategy = builderRef.current?.getStrategy();
    if (strategy) {
      handleChartingPathStrategySave(strategy);
    }
  };

  const handleSaveAs = () => {
    if (!saveAsName.trim()) {
      toast.error('Please enter a strategy name');
      return;
    }
    const strategy = builderRef.current?.getStrategy();
    if (strategy) {
      const newStrategy = {
        ...strategy,
        id: undefined,
        name: saveAsName,
        created_at: new Date(),
        updated_at: new Date()
      };
      handleChartingPathStrategySave(newStrategy);
      setCurrentChartingPathStrategy(newStrategy);
    }
    setShowSaveAsDialog(false);
    setSaveAsName('');
  };

  const handleRename = () => {
    if (!renameName.trim()) {
      toast.error('Please enter a strategy name');
      return;
    }
    const strategy = builderRef.current?.getStrategy();
    if (strategy) {
      const renamedStrategy = {
        ...strategy,
        name: renameName,
        updated_at: new Date()
      };
      builderRef.current?.setStrategy(renamedStrategy);
      handleChartingPathStrategySave(renamedStrategy);
    }
    setShowRenameDialog(false);
    setRenameName('');
  };

  const openSaveAsDialog = () => {
    const strategy = builderRef.current?.getStrategy();
    setSaveAsName((strategy?.name || 'Strategy') + ' (Copy)');
    setShowSaveAsDialog(true);
  };

  const openRenameDialog = () => {
    const strategy = builderRef.current?.getStrategy();
    setRenameName(strategy?.name || '');
    setShowRenameDialog(true);
  };

  const currentStrategyName = builderRef.current?.getStrategy()?.name || 'New Chart Pattern Strategy';

  return (
    <div className="min-h-screen">
      {/* Fixed Header with Strategy Menu and Summary Bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 md:px-6">
          {/* Title Row */}
          <div className="flex items-center justify-between py-4">
            <div className="border-l-4 border-foreground pl-6">
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight">STRATEGY WORKSPACE</h1>
              {currentChartingPathStrategy && currentChartingPathStrategy.id && (
                <p className="text-sm text-muted-foreground mt-1">
                  {currentChartingPathStrategy.name}
                </p>
              )}
            </div>
            
            {/* Strategy Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Strategy</span>
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover">
                <DropdownMenuItem onClick={handleSaveFromMenu}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Strategy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openSaveAsDialog}>
                  <SaveAll className="w-4 h-4 mr-2" />
                  Save As...
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={openRenameDialog}>
                  <Edit className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowLoadDialog(true)}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Load Strategy...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Summary Bar */}
          <div className="pb-3">
            <div className="bg-muted/30 border border-dashed border-border rounded-lg py-3 px-4">
              <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                <div className="flex items-center gap-4 flex-wrap">
                  {summaryData.instrument && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-primary" />
                      <span className="font-medium">{summaryData.instrument}</span>
                      <Badge variant="secondary" className="text-xs">
                        {summaryData.timeframes?.join(', ')}
                      </Badge>
                    </div>
                  )}
                  {summaryData.patternsCount > 0 && (
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span>{summaryData.patternsCount} Patterns</span>
                    </div>
                  )}
                  {summaryData.targetGainPercent > 0 && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span>TP: {summaryData.targetGainPercent}%</span>
                    </div>
                  )}
                  {summaryData.stopLossPercent > 0 && (
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span>SL: {summaryData.stopLossPercent}%</span>
                    </div>
                  )}
                  {summaryData.backtestReturn !== undefined && (
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 font-medium">
                        {summaryData.backtestReturn > 0 ? '+' : ''}{summaryData.backtestReturn?.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {summaryData.completedSteps}/{summaryData.totalSteps} complete
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content - with padding to account for fixed header */}
      <div className="pt-40">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 space-y-6">
          {/* Crypto Preset Panel (Wedge Mode) */}
          {wedgeConfig.wedgeEnabled && (
            <CryptoPresetPanel 
              onPresetLoad={handlePresetLoad} 
              onOneClickBacktest={handleOneClickBacktest}
              isBacktesting={isBacktesting}
            />
          )}

          {/* Create Alert + TradingView CTAs after backtest */}
          {backtestResults && wedgeConfig.wedgeEnabled && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-medium">Backtest complete! Ready to trade this playbook?</p>
                  <p className="text-sm text-muted-foreground">Create an alert or open in TradingView to analyze further.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button onClick={handleOpenTradingView} variant="outline" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open in TradingView
                  </Button>
                  <Button onClick={handleShareBacktest} variant="outline" className="gap-2" disabled={isSharing}>
                    {linkCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                    {linkCopied ? 'Link Copied!' : 'Share Backtest'}
                  </Button>
                  <Button onClick={handleCreateAlert} className="gap-2">
                    <Bell className="h-4 w-4" />
                    Create Alert
                  </Button>
                </div>
              </div>
            </div>
          )}

          <ChartingPathStrategyBuilder
            ref={builderRef}
            initialStrategy={currentChartingPathStrategy}
            onSave={handleChartingPathStrategySave}
            onBacktest={handleChartingPathBacktest}
            isBacktesting={isBacktesting}
            backtestProgress={backtestProgress}
            backtestPhase={backtestPhase}
          />
        </div>
      </div>

      {/* Save As Dialog */}
      <Dialog open={showSaveAsDialog} onOpenChange={setShowSaveAsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Strategy As</DialogTitle>
            <DialogDescription>
              Create a copy of this strategy with a new name
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter strategy name"
              value={saveAsName}
              onChange={(e) => setSaveAsName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveAs()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveAsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAs}>
              <SaveAll className="w-4 h-4 mr-2" />
              Save As
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Strategy</DialogTitle>
            <DialogDescription>
              Give this strategy a new name
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter new name"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>
              <Edit className="w-4 h-4 mr-2" />
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Strategy Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Load Strategy</DialogTitle>
            <DialogDescription>
              Select a saved strategy to load
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-l-2 border-foreground pl-3">
                Guided Strategies
              </h3>
              <GuidedStrategyManager 
                onLoadStrategy={handleLoadStrategy} 
                onEditStrategy={handleLoadStrategy}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-l-2 border-foreground pl-3">
                Pattern Strategies
              </h3>
              <ChartingPathManager 
                onLoadStrategy={handleLoadChartingPathStrategy}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StrategyWorkspaceInterface;