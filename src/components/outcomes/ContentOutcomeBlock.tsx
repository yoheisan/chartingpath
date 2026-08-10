import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { trackEvent } from '@/lib/analytics';
import { MIN_SAMPLE_SIZE } from '@/config/outcomeStats';
import { usePatternOutcomeSummary } from '@/hooks/usePatternOutcomeSummary';
import { PATTERN_NAMES } from '@/config/patternStatsConstants';

interface ContentOutcomeBlockProps {
  /** Pattern id as stored in the outcome data (e.g. 'bull-flag'). Omit when the page has no matching pattern. */
  patternId?: string | null;
  /** Slug of the host page, used for content.cta_click attribution. */
  slug: string;
  /** Where the click came from: 'pattern' | 'instrument' | 'blog' surface. */
  source: string;
}

/**
 * Compact outcome footer for content pages (/patterns/*, /instruments/*, /blog/*).
 * Statistics are only rendered when the pattern clears the n >= 30 floor —
 * never fabricate numbers for a page with no matching data.
 */
export function ContentOutcomeBlock({ patternId, slug, source }: ContentOutcomeBlockProps) {
  const { t } = useTranslation();
  const { data: summary, isLoading } = usePatternOutcomeSummary(patternId);

  const patternName = patternId ? PATTERN_NAMES[patternId] || patternId : null;
  const showStats = !!summary && summary.meetsFloor;
  const showInsufficient = !!patternId && !isLoading && (!summary || !summary.meetsFloor);

  return (
    <section className="my-12 rounded-xl border border-border/50 bg-card/50 p-6">
      <h2 className="text-lg font-semibold text-foreground mb-1">
        {patternName
          ? t('contentOutcome.titleWithPattern', 'What actually happened: {{pattern}}', { pattern: patternName })
          : t('contentOutcome.title', 'What actually happened')}
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        {t('contentOutcome.subtitle', 'Measured outcomes from resolved pattern detections, not textbook estimates.')}
      </p>

      {showStats && summary && (
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t('contentOutcome.winRate', 'Win rate')}</dt>
            <dd className="text-xl font-semibold text-foreground">{summary.winRatePct.toFixed(1)}%</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t('contentOutcome.expectancy', 'Expectancy')}</dt>
            <dd className="text-xl font-semibold text-foreground">{summary.expectancyR.toFixed(2)}R</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t('contentOutcome.avgRr', 'Average R:R')}</dt>
            <dd className="text-xl font-semibold text-foreground">{summary.avgRr.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{t('contentOutcome.sampleSize', 'Sample size')}</dt>
            <dd className="text-xl font-semibold text-foreground">{summary.totalTrades.toLocaleString()}</dd>
          </div>
        </dl>
      )}

      {showInsufficient && (
        <p className="text-sm text-muted-foreground mb-4">
          {t('contentOutcome.insufficient', 'Insufficient sample — fewer than {{min}} resolved outcomes for this pattern, so no figures are shown.', { min: MIN_SAMPLE_SIZE })}
        </p>
      )}

      <Link
        to="/outcomes"
        onClick={() => trackEvent('content.cta_click', { slug, source })}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary underline underline-offset-4 hover:opacity-80"
      >
        {t('contentOutcome.seeAll', 'See all outcome data')}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}