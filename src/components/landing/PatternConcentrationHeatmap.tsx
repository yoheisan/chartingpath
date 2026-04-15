import { usePatternConcentration, type ConcentrationCell } from '@/hooks/usePatternConcentration';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics';

const ASSET_ROWS = ['stocks', 'fx', 'crypto', 'etfs', 'indices', 'commodities'] as const;
const TIMEFRAME_COLS = ['1h', '4h', '8h', '1d'] as const;

const ASSET_LABELS: Record<string, string> = {
  stocks: 'Stocks',
  fx: 'Forex',
  crypto: 'Crypto',
  etfs: 'ETFs',
  indices: 'Indices',
  commodities: 'Commodities',
};

const TF_LABELS: Record<string, string> = {
  '1h': '1H',
  '4h': '4H',
  '8h': '8H',
  '1d': '1D',
};

/** Map avg_grade_score (0-4) → intensity class */
function getCellStyle(score: number, count: number) {
  if (count === 0) return { bg: 'bg-muted/30', text: 'text-muted-foreground/50', glow: '' };
  if (score >= 3.2) return { bg: 'bg-emerald-500/25', text: 'text-emerald-400', glow: 'shadow-[inset_0_0_20px_rgba(16,185,129,0.15)]' };
  if (score >= 2.5) return { bg: 'bg-emerald-500/15', text: 'text-emerald-400/80', glow: '' };
  if (score >= 1.8) return { bg: 'bg-amber-500/15', text: 'text-amber-400', glow: '' };
  return { bg: 'bg-muted/40', text: 'text-muted-foreground', glow: '' };
}

function getGradeLabel(score: number) {
  if (score >= 3.5) return 'A';
  if (score >= 2.5) return 'B';
  if (score >= 1.5) return 'C';
  return 'D';
}

function HeatmapCell({ cell, asset, tf }: { cell: ConcentrationCell | undefined; asset: string; tf: string }) {
  const navigate = useNavigate();
  const count = cell?.pattern_count ?? 0;
  const score = cell?.avg_grade_score ?? 0;
  const style = getCellStyle(score, count);

  const handleClick = () => {
    if (count === 0) return;
    trackEvent('heatmap.cell_click', { asset, timeframe: tf });
    navigate(`/patterns/live?asset=${asset}&timeframe=${tf}`);
  };

  return (
    <button
      onClick={handleClick}
      disabled={count === 0}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-lg border border-border/30 transition-all duration-200 min-h-[64px] md:min-h-[76px]',
        style.bg, style.glow,
        count > 0 && 'hover:scale-[1.04] hover:border-primary/40 cursor-pointer',
        count === 0 && 'cursor-default opacity-60'
      )}
    >
      <span className={cn('text-xl md:text-2xl font-bold tabular-nums', style.text)}>
        {count}
      </span>
      {count > 0 && (
        <span className={cn('text-[10px] font-medium tracking-wide uppercase mt-0.5', style.text)}>
          Grade {getGradeLabel(score)}
        </span>
      )}
      {(cell?.grade_a ?? 0) > 0 && (
        <div className="absolute top-1 right-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      )}
    </button>
  );
}

export function PatternConcentrationHeatmap() {
  const { data, isLoading } = usePatternConcentration();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Build lookup map
  const cellMap = new Map<string, ConcentrationCell>();
  data?.forEach(c => cellMap.set(`${c.asset_type}:${c.timeframe}`, c));

  const totalPatterns = data?.reduce((sum, c) => sum + c.pattern_count, 0) ?? 0;
  const highQuality = data?.reduce((sum, c) => sum + c.grade_a + c.grade_b, 0) ?? 0;

  return (
    <section className="py-16 md:py-20 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <Badge variant="secondary" className="text-xs tracking-wide">
                {t('heatmap.badge', 'Live Pattern Radar')}
              </Badge>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
              {t('heatmap.title', 'Where are the setups right now?')}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm md:text-base max-w-lg">
              {t('heatmap.subtitle', 'Pattern concentration across markets and timeframes — updated every scan cycle. Click any cell to explore.')}
            </p>
          </div>

          {totalPatterns > 0 && (
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground tabular-nums">{totalPatterns}</div>
                <div className="text-muted-foreground text-xs">{t('heatmap.activeSetups', 'Active')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400 tabular-nums">{highQuality}</div>
                <div className="text-muted-foreground text-xs">{t('heatmap.gradeAB', 'Grade A-B')}</div>
              </div>
            </div>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 30 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="min-w-[520px]">
              {/* Column headers */}
              <div className="grid grid-cols-[100px_repeat(4,1fr)] gap-2 mb-2">
                <div /> {/* empty corner */}
                {TIMEFRAME_COLS.map(tf => (
                  <div key={tf} className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">
                    {TF_LABELS[tf]}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {ASSET_ROWS.map(asset => (
                <div key={asset} className="grid grid-cols-[100px_repeat(4,1fr)] gap-2 mb-2">
                  <div className="flex items-center text-sm font-medium text-foreground/80 pr-2">
                    {ASSET_LABELS[asset]}
                  </div>
                  {TIMEFRAME_COLS.map(tf => (
                    <HeatmapCell
                      key={`${asset}-${tf}`}
                      cell={cellMap.get(`${asset}:${tf}`)}
                      asset={asset}
                      tf={tf}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between mt-6 gap-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500/25 border border-emerald-500/30" />
              {t('heatmap.highConcentration', 'High quality')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/15 border border-amber-500/20" />
              {t('heatmap.medConcentration', 'Mixed')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-muted/40 border border-border/40" />
              {t('heatmap.lowConcentration', 'Low / empty')}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              trackEvent('heatmap.cta_click', { button: 'explore_all' });
              navigate('/patterns/live');
            }}
            className="text-primary hover:text-primary/80"
          >
            {t('heatmap.exploreAll', 'Explore all live patterns')}
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}
