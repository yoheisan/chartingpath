import { useMemo } from 'react';
import { calcWinRate, calcAvgR, calcTotalR, calcAvgHoldTime, calcBestStreak, type PaperTrade } from '@/hooks/useTradeReport';

interface Props { trades: PaperTrade[] }

export function KeyMetricsRow({ trades }: Props) {
  const metrics = useMemo(() => {
    const wr = calcWinRate(trades);
    const avgR = calcAvgR(trades);
    const totalR = calcTotalR(trades);
    const hold = calcAvgHoldTime(trades);
    const streak = calcBestStreak(trades);
    return [
      { label: 'Total trades', value: `${trades.length}` },
      { label: 'Win rate', value: `${wr}%` },
      { label: 'Avg R per trade', value: `${avgR >= 0 ? '+' : ''}${avgR.toFixed(1)}R`, color: avgR >= 0 },
      { label: 'Total P&L (R)', value: `${totalR >= 0 ? '+' : ''}${totalR.toFixed(1)}R`, color: totalR >= 0 },
      { label: 'Avg hold time', value: `${hold.hours}hrs ${hold.mins}min` },
      { label: 'Best streak', value: `${streak} wins` },
    ];
  }, [trades]);

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
