import React, { useState } from 'react';
import { AgentBacktestPanel } from '@/components/AgentBacktestPanel';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TradeSetup } from '@/components/agent-backtest/TradeOpportunityTable';
import { useTranslation } from 'react-i18next';

const AgentScoring = () => {
  const { t } = useTranslation();
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
    toast.success(t('agentScoring.loadedIntoPatternLab', { symbol: setup.symbol, pattern: setup.pattern }));
  };

  const handleReset = () => {
    setResetKey((k) => k + 1);
    toast.info(t('agentScoring.pageReset'));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full px-4 md:px-6 lg:px-8 pt-6 pb-12">
        <AgentBacktestPanel key={resetKey} onSendToBacktest={handleSendToBacktest} onReset={handleReset} />
      </div>
    </div>
  );
};

export default AgentScoring;
