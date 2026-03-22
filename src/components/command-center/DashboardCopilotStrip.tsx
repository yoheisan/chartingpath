import { useCopilotTrades } from '@/hooks/useCopilotTrades';
import { useCopilotInsight } from '@/hooks/useCopilotInsight';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const formatR = (v: number) => (v >= 0 ? `+${v.toFixed(1)}R` : `${v.toFixed(1)}R`);

export function DashboardCopilotBar() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { openTrades, stats } = useCopilotTrades(user?.id);

  const statusText = openTrades.length > 0
    ? t('commandCenter.paperTradeOpen', { symbols: openTrades.map(t => t.symbol).join(', '), pnl: formatR(stats.aiPnlR) })
    : stats.aiTradeCount > 0 ? t('commandCenter.runningPlan', { count: stats.aiTradeCount }) : t('commandCenter.noPlanSet', 'No trading plan set · Set one to start paper testing');

  return (
    <div className="w-full px-4 py-2 flex items-center gap-3 bg-blue-500/5 border-b border-blue-500/20">
      <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-blue-400">C</span>
      </div>
      <p className="text-xs text-muted-foreground flex-1 truncate">{statusText}</p>
      <span className="text-sm text-muted-foreground shrink-0">
        {openTrades.length > 0 ? t('commandCenter.paperActive', 'Paper active') : t('commandCenter.paperRunning', 'Paper running')}
      </span>
    </div>
  );
}

export function DashboardAIStrip() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { stats } = useCopilotTrades(user?.id);
  const { insight, loading: insightLoading } = useCopilotInsight(user?.id);

  return (
    <div className="w-full bg-card border-b border-border/40">
      <div className="flex items-center">
        <div className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4">
          <span className="text-xs text-muted-foreground">{t('commandCenter.copilotToday', 'Copilot today')}</span>
          <span className={`text-sm font-bold font-mono ${stats.aiPnlR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatR(stats.aiPnlR)}
          </span>
          <span className="text-sm font-mono text-muted-foreground">
            · {stats.aiWinRate}% · {stats.aiTradeCount} {t('commandCenter.trades', 'trades')}
          </span>
        </div>
        <div className="w-px h-8 bg-border/40" />
        <div className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4">
          <span className="text-xs text-muted-foreground">{t('commandCenter.yourOverrides', 'Your overrides')}</span>
          <span className={`text-sm font-bold font-mono ${stats.humanPnlR >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stats.humanPnlR === 0 ? '0.0R' : formatR(stats.humanPnlR)}
          </span>
          <span className="text-sm font-mono text-muted-foreground">
            · {stats.humanWinRate}% · {stats.humanTradeCount} {t('commandCenter.trades', 'trades')}
          </span>
        </div>
      </div>
      <div className="px-4 pb-1.5 -mt-1">
        <p className={`text-sm text-muted-foreground/70 text-center transition-opacity ${insightLoading ? 'animate-pulse opacity-60' : ''}`}>
          {insight || (stats.aiTradeCount + stats.humanTradeCount > 0
            ? `AI: ${formatR(stats.aiPnlR)} vs ${t('commandCenter.overrides', 'Overrides')}: ${formatR(stats.humanPnlR)}`
            : t('commandCenter.noTradesYet', 'No trades yet today — Copilot is scanning'))}
        </p>
      </div>
    </div>
  );
}
