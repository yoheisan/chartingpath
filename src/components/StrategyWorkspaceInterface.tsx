import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GuidedStrategyAnswers } from './GuidedStrategyBuilder';
import { GuidedStrategyManager } from './GuidedStrategyManager';
import { Save, SaveAll, Edit, FolderOpen, MoreVertical } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { ChartingPathManager } from './ChartingPathManager';

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
  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentStrategy, setCurrentStrategy] = useState<SavedStrategy | null>(null);
  const [currentChartingPathStrategy, setCurrentChartingPathStrategy] = useState<ChartingPathStrategy | null>(null);
  const [strategyAnswers, setStrategyAnswers] = useState<GuidedStrategyAnswers>({
    market: { 
      instrumentCategory: 'stocks',
      instrument: 'AAPL',
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
  
  // Strategy menu state
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  const [renameName, setRenameName] = useState('');
  const builderRef = useRef<ChartingPathStrategyBuilderRef | null>(null);

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
  const handleChartingPathBacktest = async (strategy: ChartingPathStrategy): Promise<any> => {
    setIsBacktesting(true);
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

      console.log('Starting real backtest with strategy:', {
        instrument: strategy.market.instrument,
        instrumentCategory: strategy.market.instrumentCategory,
        patterns: strategy.patterns.filter(p => p.enabled).map(p => p.name),
        dateRange: `${strategy.backtestPeriod.startDate} to ${strategy.backtestPeriod.endDate}`
      });

      // Call the real backtest edge function
      const { data, error } = await supabase.functions.invoke('backtest-strategy', {
        body: { strategy }
      });

      if (error) {
        console.error('Backtest error:', error);
        throw new Error(error.message || 'Failed to start backtest');
      }

      if (!data.success) {
        const errorMsg = data.error || 'Backtest failed';
        console.error('Backtest failed:', errorMsg, data);
        throw new Error(errorMsg);
      }

      console.log('Backtest completed successfully:', {
        totalTrades: data.results.totalTrades,
        winRate: data.results.winRate,
        totalReturn: data.results.totalReturn,
        dataPoints: data.dataPoints
      });

      const results = {
        ...data.results,
        trades: data.trades,
        engineNote: `Real backtest on ${data.dataPoints} historical data points`
      };
      
      setBacktestResults(results);
      setIsBacktesting(false);
      
      toast.success(`Backtest complete! ${data.results.totalTrades} trades executed on real data.`);
      
      return results;
    } catch (error) {
      console.error('Backtest error:', error);
      setIsBacktesting(false);
      
      // Extract meaningful error message
      let errorMessage = 'Backtest failed. Please check your configuration.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as any).message;
      }
      
      toast.error(errorMessage, {
        duration: 6000,
        description: errorMessage.includes('Yahoo Finance') ? 
          'Try using daily (1d) timeframe for longer date ranges, or reduce your date range for hourly data.' : 
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
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Fixed Header with Strategy Menu */}
      <div className="flex-shrink-0 bg-background border-b border-border px-4 py-4 md:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
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
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6">
          <ChartingPathStrategyBuilder
            ref={builderRef}
            initialStrategy={currentChartingPathStrategy}
            onSave={handleChartingPathStrategySave}
            onBacktest={handleChartingPathBacktest}
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