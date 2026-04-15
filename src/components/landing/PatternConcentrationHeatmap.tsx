import { usePatternConcentration } from '@/hooks/usePatternConcentration';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import { TrendingUp } from 'lucide-react';

const ASSETS = ['stocks', 'fx', 'crypto', 'etfs', 'indices', 'commodities'] as const;
const TIMEFRAMES = ['1h', '4h', '8h', '1d'] as const;

const ASSET_LABELS: Record<string, string> = {
  stocks: 'Stocks', fx: 'Forex', crypto: 'Crypto',
  etfs: 'ETFs', indices: 'Indices', commodities: 'Cmdty',
};

const TF_SHORT: Record<string, string> = { '1h': '1H', '4h': '4H', '8h': '8H', '1d': '1D' };

function gradeColor(score: number) {
  if (score >= 3.2) return 'bg-emerald-500';
  if (score >= 2.5) return 'bg-emerald-500/60';
  if (score >= 1.8) return 'bg-amber-500/70';
  return 'bg-muted-foreground/30';
}

export function PatternConcentrationHeatmap() {
  const { data, isLoading } = usePatternConcentration();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading || !data?.length) return null;

  // Build lookup & per-asset totals
  const cellMap = new Map<string, { count: number; score: number }>();
  const assetTotals = new Map<string, number>();

  data.forEach(c => {
    cellMap.set(`${c.asset_type}:${c.timeframe}`, { count: c.pattern_count, score: c.avg_grade_score });
    assetTotals.set(c.asset_type, (assetTotals.get(c.asset_type) ?? 0) + c.pattern_count);
  });

  // Find max count for bar scaling
  const maxTfCount = Math.max(...data.map(c => c.pattern_count), 1);

  // Only show assets that have at least 1 pattern
  const activeAssets = ASSETS.filter(a => (assetTotals.get(a) ?? 0) > 0);

  return (
    <section className="py-10 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto">
        {/* Heading row */}
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            {t('heatmap.title', 'Where are the setups right now?')}
          </h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {t('heatmap.clickToExplore', 'Click to explore')}
          </span>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-2">
          {activeAssets.map(asset => {
            const total = assetTotals.get(asset) ?? 0;
            return (
              <button
                key={asset}
                onClick={() => {
                  trackEvent('heatmap.badge_click', { asset });
                  navigate(`/patterns/live?asset=${asset}`);
                }}
                className="group flex items-center gap-2.5 rounded-lg border border-border/40 bg-card/60 hover:border-primary/40 hover:bg-card transition-all px-3 py-2"
              >
                {/* Label + count */}
                <div className="flex items-baseline gap-1.5 shrink-0">
                  <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                    {ASSET_LABELS[asset]}
                  </span>
                  <span className="text-sm font-bold text-foreground tabular-nums">{total}</span>
                </div>

                {/* Mini sparkline bars */}
                <div className="flex items-end gap-[3px] h-[18px]">
                  {TIMEFRAMES.map(tf => {
                    const cell = cellMap.get(`${asset}:${tf}`);
                    const count = cell?.count ?? 0;
                    const score = cell?.score ?? 0;
                    const heightPct = count > 0 ? Math.max(20, (count / maxTfCount) * 100) : 8;
                    return (
                      <div key={tf} className="flex flex-col items-center gap-0.5" title={`${TF_SHORT[tf]}: ${count} patterns`}>
                        <div
                          className={cn(
                            'w-[6px] rounded-sm transition-all',
                            count > 0 ? gradeColor(score) : 'bg-muted/40'
                          )}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Timeframe labels under bars */}
                <div className="flex gap-[3px] text-[8px] text-muted-foreground/60 -ml-[30px] mt-[22px] absolute pointer-events-none sr-only">
                  {TIMEFRAMES.map(tf => (
                    <span key={tf} className="w-[6px] text-center">{TF_SHORT[tf][0]}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
