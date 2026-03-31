import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { type PaperTrade } from '@/hooks/useTradeReport';

interface Props { trades: PaperTrade[] }

interface HourBucket {
  hour: number;
  trades: number;
  avgR: number;
  winRate: number;
}

const LABEL_HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

function getHeatColor(bucket: HourBucket): string {
  if (bucket.trades === 0) return 'bg-muted/25';
  if (bucket.winRate >= 70) return 'bg-emerald-600';
  if (bucket.winRate >= 50) return 'bg-emerald-400';
  if (bucket.winRate >= 30) return 'bg-amber-400';
  return 'bg-red-400';
}

export function TimeOfDayHeatmap({ trades }: Props) {
  const { t } = useTranslation();

  const buckets = useMemo(() => {
    const map = new Map<number, PaperTrade[]>();
    for (let i = 0; i < 24; i++) map.set(i, []);
    for (const tr of trades) {
      const h = new Date(tr.created_at).getHours();
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

  // Find consecutive weak hours to suggest exclusion
  const excludeRange = useMemo(() => {
    const weak = buckets.filter(b => b.trades >= 2 && b.winRate < 40);
    if (weak.length < 2) return null;
    // Find longest consecutive run of weak hours
    let bestStart = weak[0].hour, bestLen = 1, curStart = weak[0].hour, curLen = 1;
    for (let i = 1; i < weak.length; i++) {
      if (weak[i].hour === weak[i - 1].hour + 1) {
        curLen++;
        if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
      } else {
        curStart = weak[i].hour;
        curLen = 1;
      }
    }
    if (bestLen < 2) return null;
    return { start: bestStart, end: (bestStart + bestLen) % 24 };
  }, [buckets]);

  const legend = [
    { label: t('report.legendStrong'), className: 'bg-emerald-600' },
    { label: t('report.legendPositive'), className: 'bg-emerald-400' },
    { label: t('report.legendWeak'), className: 'bg-amber-400' },
    { label: t('report.legendAvoid'), className: 'bg-red-400' },
    { label: t('report.legendNoData'), className: 'bg-muted/25' },
  ];

  return (
    <div className="bg-card border border-border/40 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-5">{t('report.timeOfDay')}</h2>

      {/* Heatmap grid */}
      <div className="space-y-1">
        {/* Cells */}
        <div className="grid grid-cols-24 gap-1">
          {buckets.map(b => (
            <div key={b.hour} className="group relative">
              <div
                className={`aspect-square rounded-md ${getHeatColor(b)} transition-all hover:ring-2 hover:ring-foreground/30 cursor-default`}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none">
                <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs whitespace-nowrap shadow-xl">
                  <p className="font-semibold text-foreground">{String(b.hour).padStart(2, '0')}:00</p>
                  {b.trades > 0 ? (
                    <p className="text-muted-foreground mt-0.5">
                      {t('report.hourTooltip', { count: b.trades, avgR: `${b.avgR >= 0 ? '+' : ''}${b.avgR.toFixed(1)}`, winRate: b.winRate })}
                    </p>
                  ) : (
                    <p className="text-muted-foreground mt-0.5">{t('report.noTrades')}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* X-axis labels */}
        <div className="grid grid-cols-24 gap-1">
          {buckets.map(b => (
            <div key={b.hour} className="text-center">
              {LABEL_HOURS.includes(b.hour) ? (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {String(b.hour).padStart(2, '0')}
                </span>
              ) : (
                <span className="text-[10px] invisible">00</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4">
        {legend.map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${l.className}`} />
            <span className="text-[11px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-1.5 mt-5 text-xs text-muted-foreground">
        {bestHour && (
          <span>
            {t('report.bestTradingHour')} <span className="text-foreground font-medium">{String(bestHour.hour).padStart(2, '0')}:00</span> — {t('report.hourWinRate', { rate: bestHour.winRate })}
          </span>
        )}
        {worstHour && (
          <span>
            {t('report.worstTradingHour')} <span className="text-foreground font-medium">{String(worstHour.hour).padStart(2, '0')}:00</span> — {t('report.hourWinRate', { rate: worstHour.winRate })}
          </span>
        )}
        {excludeRange && (
          <span>
            {t('report.considerRestricting')}{' '}
            <Link to="/copilot?tab=plan" className="text-primary hover:underline font-medium">
              {t('report.masterPlanLink')}
            </Link>{' '}
            {t('report.tradingWindowExclude')}{' '}
            <span className="text-foreground font-medium">
              {String(excludeRange.start).padStart(2, '0')}:00–{String(excludeRange.end).padStart(2, '0')}:00
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
