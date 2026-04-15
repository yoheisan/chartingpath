import { usePatternConcentration } from '@/hooks/usePatternConcentration';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import { Grid3X3 } from 'lucide-react';

const ASSETS = ['stocks', 'fx', 'crypto', 'etfs', 'indices', 'commodities'] as const;
const TIMEFRAMES = ['1h', '4h', '8h', '1d'] as const;

const ASSET_LABELS: Record<string, string> = {
  stocks: 'Stocks', fx: 'Forex', crypto: 'Crypto',
  etfs: 'ETFs', indices: 'Indices', commodities: 'Commodities',
};

const TF_LABELS: Record<string, string> = {
  '1h': '1H', '4h': '4H', '8h': '8H', '1d': '1D',
};

function cellClasses(score: number, count: number) {
  if (count === 0) return 'bg-muted/20 text-muted-foreground/30';
  if (score >= 3.2) return 'bg-emerald-500/30 text-emerald-300 ring-1 ring-inset ring-emerald-500/20';
  if (score >= 2.5) return 'bg-emerald-500/15 text-emerald-400/80';
  if (score >= 1.8) return 'bg-amber-500/15 text-amber-400';
  return 'bg-red-500/10 text-red-400/70';
}

function gradeLabel(score: number) {
  if (score >= 3.5) return 'A';
  if (score >= 2.5) return 'B';
  if (score >= 1.5) return 'C';
  return 'D';
}

export function PatternConcentrationHeatmap() {
  const { data, isLoading } = usePatternConcentration();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading || !data?.length) return null;

  const cellMap = new Map<string, { count: number; score: number }>();
  const assetTotals = new Map<string, { count: number; bestScore: number }>();

  data.forEach(c => {
    cellMap.set(`${c.asset_type}:${c.timeframe}`, { count: c.pattern_count, score: c.avg_grade_score });
    const prev = assetTotals.get(c.asset_type) ?? { count: 0, bestScore: 0 };
    assetTotals.set(c.asset_type, {
      count: prev.count + c.pattern_count,
      bestScore: Math.max(prev.bestScore, c.avg_grade_score),
    });
  });

  const activeAssets = ASSETS.filter(a => (assetTotals.get(a)?.count ?? 0) > 0);
  const totalActive = data.reduce((s, c) => s + c.pattern_count, 0);
  const gradeAB = data.reduce((s, c) => s + c.grade_a + c.grade_b, 0);

  // Find hottest cell
  let hottest = { asset: '', tf: '', count: 0 };
  data.forEach(c => { if (c.pattern_count > hottest.count) hottest = { asset: c.asset_type, tf: c.timeframe, count: c.pattern_count }; });

  return (
    <section className="py-16 px-4 md:px-6 lg:px-8 border-t border-border/20">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <Grid3X3 className="h-5 w-5 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {t('heatmap.title', 'Pattern Concentration')}
          </h2>
        </div>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          {t('heatmap.subtitle', 'Where high-quality setups are clustering right now — click any cell to explore')}
        </p>

        {/* Wide layout: grid + sidebar (matching MarketPulseChart) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Heatmap panel */}
          <div className="rounded-xl border border-border/40 bg-card/60 p-4 md:p-6">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-[100px] md:w-[120px]" />
                  {TIMEFRAMES.map(tf => (
                    <th key={tf} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center pb-3 px-1">
                      {TF_LABELS[tf]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeAssets.map(asset => (
                  <tr key={asset}>
                    <td className="text-sm font-medium text-foreground/70 pr-3 py-1 text-right whitespace-nowrap">
                      {ASSET_LABELS[asset]}
                    </td>
                    {TIMEFRAMES.map(tf => {
                      const cell = cellMap.get(`${asset}:${tf}`);
                      const count = cell?.count ?? 0;
                      const score = cell?.score ?? 0;
                      return (
                        <td key={tf} className="p-1">
                          <button
                            disabled={count === 0}
                            onClick={() => {
                              trackEvent('heatmap.cell_click', { asset, timeframe: tf });
                              navigate(`/patterns/live?asset=${asset}&timeframe=${tf}`);
                            }}
                            className={cn(
                              'w-full h-14 md:h-16 rounded-lg flex flex-col items-center justify-center transition-all duration-150',
                              cellClasses(score, count),
                              count > 0 && 'hover:scale-[1.03] hover:brightness-125 cursor-pointer',
                              count === 0 && 'cursor-default'
                            )}
                          >
                            <span className="text-lg md:text-xl font-bold tabular-nums leading-none">
                              {count > 0 ? count : '–'}
                            </span>
                            {count > 0 && (
                              <span className="text-[10px] font-medium mt-0.5 opacity-70">
                                {gradeLabel(score)}
                              </span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sidebar stats */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border/40 bg-card/60 p-5">
              <div className="text-xs text-muted-foreground mb-1">{t('heatmap.totalActive', 'Total Active')}</div>
              <div className="text-3xl font-bold text-foreground tabular-nums">{totalActive}</div>
            </div>

            <div className="rounded-xl border border-border/40 bg-card/60 p-5">
              <div className="text-xs text-muted-foreground mb-1">{t('heatmap.gradeAB', 'Grade A–B')}</div>
              <div className="text-3xl font-bold text-emerald-400 tabular-nums">{gradeAB}</div>
            </div>

            <div className="rounded-xl border border-border/40 bg-card/60 p-5">
              <div className="text-xs text-muted-foreground mb-1">{t('heatmap.hottestZone', 'Hottest Zone')}</div>
              <div className="text-lg font-bold text-foreground">
                {ASSET_LABELS[hottest.asset] ?? '–'} · {TF_LABELS[hottest.tf] ?? '–'}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{hottest.count} {t('heatmap.setups', 'setups')}</div>
            </div>

            {/* Grade legend */}
            <div className="rounded-xl border border-border/40 bg-card/60 p-5">
              <div className="text-xs text-muted-foreground mb-3">{t('heatmap.gradeLegend', 'Grade Scale')}</div>
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-emerald-500/30 ring-1 ring-inset ring-emerald-500/20" />
                  <span className="text-foreground/80">A – B</span>
                  <span className="text-muted-foreground ml-auto">{t('heatmap.highQuality', 'High quality')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-emerald-500/15" />
                  <span className="text-foreground/80">B – C</span>
                  <span className="text-muted-foreground ml-auto">{t('heatmap.moderate', 'Moderate')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-amber-500/15" />
                  <span className="text-foreground/80">C</span>
                  <span className="text-muted-foreground ml-auto">{t('heatmap.mixed', 'Mixed')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-red-500/10" />
                  <span className="text-foreground/80">D</span>
                  <span className="text-muted-foreground ml-auto">{t('heatmap.low', 'Low')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
