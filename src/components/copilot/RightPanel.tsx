import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SessionDebriefPanel } from './SessionDebriefPanel';
import { DeployModal } from './DeployModal';
import { LiveControls } from './LiveControls';
import { DivergenceBanner } from './DivergenceBanner';
import { PaperPortfolioBar } from './PaperPortfolioBar';
import { useCopilotTrades, CopilotTrade } from '@/hooks/useCopilotTrades';
import { useLiveTrades, LiveTrade } from '@/hooks/useLiveTrades';
import { useCopilotInsight } from '@/hooks/useCopilotInsight';
import { useDeployGuardrails } from '@/hooks/useDeployGuardrails';
import { useBrokerConnection } from '@/hooks/useBrokerConnection';
import { useAuth } from '@/contexts/AuthContext';
import type { SelectedClosedTrade } from './CenterPanel';

const formatR = (v: number) => (v >= 0 ? `+${v.toFixed(1)}R` : `${v.toFixed(1)}R`);

interface RightPanelProps {
  openDebriefOnMount?: boolean;
  onDebriefOpened?: () => void;
  onTradeSelect?: (trade: SelectedClosedTrade) => void;
  debriefQuestion?: string | null;
}

const RightPanel = ({ openDebriefOnMount, onDebriefOpened, onTradeSelect, debriefQuestion }: RightPanelProps = {}) => {
  const { t } = useTranslation();
  const [debriefOpen, setDebriefOpen] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'paper' | 'live'>('paper');
  const { user } = useAuth();
  const { todayTrades, stats: paperStats, loading } = useCopilotTrades(user?.id);
  const { trades: liveTrades, stats: liveStats, loading: liveLoading } = useLiveTrades(user?.id);
  const { insight, loading: insightLoading } = useCopilotInsight(user?.id);
  const { checks, allPassed } = useDeployGuardrails(user?.id);
  const { connection, setPaused, setLive } = useBrokerConnection(user?.id);

  const isLive = connection?.is_live ?? false;
  const isPaused = connection?.is_paused ?? false;

  useEffect(() => {
    if (isLive) setActiveTab('live');
  }, [isLive]);

  useEffect(() => {
    if (openDebriefOnMount && !debriefOpen) {
      setDebriefOpen(true);
      onDebriefOpened?.();
    }
  }, [openDebriefOnMount, debriefOpen, onDebriefOpened]);

  const stats = activeTab === 'live' ? liveStats : paperStats;
  const currentTrades = activeTab === 'live' ? liveTrades : todayTrades;
  const isLoading = activeTab === 'live' ? liveLoading : loading;

  const deployPaperStats = {
    tradeCount: todayTrades.length,
    winRate: paperStats.aiWinRate,
    totalR: paperStats.aiPnlR + paperStats.humanPnlR,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Section 1 — Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
        <span className="text-sm font-semibold text-foreground">{t('copilotPage.yourEdge')}</span>
        <Link to="/copilot/report" className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">{t('copilotPage.fullReport')}</Link>
      </div>

      <PaperPortfolioBar userId={user?.id} />

      {isLive && (
        <div className="flex border-b border-border/40">
          {(['paper', 'live'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-foreground border-b-2 border-blue-500'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'paper' ? t('copilotPage.paper') : t('copilotPage.live')}
            </button>
          ))}
        </div>
      )}

      <DivergenceBanner userId={user?.id} isLive={isLive} />

      {/* Section 2 — AI vs Human Head-to-Head */}
      <div className="flex border-b border-border/40">
        <div className="flex-1 flex flex-col items-center py-2.5 gap-0.5 min-w-0">
          <span className="text-sm uppercase tracking-wider text-muted-foreground truncate">{t('copilotPage.copilotLabel')}</span>
          <span className={`text-base font-bold font-mono ${stats.aiPnlR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatR(stats.aiPnlR)}
          </span>
          <span className="text-sm font-mono text-muted-foreground truncate">
            {stats.aiWinRate}% · {stats.aiTradeCount} {t('copilotPage.trades')}
          </span>
        </div>
        <div className="w-px bg-border/40 shrink-0" />
        <div className="flex-1 flex flex-col items-center py-2.5 gap-0.5 min-w-0">
          <span className="text-sm uppercase tracking-wider text-muted-foreground truncate">{t('copilotPage.overridesLabel')}</span>
          <span className={`text-base font-bold font-mono ${stats.humanPnlR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stats.humanPnlR === 0 ? '0.0R' : formatR(stats.humanPnlR)}
          </span>
          <span className="text-sm font-mono text-muted-foreground truncate">
            {stats.humanWinRate}% · {stats.humanTradeCount} {t('copilotPage.trades')}
          </span>
        </div>
      </div>

      {/* Section 3 — Metric Cards 2×2 */}
      <div className="grid grid-cols-2 gap-1 p-1.5 border-b border-border/40">
        {[
          { label: t('copilotPage.aiAvgR'), value: formatR(activeTab === 'paper' ? paperStats.aiAvgR : (liveStats.aiTradeCount > 0 ? liveStats.aiPnlR / liveStats.aiTradeCount : 0)), sub: t('copilotPage.perTrade'), positive: (activeTab === 'paper' ? paperStats.aiAvgR : liveStats.aiPnlR) >= 0 },
          { label: t('copilotPage.ovrAvgR'), value: formatR(activeTab === 'paper' ? paperStats.humanAvgR : (liveStats.humanTradeCount > 0 ? liveStats.humanPnlR / liveStats.humanTradeCount : 0)), sub: t('copilotPage.perTrade'), positive: (activeTab === 'paper' ? paperStats.humanAvgR : liveStats.humanPnlR) >= 0 },
          { label: t('copilotPage.aiWinRate'), value: `${stats.aiWinRate}%`, sub: t('copilotPage.today'), positive: stats.aiWinRate >= 50 },
          { label: t('copilotPage.ovrWinRate'), value: `${stats.humanWinRate}%`, sub: t('copilotPage.today'), positive: stats.humanWinRate >= 50 },
        ].map((m) => (
          <div key={m.label} className="rounded-md bg-secondary/50 p-1.5 flex flex-col items-center gap-0.5 min-w-0">
            <span className="text-sm text-muted-foreground truncate w-full text-center">{m.label}</span>
            <span className={`text-sm font-bold font-mono ${m.positive ? 'text-green-500' : 'text-red-500'}`}>
              {m.value}
            </span>
            <span className="text-sm text-muted-foreground">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* Section 4 — Insight Card */}
      <div className={`mx-2 my-2 rounded-md bg-secondary/50 border-l-2 border-blue-500 px-2.5 py-2 transition-opacity ${insightLoading ? 'animate-pulse opacity-60' : ''}`}>
        <p className="text-sm leading-[1.6] text-muted-foreground">
          {insight || (currentTrades.length > 0
            ? `${t('copilotPage.today')}: ${stats.aiTradeCount} AI ${t('copilotPage.trades')} (${formatR(stats.aiPnlR)}), ${stats.humanTradeCount} overrides (${formatR(stats.humanPnlR)}).`
            : t('copilotPage.noTradesDefault'))}
        </p>
      </div>

      {/* Section 5 — Trade Log */}
      <div className="flex-1 min-h-0 flex flex-col border-t border-border/40 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {activeTab === 'live' ? t('copilotPage.todaysTradesLive') : t('copilotPage.todaysTrades')}
          </span>
          <button
            onClick={() => setDebriefOpen(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {t('copilotPage.review')}
          </button>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-0.5 px-2 pb-2">
            {isLoading ? (
              <div className="text-sm text-muted-foreground/50 text-center py-4">{t('copilotPage.loading')}</div>
            ) : currentTrades.length === 0 ? (
              <div className="text-sm text-muted-foreground/50 text-center py-4">{t('copilotPage.noTradesToday')}</div>
            ) : activeTab === 'paper' ? (
              (currentTrades as CopilotTrade[]).map((tr) => {
                const isAi = tr.attribution === 'ai_approved';
                const pnlR = tr.outcome_r ?? 0;
                const isPositive = pnlR >= 0;
                const statusLabel = tr.status === 'open' ? t('copilotPage.open') : tr.close_reason?.toLowerCase().includes('stop') ? t('copilotPage.stopped') : t('copilotPage.closed', { time: '', pnlR: '' }).split(' ')[0].toLowerCase();
                return (
                  <div key={tr.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/50 cursor-pointer" onClick={() => {
                    if (tr.status === 'closed' && onTradeSelect) {
                      onTradeSelect({
                        id: tr.id,
                        ticker: tr.symbol,
                        attribution: tr.attribution ?? 'ai_approved',
                        entry_price: tr.entry_price,
                        exit_price: tr.exit_price,
                        entry_time: tr.created_at,
                        exit_time: tr.closed_at,
                        pnl_r: tr.outcome_r ?? 0,
                        duration_mins: tr.closed_at ? Math.round((new Date(tr.closed_at).getTime() - new Date(tr.created_at).getTime()) / 60000) : 0,
                        gate_result: tr.gate_result ?? 'aligned',
                        gate_reason: tr.close_reason ?? '',
                        setup_type: tr.setup_type ?? tr.trade_type,
                        copilot_reasoning: tr.copilot_reasoning,
                      });
                    }
                  }}>
                    <Badge className={`text-sm px-1.5 py-0 font-medium rounded ${isAi ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                      {isAi ? 'AI' : 'You'}
                    </Badge>
                    <span className="text-xs font-mono font-bold text-foreground w-10">{tr.symbol}</span>
                    <span className="text-sm text-muted-foreground flex-1 truncate">{tr.setup_type || tr.trade_type} · {statusLabel}</span>
                    <span className={`text-xs font-mono font-semibold ${tr.status === 'open' ? 'text-muted-foreground' : isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {tr.status === 'open' ? t('copilotPage.open') : formatR(pnlR)}
                    </span>
                  </div>
                );
              })
            ) : (
              (currentTrades as LiveTrade[]).map((tr) => {
                const isAi = tr.attribution === 'ai_approved';
                const pnlR = tr.pnl_r ?? 0;
                const isPositive = pnlR >= 0;
                return (
                  <div key={tr.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-secondary/50 cursor-default">
                    <Badge className={`text-sm px-1.5 py-0 font-medium rounded ${isAi ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                      {isAi ? 'AI' : 'You'}
                    </Badge>
                    <span className="text-xs font-mono font-bold text-foreground w-10">{tr.ticker}</span>
                    <span className="text-sm text-muted-foreground flex-1 truncate">{tr.setup_type || 'Trade'} · {tr.outcome}</span>
                    <span className={`text-xs font-mono font-semibold ${tr.outcome === 'open' ? 'text-muted-foreground' : isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {tr.outcome === 'open' ? t('copilotPage.open') : formatR(pnlR)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {isLive && (
        <LiveControls
          isPaused={isPaused}
          onPause={() => setPaused(true)}
          onResume={() => setPaused(false)}
        />
      )}

      {/* Section 6 — Deploy Zone */}
      <div className="border-t border-border/40 px-3 py-3 flex flex-col items-center gap-1.5">
        {isLive ? (
          <div className="w-full flex items-center justify-center gap-2 rounded-md border border-blue-500/40 bg-blue-500/10 px-3 py-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPaused ? 'bg-amber-400' : 'bg-blue-400'} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isPaused ? 'bg-amber-500' : 'bg-blue-500'}`} />
            </span>
            <span className={`text-sm font-medium ${isPaused ? 'text-amber-400' : 'text-blue-400'}`}>
              {isPaused ? t('copilotPage.pausedAlpaca') : t('copilotPage.liveAlpaca')}
            </span>
          </div>
        ) : (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => allPassed && setDeployOpen(true)}
                  className={`w-full flex items-center justify-center gap-2 rounded-md border px-3 py-2 transition-colors ${
                    allPassed
                      ? 'border-green-500/40 bg-green-500/10 cursor-pointer hover:bg-green-500/20'
                      : 'border-border/40 bg-muted/20 cursor-default opacity-60'
                  }`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${allPassed ? 'bg-green-400' : 'bg-muted-foreground'} opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${allPassed ? 'bg-green-500' : 'bg-muted-foreground/50'}`} />
                  </span>
                  <span className={`text-sm font-medium ${allPassed ? 'text-green-400' : 'text-muted-foreground'}`}>
                    {t('copilotPage.goLiveAlpaca')}
                  </span>
                </button>
              </TooltipTrigger>
              {!allPassed && (
                <TooltipContent side="top" className="max-w-[240px]">
                  <div className="space-y-1">
                    {checks.filter(c => !c.passed).map((c, i) => (
                      <p key={i} className="text-xs">✗ {c.detail}</p>
                    ))}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
        <span className="text-sm text-muted-foreground">
          {isLive
            ? t('copilotPage.liveTradesToday', { count: liveTrades.length })
            : todayTrades.length > 0
              ? t('copilotPage.tradesTodaySummary', { count: todayTrades.length, totalR: formatR(paperStats.aiPnlR + paperStats.humanPnlR) })
              : t('copilotPage.paperRunningScanning')}
        </span>
      </div>

      <SessionDebriefPanel open={debriefOpen} onClose={() => setDebriefOpen(false)} initialQuestion={debriefQuestion} />
      <DeployModal
        open={deployOpen}
        onClose={() => setDeployOpen(false)}
        checks={checks}
        paperStats={deployPaperStats}
      />
    </div>
  );
};

export default RightPanel;
