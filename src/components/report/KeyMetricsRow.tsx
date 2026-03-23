import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { calcWinRate, calcAvgR, calcTotalR, calcAvgHoldTime, calcBestStreak, type PaperTrade } from '@/hooks/useTradeReport';

interface Props { trades: PaperTrade[] }

export function KeyMetricsRow({ trades }: Props) {
  const { t } = useTranslation();

  const metrics = useMemo(() => {
    const wr = calcWinRate(trades);
    const avgR = calcAvgR(trades);
    const totalR = calcTotalR(trades);
    const hold = calcAvgHoldTime(trades);
    const streak = calcBestStreak(trades);
    return [
      { label: t('report.totalTrades'), value: `${trades.length}` },
      { label: t('report.winRate'), value: `${wr}%` },
      { label: t('report.avgRPerTrade'), value: `${avgR >= 0 ? '+' : ''}${avgR.toFixed(1)}R`, color: avgR >= 0 },
      { label: t('report.totalPnlR'), value: `${totalR >= 0 ? '+' : ''}${totalR.toFixed(1)}R`, color: totalR >= 0 },
      { label: t('report.avgHoldTime'), value: t('report.holdTimeFormat', { hours: hold.hours, mins: hold.mins }) },
      { label: t('report.bestStreak'), value: t('report.winsUnit', { count: streak }) },
    ];
  }, [trades, t]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {metrics.map(m => (
        <div key={m.label} className="bg-card border border-border/40 rounded-lg p-4">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{m.label}</p>
          <p className={`text-xl font-mono font-bold mt-1 ${
            m.color === undefined ? 'text-foreground' : m.color ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'
          }`}>
            {m.value}
          </p>
        </div>
      ))}
    </div>
  );
}
