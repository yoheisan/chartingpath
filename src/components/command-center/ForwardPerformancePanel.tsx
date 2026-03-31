import { useTranslation } from 'react-i18next';
import { translatePatternName } from '@/utils/translatePatternName';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { useForwardPerformance } from '@/hooks/useForwardPerformance';
import { cn } from '@/lib/utils';

interface ForwardPerformancePanelProps {
  userId?: string;
}

export function ForwardPerformancePanel({ userId }: ForwardPerformancePanelProps) {
  const { t } = useTranslation();
  const { data, loading } = useForwardPerformance(userId);

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground text-sm gap-2">
        <Activity className="h-8 w-8 opacity-40" />
        <p>{t('forwardPerformance.signInRequired', { defaultValue: 'Sign in to track forward performance' })}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        {t('common.loading', { defaultValue: 'Loading…' })}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground text-sm gap-2">
        <BarChart3 className="h-8 w-8 opacity-40" />
        <p>{t('forwardPerformance.noData', { defaultValue: 'Complete some paper trades to see forward performance vs. backtests' })}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-1.5 px-0.5 mb-1">
          <span className="text-xs font-medium text-muted-foreground">
            {t('forwardPerformance.title', { defaultValue: 'Forward vs. Backtest' })}
          </span>
          <InfoTooltip content={t('forwardPerformance.tooltip', { defaultValue: 'Compares your actual paper trading results against backtest predictions for the same patterns.' })} />
        </div>
        
        {data.map((item) => (
          <Card key={item.patternName} className="border-border/60 bg-muted/20">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold truncate">{translatePatternName(item.patternName)}</span>
                {item.confidenceScore !== null && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-sm px-1.5',
                      item.confidenceScore >= 70
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : item.confidenceScore >= 40
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {item.confidenceScore}% match
                  </Badge>
                )}
              </div>

              {/* Live metrics */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-0.5">
                    {t('forwardPerformance.liveWR', { defaultValue: 'Live WR' })}
                    <InfoTooltip term="winRate" size="h-3 w-3" />
                  </div>
                  <div className="text-sm font-semibold tabular-nums">
                    {item.liveWinRate.toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    {t('forwardPerformance.trades', { defaultValue: 'Trades' })}
                  </div>
                  <div className="text-sm font-semibold tabular-nums">{item.liveTrades}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground flex items-center justify-center gap-0.5">
                    P&L
                    <InfoTooltip term="totalPnl" size="h-3 w-3" />
                  </div>
                  <div className={cn('text-sm font-semibold tabular-nums', item.liveTotalPnl > 0 ? 'text-emerald-500' : item.liveTotalPnl < 0 ? 'text-red-500' : 'text-muted-foreground')}>
                    {item.liveTotalPnl >= 0 ? '+' : ''}{item.liveTotalPnl.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Backtest comparison */}
              {item.backtestWinRate !== null && (
                <div className="border-t border-border/40 pt-2">
                  <div className="text-sm text-muted-foreground mb-1">
                    {t('forwardPerformance.backtestComparison', { defaultValue: 'vs. Backtest' })}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">WR:</span>
                    <DeltaInline
                      live={item.liveWinRate}
                      backtest={item.backtestWinRate}
                      format={(v) => `${v.toFixed(0)}%`}
                    />
                    {item.backtestExpectancy !== null && (
                      <>
                        <span className="text-muted-foreground ml-2">Exp:</span>
                        <span className="tabular-nums">{item.backtestExpectancy.toFixed(2)}R</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

function DeltaInline({ live, backtest, format }: { live: number; backtest: number; format: (v: number) => string }) {
  const diff = live - backtest;
  const isPositive = diff >= 0;
  return (
    <span className="flex items-center gap-0.5 tabular-nums">
      <span>{format(live)}</span>
      <span className="text-muted-foreground/60">vs</span>
      <span>{format(backtest)}</span>
      <span className={cn('text-sm', isPositive ? 'text-emerald-500' : 'text-red-500')}>
        {isPositive ? <TrendingUp className="h-3 w-3 inline" /> : <TrendingDown className="h-3 w-3 inline" />}
      </span>
    </span>
  );
}
