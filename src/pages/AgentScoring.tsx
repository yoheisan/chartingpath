import React, { useState, useEffect } from 'react';
import { AgentBacktestPanel } from '@/components/AgentBacktestPanel';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TradeSetup } from '@/components/agent-backtest/TradeOpportunityTable';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { PageMeta } from '@/components/PageMeta';
import { setViewContext } from '@/lib/copilotEvents';

const AgentScoring = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [resetKey, setResetKey] = useState(0);

  // Set page-level view context for Copilot
  useEffect(() => {
    setViewContext({ page: 'agent-scoring' });
  }, []);

  const handleSendToBacktest = (setup: TradeSetup) => {
    const params = new URLSearchParams({
      instrument: setup.symbol,
      pattern: setup.patternId,
      timeframe: setup.timeframe,
      mode: 'validate',
    });
    navigate(`/projects/pattern-lab/new?${params.toString()}`);
    toast.success(t('agentScoring.loadedIntoPatternLab', { symbol: setup.symbol, pattern: setup.pattern }));
  };

  const handleReset = () => {
    setResetKey((k) => k + 1);
    toast.info(t('agentScoring.pageReset'));
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="AI Pattern Scoring — TAKE, WATCH or SKIP Every Signal | ChartingPath"
        description="Four AI agents score every live pattern signal for win rate, risk, timing and portfolio fit. Get a composite 0-100 score and actionable verdict on every setup."
        canonicalPath="/tools/agent-scoring"
      />

      <div className="w-full px-4 md:px-6 lg:px-8 pt-6 pb-12">
        <AgentBacktestPanel key={resetKey} onSendToBacktest={handleSendToBacktest} onReset={handleReset} />
      </div>
    </div>
  );
};

export default AgentScoring;
