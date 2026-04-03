import { useOutcomeStats } from '@/hooks/useOutcomeStats';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Trophy, Layers, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function OutcomeStatsStrip() {
  const { data, isLoading } = useOutcomeStats();
  const { t } = useTranslation();

  const cards = isLoading || !data
    ? Array.from({ length: 4 }, (_, i) => ({ key: i, loading: true as const }))
    : [
        {
          key: 'total',
          loading: false as const,
          icon: BarChart3,
          value: data.total_patterns.toLocaleString(),
          label: t('outcomeStats.totalPatternsTracked', 'Total patterns tracked'),
        },
        {
          key: 'winrate',
          loading: false as const,
          icon: Trophy,
          value: data.top_win_rate
            ? `${data.top_win_rate.win_rate}%`
            : '—',
          label: data.top_win_rate
            ? t('outcomeStats.topWinRateDetail', 'Top win rate this month — {{pattern}} ({{timeframe}})', {
                pattern: data.top_win_rate.pattern_name,
                timeframe: data.top_win_rate.timeframe,
              })
            : t('outcomeStats.topWinRateThisMonth', 'Top win rate this month'),
        },
        {
          key: 'most',
          loading: false as const,
          icon: Layers,
          value: data.most_detected?.pattern_name ?? '—',
          label: data.most_detected
            ? t('outcomeStats.mostDetectedDetail', 'Most detected pattern ({{count}} this week)', {
                count: data.most_detected.count.toLocaleString(),
              })
            : t('outcomeStats.mostDetectedPattern', 'Most detected pattern'),
        },
        {
          key: 'instruments',
          loading: false as const,
          icon: Globe,
          value: data.instruments_covered.toLocaleString(),
          label: t('outcomeStats.instrumentsCovered', 'Instruments covered'),
        },
      ];

  return (
    <section className="py-12 px-4 md:px-6 lg:px-8 border-t border-border/20 bg-card/30">
      <div className="container mx-auto">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-6">
          {t('outcomeStats.sectionLabel', 'Live outcome data — updated daily')}
        </p>

        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
          {cards.map((card) =>
            card.loading ? (
              <div
                key={card.key}
                className="min-w-[200px] snap-start rounded-lg border border-border/40 bg-background/60 p-5 flex flex-col gap-2"
              >
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-36" />
              </div>
            ) : (
              <div
                key={card.key}
                className="min-w-[200px] snap-start rounded-lg border border-border/40 bg-background/60 p-5 flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <card.icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-2xl font-bold text-foreground tabular-nums truncate">
                    {card.value}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground leading-snug">
                  {card.label}
                </span>
              </div>
            )
          )}
        </div>

        <p className="mt-5 text-[11px] text-muted-foreground/70">
          {t('outcomeStats.dataSourceNote', "Data sourced from ChartingPath's live detection engine. All outcomes tracked to SL/TP based on pattern-specific ATR targets.")}
        </p>
      </div>
    </section>
  );
}
