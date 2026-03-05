import React, { useState } from 'react';
import { AgentBacktestPanel } from '@/components/AgentBacktestPanel';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TradeSetup } from '@/components/agent-backtest/TradeOpportunityTable';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

const AgentScoring = () => {
  const navigate = useNavigate();
  const [resetKey, setResetKey] = useState(0);

  const handleSendToBacktest = (setup: TradeSetup) => {
    sessionStorage.setItem('shared_backtest_preset', JSON.stringify({
      symbol: setup.symbol,
      patternId: setup.patternId,
      pattern: setup.pattern,
      timeframe: setup.timeframe,
      autoRun: true,
    }));
    navigate('/projects/pattern-lab/new');
    toast.success(`Loaded ${setup.symbol} ${setup.pattern} into Pattern Lab`);
  };

  const handleReset = () => {
    setResetKey((k) => k + 1);
    toast.info('Page reset');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-6 pb-12">
        <div className="flex justify-end mb-4">
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-muted-foreground">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
        <AgentBacktestPanel key={resetKey} onSendToBacktest={handleSendToBacktest} />
      </div>
    </div>
  );
};

export default AgentScoring;
