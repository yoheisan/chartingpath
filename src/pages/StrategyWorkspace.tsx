import React, { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StrategyWorkspaceInterface } from '@/components/StrategyWorkspaceInterface';
import { AgentBacktestPanel } from '@/components/AgentBacktestPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, LineChart } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 pt-4">
        <Tabs value={activeMode} onValueChange={handleModeChange}>
          <TabsList className="mb-4 sticky top-0 z-30 bg-muted">
            <TabsTrigger value="strategy" className="gap-1.5">
              <LineChart className="h-4 w-4" />
              Strategy Builder
            </TabsTrigger>
            <TabsTrigger value="agent" className="gap-1.5">
              <Brain className="h-4 w-4" />
              Agent Backtest
            </TabsTrigger>
          </TabsList>

          <TabsContent value="strategy" className="mt-0">
            <StrategyWorkspaceInterface initialTab={initialTab} />
          </TabsContent>

          <TabsContent value="agent" className="mt-0">
            <AgentBacktestPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StrategyWorkspace;
