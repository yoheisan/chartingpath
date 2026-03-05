import React from 'react';
import { AgentBacktestPanel } from '@/components/AgentBacktestPanel';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TradeSetup } from '@/components/agent-backtest/TradeOpportunityTable';

const AgentScoring = () => {
  const navigate = useNavigate();

  const handleSendToBacktest = (setup: TradeSetup) => {
    // Store trade setup for Pattern Lab to pick up
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-6 pb-12">
        <AgentBacktestPanel onSendToBacktest={handleSendToBacktest} />
      </div>
    </div>
  );
};

export default AgentScoring;
