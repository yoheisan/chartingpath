import React, { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StrategyWorkspaceInterface } from '@/components/StrategyWorkspaceInterface';
import { AgentBacktestPanel } from '@/components/AgentBacktestPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, LineChart } from 'lucide-react';
import { TradeSetup } from '@/components/agent-backtest/TradeOpportunityTable';
import { toast } from 'sonner';

const StrategyWorkspace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeMode = searchParams.get('mode') || 'strategy';
  const initialTab = searchParams.get('tab') || 'builder';

  const handleModeChange = useCallback((value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('mode', value);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleSendToBacktest = useCallback((setup: TradeSetup) => {
    // Store trade setup in sessionStorage for the Strategy Builder to pick up
    sessionStorage.setItem('shared_backtest_preset', JSON.stringify({
      symbol: setup.symbol,
      patternId: setup.patternId,
      pattern: setup.pattern,
      timeframe: setup.timeframe,
      autoRun: true,
    }));
    // Switch to strategy builder mode
    handleModeChange('strategy');
    toast.success(`Loaded ${setup.symbol} ${setup.pattern} into Strategy Builder`);
  }, [handleModeChange]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-6 pb-12">
        <Tabs value={activeMode} onValueChange={handleModeChange}>
          <TabsList className="mb-6 bg-muted/50">
            <TabsTrigger value="strategy" className="gap-2 text-sm px-5 py-2">
              <LineChart className="h-4 w-4" />
              Strategy Builder
            </TabsTrigger>
            <TabsTrigger value="agent" className="gap-2 text-sm px-5 py-2">
              <Brain className="h-4 w-4" />
              Agent Backtest
            </TabsTrigger>
          </TabsList>

          <TabsContent value="strategy" className="mt-0">
            <StrategyWorkspaceInterface initialTab={initialTab} onSwitchToAgent={() => handleModeChange('agent')} />
          </TabsContent>

          <TabsContent value="agent" className="mt-0">
            <AgentBacktestPanel onSendToBacktest={handleSendToBacktest} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StrategyWorkspace;
