import React, { useState } from 'react';
import { AgentBacktestPanel } from '@/components/AgentBacktestPanel';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { TradeSetup } from '@/components/agent-backtest/TradeOpportunityTable';
import { useTranslation } from 'react-i18next';
import { CopilotSidebar } from '@/components/copilot/CopilotSidebar';
import { Button } from '@/components/ui/button';
import { Sparkles, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { PageMeta } from '@/components/PageMeta';

const AgentScoring = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [resetKey, setResetKey] = useState(0);
  const [showCopilot, setShowCopilot] = useState(false);
  const isMobile = useIsMobile();

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
    <div className="min-h-screen bg-background flex">
      <PageMeta
        title="AI Pattern Scoring — TAKE, WATCH or SKIP Every Signal | ChartingPath"
        description="Four AI agents score every live pattern signal for win rate, risk, timing and portfolio fit. Get a composite 0-100 score and actionable verdict on every setup."
        canonicalPath="/tools/agent-scoring"
      />
      {/* Copilot Sidebar */}
      {showCopilot && !isMobile && (
        <div className="w-[420px] shrink-0 h-[calc(100dvh-4rem)] sticky top-16 border-r border-border animate-in slide-in-from-left-4 duration-200 overflow-hidden">
          <CopilotSidebar onClose={() => setShowCopilot(false)} context={{ domain: 'scoring', route: '/tools/agent-scoring', quickPrompts: [t('copilot.ctx.scoringPrompt1'), t('copilot.ctx.scoringPrompt2'), t('copilot.ctx.scoringPrompt3')] }} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="w-full px-4 md:px-6 lg:px-8 pt-6 pb-12">
          {/* Toggle button */}
          {!showCopilot && !isMobile && (
            <Button
              variant="outline"
              size="sm"
              className="mb-4 gap-2 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 hover:border-primary/40"
              onClick={() => setShowCopilot(true)}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{t('copilot.openSidebar', 'AI Copilot')}</span>
              <kbd className="ml-1 text-[10px] text-muted-foreground bg-muted px-1 py-0.5 rounded">⌘K</kbd>
            </Button>
          )}

          {/* Mobile: floating button */}
          {isMobile && (
            <Button
              variant="default"
              size="sm"
              className="fixed bottom-20 right-4 z-40 rounded-full shadow-xl gap-1.5 bg-gradient-to-r from-primary to-accent"
              onClick={() => setShowCopilot(v => !v)}
            >
              <Sparkles className="h-4 w-4" />
              <span className="text-xs">AI</span>
            </Button>
          )}

          <AgentBacktestPanel key={resetKey} onSendToBacktest={handleSendToBacktest} onReset={handleReset} />
        </div>
      </div>

      {/* Mobile: bottom sheet copilot */}
      {showCopilot && isMobile && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="flex-1 bg-background/80 backdrop-blur-sm" onClick={() => setShowCopilot(false)} />
          <div className="h-[70vh] bg-background border-t border-border rounded-t-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            <CopilotSidebar onClose={() => setShowCopilot(false)} context={{ domain: 'scoring', route: '/tools/agent-scoring', quickPrompts: [t('copilot.ctx.scoringPrompt1'), t('copilot.ctx.scoringPrompt2'), t('copilot.ctx.scoringPrompt3')] }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentScoring;
