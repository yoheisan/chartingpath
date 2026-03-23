import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type PaperTrade } from '@/hooks/useTradeReport';

interface Props { trades: PaperTrade[] }

interface HourBucket {
  hour: number;
  trades: number;
  avgR: number;
  winRate: number;
}

export function TimeOfDayHeatmap({ trades }: Props) {
  const { t } = useTranslation();

  const buckets = useMemo(() => {
    const map = new Map<number, PaperTrade[]>();
    for (let i = 0; i < 24; i++) map.set(i, []);
    for (const tr of trades) {
      const d = new Date(tr.created_at);
      const h = d.getHours();
      map.get(h)!.push(tr);
    }

    const result: HourBucket[] = [];
    map.forEach((pts, hour) => {
      if (pts.length === 0) {
        result.push({ hour, trades: 0, avgR: 0, winRate: 0 });
      } else {
        const sum = pts.reduce((s, tr) => s + (tr.outcome_r ?? 0), 0);
        const wins = pts.filter(tr => (tr.outcome_r ?? 0) > 0).length;
        result.push({
          hour,
          trades: pts.length,
          avgR: sum / pts.length,
          winRate: Math.round((wins / pts.length) * 100),
        });
      }
    });
    return result.sort((a, b) => a.hour - b.hour);
  }, [trades]);

  const activeBuckets = buckets.filter(b => b.trades > 0);
  const bestHour = activeBuckets.length > 0
    ? activeBuckets.reduce((a, b) => a.winRate > b.winRate ? a : b)
    : null;
  const worstHour = activeBuckets.length > 0
    ? activeBuckets.reduce((a, b) => a.winRate < b.winRate ? a : b)
    : null;

  const maxAbsR = Math.max(...buckets.map(b => Math.abs(b.avgR)), 0.1);

  return (
    <div className="bg-card border border-border/40 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">{t('report.timeOfDay')}</h2>

      <div className="flex gap-0.5 items-end">
        {buckets.map(b => {
          let bg = 'bg-muted/30';
          if (b.trades > 0) {
            bg = b.avgR >= 0 ? 'bg-[hsl(var(--bullish))]' : 'bg-[hsl(var(--bearish))]';
          }

          return (
            <div key={b.hour} className="flex-1 group relative">
              <div
                className={`h-10 rounded-sm transition-all ${bg}`}
                style={{
                  opacity: b.trades === 0 ? 0.15 : Math.max(0.3, Math.min(1, Math.abs(b.avgR) / maxAbsR)),
                }}
              />
              <span className="text-[8px] text-muted-foreground text-center block mt-1">
                {String(b.hour).padStart(2, '0')}
              </span>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-popover border border-border rounded-md px-2 py-1.5 text-[10px] whitespace-nowrap shadow-lg">
                  <p className="font-medium">{String(b.hour).padStart(2, '0')}:00</p>
                  <p>{t('report.hourTooltip', { count: b.trades, avgR: `${b.avgR >= 0 ? '+' : ''}${b.avgR.toFixed(1)}`, winRate: b.winRate })}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 mt-4 text-xs text-muted-foreground">
        {bestHour && <span>{t('report.bestTradingHour')} <span className="text-foreground font-medium">{String(bestHour.hour).padStart(2, '0')}:00</span> — {t('report.hourWinRate', { rate: bestHour.winRate })}</span>}
        {worstHour && <span>{t('report.worstTradingHour')} <span className="text-foreground font-medium">{String(worstHour.hour).padStart(2, '0')}:00</span> — {t('report.hourWinRate', { rate: worstHour.winRate })}</span>}
      </div>
    </div>
  );
}
