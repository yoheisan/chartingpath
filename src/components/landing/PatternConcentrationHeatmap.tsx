import { usePatternConcentration } from '@/hooks/usePatternConcentration';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

const ASSETS = ['stocks', 'fx', 'crypto', 'etfs', 'indices', 'commodities'] as const;
const TIMEFRAMES = ['1h', '4h', '8h', '1d'] as const;

const ASSET_LABELS: Record<string, string> = {
  stocks: 'Stocks', fx: 'Forex', crypto: 'Crypto',
  etfs: 'ETFs', indices: 'Indices', commodities: 'Cmdty',
};

const TF_LABELS: Record<string, string> = {
  '1h': '1H', '4h': '4H', '8h': '8H', '1d': '1D',
};

/** avg_grade_score 0-4 → Tailwind classes */
function cellClasses(score: number, count: number) {
  if (count === 0) return 'bg-muted/20 text-muted-foreground/30';
  if (score >= 3.2) return 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/20';
  if (score >= 2.5) return 'bg-emerald-500/15 text-emerald-400/80';
  if (score >= 1.8) return 'bg-amber-500/15 text-amber-400';
  return 'bg-red-500/10 text-red-400/70';
}

export function PatternConcentrationHeatmap() {
  const { data, isLoading } = usePatternConcentration();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading || !data?.length) return null;

  const cellMap = new Map<string, { count: number; score: number }>();
  data.forEach(c => cellMap.set(`${c.asset_type}:${c.timeframe}`, {
    count: c.pattern_count, score: c.avg_grade_score,
  }));

  const activeAssets = ASSETS.filter(a =>
    TIMEFRAMES.some(tf => (cellMap.get(`${a}:${tf}`)?.count ?? 0) > 0)
  );

  const totalActive = data.reduce((s, c) => s + c.pattern_count, 0);

  return (
    <section className="py-10 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            {t('heatmap.title', 'Pattern Concentration')}
          </h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            {totalActive} {t('heatmap.activeSetups', 'active setups')}
          </span>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full border-collapse" style={{ minWidth: 340 }}>
            <thead>
              <tr>
                <th className="w-[72px]" />
                {TIMEFRAMES.map(tf => (
                  <th key={tf} className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-center pb-2 px-1">
                    {TF_LABELS[tf]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeAssets.map(asset => (
                <tr key={asset}>
                  <td className="text-xs font-medium text-foreground/70 pr-2 py-[3px] text-right whitespace-nowrap">
                    {ASSET_LABELS[asset]}
                  </td>
                  {TIMEFRAMES.map(tf => {
                    const cell = cellMap.get(`${asset}:${tf}`);
                    const count = cell?.count ?? 0;
                    const score = cell?.score ?? 0;
                    return (
                      <td key={tf} className="p-[3px]">
                        <button
                          disabled={count === 0}
                          onClick={() => {
                            trackEvent('heatmap.cell_click', { asset, timeframe: tf });
                            navigate(`/patterns/live?asset=${asset}&timeframe=${tf}`);
                          }}
                          className={cn(
                            'w-full aspect-[2/1] rounded-[5px] flex items-center justify-center text-xs font-bold tabular-nums transition-all',
                            cellClasses(score, count),
                            count > 0 && 'hover:scale-105 hover:brightness-125 cursor-pointer',
                            count === 0 && 'cursor-default'
                          )}
                        >
                          {count > 0 ? count : '–'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grade legend */}
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 ring-1 ring-emerald-500/20" /> A–B
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/15" /> B–C
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/15" /> C
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500/10" /> D
          </span>
        </div>
      </div>
    </section>
  );
}
