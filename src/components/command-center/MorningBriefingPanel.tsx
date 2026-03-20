/**
 * Morning Briefing Panel
 * 
 * Personalized daily dashboard summary embedded in the command center sidebar.
 * Shows watchlist signals, AI verdicts, paper trade updates, and market regime.
 */

import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { InstrumentLogo } from '@/components/charts/InstrumentLogo';
import { cn } from '@/lib/utils';
import {
  Sun,
  Moon,
  Sunrise,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Wallet,
  RefreshCw,
  Eye,
  Target,
  Shield,
  Clock,
  Lock,
} from 'lucide-react';
import { useMorningBriefing, WatchlistSignal, AIVerdict, PaperTradeUpdate, RegimeSummary } from '@/hooks/useMorningBriefing';

interface MorningBriefingPanelProps {
  userId?: string;
  onSymbolSelect?: (symbol: string) => void;
}

export function MorningBriefingPanel({ userId, onSymbolSelect }: MorningBriefingPanelProps) {
  const { t } = useTranslation();
  const { data, loading, error, refresh } = useMorningBriefing(userId);

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground text-sm gap-2">
        <Lock className="h-8 w-8 opacity-40" />
        <p>{t('morningBriefing.signInRequired', 'Sign in to see your Morning Briefing')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-3 space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground text-sm gap-2">
        <p>{t('morningBriefing.error', 'Failed to load briefing')}</p>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-3 w-3 mr-1" /> {t('morningBriefing.retry', 'Retry')}
        </Button>
      </div>
    );
  }

  const GreetingIcon = new Date().getHours() < 12 ? Sunrise : new Date().getHours() < 17 ? Sun : Moon;

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        {/* Greeting Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <GreetingIcon className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold">{data.greeting}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={refresh}>
            <RefreshCw className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>

        {/* Portfolio Snapshot */}
        <div className="rounded-lg border border-border/60 p-2.5 space-y-1.5 bg-muted/20">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            <Wallet className="h-3 w-3" />
            {t('morningBriefing.portfolio', 'Portfolio')}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('morningBriefing.balance', 'Balance')}</span>
            <span className="text-sm font-bold tabular-nums">
              ${data.portfolioBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t('morningBriefing.totalPnl', 'Total P&L')}</span>
            <span className={cn(
              'text-sm font-bold tabular-nums',
              data.portfolioPnl > 0 ? 'text-emerald-500' : data.portfolioPnl < 0 ? 'text-red-500' : 'text-muted-foreground'
            )}>
              {data.portfolioPnl >= 0 ? '+' : ''}${data.portfolioPnl.toFixed(2)}
            </span>
          </div>
          {data.openTrades.length > 0 && (
            <div className="text-[10px] text-muted-foreground">
              {t('morningBriefing.openPositions', '{{count}} open position(s)', { count: data.openTrades.length })}
            </div>
          )}
        </div>

        {/* Market Regime */}
        {data.regimeSummaries.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {t('morningBriefing.marketRegime', 'Market Regime')}
            </div>
            <div className="space-y-1">
              {data.regimeSummaries.map(regime => (
                <RegimeRow key={regime.assetClass} regime={regime} />
              ))}
            </div>
          </div>
        )}

        {/* Watchlist Signals */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              <Eye className="h-3 w-3" />
              {t('morningBriefing.watchlistSignals', 'Watchlist Signals')}
            </div>
            {data.watchlistSignals.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {data.watchlistSignals.length}
              </Badge>
            )}
          </div>
          {data.watchlistSignals.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              {t('morningBriefing.noWatchlistSignals', 'No active signals on your watchlist')}
            </p>
          ) : (
            <div className="space-y-1">
              {data.watchlistSignals.slice(0, 5).map(signal => (
                <SignalRow key={signal.id} signal={signal} onSelect={onSymbolSelect} />
              ))}
              {data.watchlistSignals.length > 5 && (
                <p className="text-[10px] text-muted-foreground text-center">
                  +{data.watchlistSignals.length - 5} {t('morningBriefing.more', 'more')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* AI Verdict Highlights */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            <Zap className="h-3 w-3" />
            {t('morningBriefing.topVerdicts', 'Top AI Verdicts')}
          </div>
          {data.aiVerdicts.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              {t('morningBriefing.noVerdicts', 'No high-confidence verdicts right now')}
            </p>
          ) : (
            <div className="space-y-1">
              {data.aiVerdicts.map(verdict => (
                <VerdictRow key={verdict.detectionId} verdict={verdict} onSelect={onSymbolSelect} />
              ))}
            </div>
          )}
        </div>

        {/* Open Trades */}
        {data.openTrades.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              <Target className="h-3 w-3" />
              {t('morningBriefing.openTrades', 'Open Trades')}
            </div>
            <div className="space-y-1">
              {data.openTrades.map(trade => (
                <TradeRow key={trade.id} trade={trade} onSelect={onSymbolSelect} />
              ))}
            </div>
          </div>
        )}

        {/* Recently Closed */}
        {data.recentlyClosed.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              <Clock className="h-3 w-3" />
              {t('morningBriefing.recentlyClosed', 'Closed (24h)')}
            </div>
            <div className="space-y-1">
              {data.recentlyClosed.slice(0, 3).map(trade => (
                <TradeRow key={trade.id} trade={trade} onSelect={onSymbolSelect} />
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <p className="text-[10px] text-muted-foreground/60 text-center">
          {t('morningBriefing.lastUpdated', 'Updated')} {new Date(data.lastUpdated).toLocaleTimeString()}
        </p>
      </div>
    </ScrollArea>
  );
}

/* ── Sub-components ── */

function RegimeRow({ regime }: { regime: RegimeSummary }) {
  const TrendIcon = regime.trend === 'bullish' ? TrendingUp : regime.trend === 'bearish' ? TrendingDown : Minus;
  const trendColor = regime.trend === 'bullish' ? 'text-emerald-500' : regime.trend === 'bearish' ? 'text-red-500' : 'text-muted-foreground';

  return (
    <div className="flex items-center justify-between rounded border border-border/40 px-2 py-1.5">
      <span className="text-xs font-medium capitalize">{regime.assetClass}</span>
      <div className="flex items-center gap-1.5">
        <TrendIcon className={cn('h-3 w-3', trendColor)} />
        <span className={cn('text-xs font-semibold capitalize', trendColor)}>{regime.trend}</span>
      </div>
    </div>
  );
}

function SignalRow({ signal, onSelect }: { signal: WatchlistSignal; onSelect?: (s: string) => void }) {
  const isLong = signal.direction === 'long';
  return (
    <button
      className="w-full flex items-center gap-2 rounded border border-border/40 px-2 py-1.5 hover:bg-muted/40 transition-colors text-left"
      onClick={() => onSelect?.(signal.instrument)}
    >
      <InstrumentLogo instrument={signal.instrument} size="sm" showName={false} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium truncate">{signal.instrument}</span>
          <Badge variant="outline" className={cn(
            'text-[9px] h-3.5 px-1',
            isLong ? 'border-emerald-500/40 text-emerald-600' : 'border-red-500/40 text-red-600'
          )}>
            {isLong ? '▲' : '▼'} {signal.patternName}
          </Badge>
        </div>
        <div className="text-[10px] text-muted-foreground">
          {signal.timeframe} · R:R {signal.riskReward.toFixed(1)}
          {signal.trendAlignment === 'with_trend' && ' · With Trend'}
        </div>
      </div>
    </button>
  );
}

function VerdictRow({ verdict, onSelect }: { verdict: AIVerdict; onSelect?: (s: string) => void }) {
  const scoreColor = verdict.compositeScore >= 70 ? 'text-emerald-500' : verdict.compositeScore >= 50 ? 'text-amber-500' : 'text-muted-foreground';
  return (
    <button
      className="w-full flex items-center gap-2 rounded border border-border/40 px-2 py-1.5 hover:bg-muted/40 transition-colors text-left"
      onClick={() => onSelect?.(verdict.instrument)}
    >
      <InstrumentLogo instrument={verdict.instrument} size="sm" showName={false} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium truncate">{verdict.instrument}</span>
          <span className="text-[10px] text-muted-foreground">{verdict.patternName}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <div className="flex items-center gap-0.5">
            <Shield className="h-2.5 w-2.5 text-muted-foreground" />
            <span>{verdict.winRate ? `${(verdict.winRate * 100).toFixed(0)}%` : '—'}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Target className="h-2.5 w-2.5 text-muted-foreground" />
            <span>{verdict.expectancyR ? `${verdict.expectancyR.toFixed(2)}R` : '—'}</span>
          </div>
        </div>
      </div>
      <span className={cn('text-sm font-bold tabular-nums', scoreColor)}>
        {verdict.compositeScore.toFixed(0)}
      </span>
    </button>
  );
}

function TradeRow({ trade, onSelect }: { trade: PaperTradeUpdate; onSelect?: (s: string) => void }) {
  const isWin = (trade.pnl ?? 0) > 0;
  return (
    <button
      className="w-full flex items-center gap-2 rounded border border-border/40 px-2 py-1.5 hover:bg-muted/40 transition-colors text-left"
      onClick={() => onSelect?.(trade.symbol)}
    >
      <InstrumentLogo instrument={trade.symbol} size="sm" showName={false} />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium truncate block">{trade.symbol}</span>
        <span className="text-[10px] text-muted-foreground capitalize">
          {trade.tradeType} · {trade.status === 'closed' ? (trade.closeReason || 'Closed') : 'Open'}
        </span>
      </div>
      {trade.pnl != null && (
        <span className={cn(
          'text-xs font-bold tabular-nums',
          isWin ? 'text-emerald-500' : 'text-red-500'
        )}>
          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
        </span>
      )}
      {trade.outcomeR != null && (
        <span className={cn(
          'text-[10px] tabular-nums',
          trade.outcomeR >= 0 ? 'text-emerald-500' : 'text-red-500'
        )}>
          {trade.outcomeR >= 0 ? '+' : ''}{trade.outcomeR.toFixed(1)}R
        </span>
      )}
    </button>
  );
}
