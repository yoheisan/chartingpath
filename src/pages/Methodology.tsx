import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageMeta } from '@/components/PageMeta';
import { MIN_SAMPLE_SIZE, OUTCOME_STATS } from '@/config/outcomeStats';
import { trackEvent } from '@/lib/analytics';

const n = (v: number) => v.toLocaleString('en-US');

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="space-y-3 scroll-mt-24">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

export default function Methodology() {
  const { t } = useTranslation();

  useEffect(() => {
    trackEvent('methodology.view', {});
  }, []);

  const vars = {
    resolved: n(OUTCOME_STATS.resolvedOutcomes),
    total: n(OUTCOME_STATS.totalOccurrences),
    timeouts: n(OUTCOME_STATS.timeoutOccurrences),
    winRate: (OUTCOME_STATS.aggregateWinRate * 100).toFixed(1),
    rr: OUTCOME_STATS.aggregateAvgRR,
    expectancy: OUTCOME_STATS.aggregateExpectancyR,
    patterns: OUTCOME_STATS.patterns,
    instruments: n(OUTCOME_STATS.activeInstruments),
    timeframes: OUTCOME_STATS.timeframes,
    historyStart: OUTCOME_STATS.historyStart,
    min: MIN_SAMPLE_SIZE,
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={t('methodology.metaTitle', 'Methodology — How ChartingPath Measures Pattern Outcomes')}
        description={t(
          'methodology.metaDescription',
          'How pattern detections are recorded, resolved, excluded and reported — including the aggregate baseline, timeout exclusions, sample-size floor and known limitations.'
        )}
        canonicalPath="/methodology"
      />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-14 max-w-3xl">
        <Badge variant="secondary" className="mb-4">
          {t('methodology.badge', 'Documentation')}
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-10">
          {t('methodology.title', 'Methodology')}
        </h1>

        <div className="space-y-10">
          {/* 1 */}
          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="text-xl font-semibold tracking-tight">
                {t('methodology.baselineTitle', 'The aggregate baseline')}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('methodology.baselineBody', {
                  defaultValue:
                    'Across {{resolved}} resolved occurrences, the win rate is {{winRate}}%, the average reward-to-risk ratio is {{rr}}, and expectancy is {{expectancy}}R per trade.',
                  ...vars,
                })}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {t(
                  'methodology.baselineWhy',
                  'We lead with this figure because a vendor who shows only their winning cuts is selling a selection effect. Any positive result elsewhere on this site should be read against this baseline.'
                )}
              </p>
            </CardContent>
          </Card>

          {/* 2 */}
          <Section title={t('methodology.detectionTitle', 'What counts as a detection')}>
            <p>
              {t(
                'methodology.detectionBody',
                "A detection is recorded when the geometric conditions of a pattern are satisfied on a closed bar. We do not record intrabar detections, because a trader could not have acted on them with certainty at the time."
              )}
            </p>
            <p>
              {t('methodology.detectionCoverage', {
                defaultValue:
                  'Coverage: {{patterns}} patterns, {{instruments}} active instruments, {{timeframes}} timeframes, with history beginning {{historyStart}}.',
                ...vars,
              })}
            </p>
          </Section>

          {/* 3 */}
          <Section title={t('methodology.resolutionTitle', 'How an occurrence resolves')}>
            <p>
              {t(
                'methodology.resolutionBody',
                "Entry, stop and target are fixed at the moment of detection from the pattern's own geometry, and are never adjusted afterwards. The occurrence is then followed forward bar by bar until it hits its target, hits its stop, or times out. No information after the detection bar is used to set those levels, so there is no look-ahead."
              )}
            </p>
          </Section>

          {/* 4 */}
          <Section title={t('methodology.timeoutTitle', 'The timeout exclusion')}>
            <p>
              {t('methodology.timeoutBody', {
                defaultValue:
                  '{{timeouts}} of {{total}} occurrences expired without reaching either target or stop. These are excluded from the denominator of every win rate we publish.',
                ...vars,
              })}
            </p>
            <p>
              {t(
                'methodology.timeoutBias',
                'This exclusion cuts in one direction. A timeout is not a neutral event: it is capital tied up for a flat or arbitrary exit. The resolved-only win rate should therefore be treated as an upper bound on the live experience, not an estimate of it.'
              )}
            </p>
          </Section>

          {/* 5 */}
          <Section title={t('methodology.sampleTitle', 'Sample-size floor')}>
            <p>
              {t('methodology.sampleBody', {
                defaultValue:
                  'Below {{min}} resolved occurrences we report "insufficient sample" instead of a percentage. Every published figure carries the sample size (n) it was computed from.',
                ...vars,
              })}
            </p>
          </Section>

          {/* 6 */}
          <Section title={t('methodology.multipleTitle', 'Multiple comparisons')}>
            <p>
              {t(
                'methodology.multipleBody',
                'Slice any dataset finely enough and it will produce winners by chance alone. This is why the outcomes page does not publish per-instrument win rates: grouping by pattern, timeframe, asset class and direction keeps the number of cells small enough to be meaningful.'
              )}
            </p>
            <p>
              {t(
                'methodology.multipleNotCorrected',
                'Our figures are not corrected for multiple testing. A positive cell is a hypothesis to test forward, not a validated edge.'
              )}
            </p>
          </Section>

          {/* 7 */}
          <Section title={t('methodology.windowTitle', 'Two different windows: the public table vs the alert filter')}>
            <p>
              {t(
                'methodology.windowBody',
                'The outcomes table on this site reports our full measured history. The filter that decides whether we alert you does not: it qualifies a pattern/timeframe/asset/direction combination on occurrences from 1 January 2024 onward only.'
              )}
            </p>
            <p>
              {t(
                'methodology.windowWhy',
                'The dataset is not homogeneous over time. Two timeframes were added in 2024 (15m and 8h), taking the count from four to six, and the share of occurrences that expire without hitting target or stop fell from about 44% in 2021 to about 12% in 2025. Expectancy improves over the same period, but that is a change in how outcomes are measured, not evidence that patterns work better. Pooling the whole history averages several incompatible measurement regimes.'
              )}
            </p>
            <p>
              {t(
                'methodology.windowEffect',
                'The distinction is deliberate: the public table is a descriptive record and should stay complete, while an alert is a decision to risk money and needs the comparable window. Applying it makes the filter stricter — roughly a quarter of previously qualifying combinations no longer qualify, because they qualified on the strength of pre-2024 data measured under different rules. Widening the window backwards would make the filter less reliable, not more.'
              )}
            </p>
            <p>
              {t(
                'methodology.windowSeasonality',
                'We apply no seasonal adjustment. Pooled monthly expectancy looks like it varies, but splitting by year, 2024 and 2025 disagree on sign in five of twelve months. That is a level shift between years, not a calendar effect, and 2.5 years of homogeneous data gives only two or three observations per calendar month.'
              )}
            </p>
          </Section>

          {/* 8 */}
          <Section id="costs" title={t('methodology.costsTitle', 'Costs: why alerts use net expectancy and this table does not')}>
            <p>
              {t(
                'methodology.costsBody',
                'Every figure in the outcomes table is gross of costs. That is appropriate for a descriptive record, but it is not good enough to justify an alert. Costs are roughly fixed per trade, while the edge scales with the size of the move — so the same gross expectancy can be comfortably profitable on a weekly chart and net-negative on a 15-minute one, where the stop is a fraction of the size.'
              )}
            </p>
            <p>
              {t(
                'methodology.costsRule',
                'We therefore subtract an estimated round-trip cost, expressed in R, from the gross expectancy of each combination, and a combination only qualifies for alerting when the result is still positive. Applying this removes roughly a third of the combinations that pass on gross figures, and it hits the short timeframes hardest: on 1h, most of what looked like an edge is cost.'
              )}
            </p>
            <p>
              {t(
                'methodology.costsProvisional',
                'The cost estimates are provisional. They are conservative order-of-magnitude figures per asset class and timeframe, not measured execution data, and not specific to any broker. Your actual spread, commission and slippage will differ, and on crypto and exotic FX they may be materially worse. We publish the assumption rather than hide it: treat every "after estimated costs" figure as indicative until it is replaced with real broker data.'
              )}
            </p>
          </Section>

          {/* 8b */}
          <Section id="geometry" title={t('methodology.geometryTitle', 'Where the stop and target come from')}>
            <p>
              {t(
                'methodology.geometryBody',
                'A pattern only has a measured move if the detector can resolve the pivots that define it — the neckline and head of a head-and-shoulders, the two tops of a double top, the pole of a flag. When it cannot, the seeder falls back to a generic rule: stop at 2x ATR, target at 4x ATR. That produces a risk:reward of exactly 2.0 by construction.'
              )}
            </p>
            <p>
              {t(
                'methodology.geometryShare',
                'Roughly two thirds of resolved occurrences from 2024 onward carry that exact 2.0 ratio. Those rows are not measuring classical pattern behaviour; they are measuring a volatility-scaled exit taken on a day a pattern was flagged. Until now nothing in the stored data distinguished the two cases, so every cross-pattern comparison silently mixed them. Each occurrence now records its geometry source: pattern pivots, ATR fallback, a neckline override, or unknown where we cannot determine it retroactively.'
              )}
            </p>
            <p>
              {t(
                'methodology.geometryFilter',
                'The outcomes table lets you filter on this. Alerts do not offer the choice: the edge filter qualifies combinations on pattern-derived geometry only, because alerting on the fallback cohort would mean describing a volatility rule as a chart pattern.'
              )}
            </p>
          </Section>

          {/* 9 */}
          <Section title={t('methodology.limitationsTitle', 'Other limitations')}>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                {t(
                  'methodology.limitCosts',
                  'All figures are gross. Spread, commission, slippage, financing and tax are not deducted. On short timeframes these costs can exceed the entire measured edge.'
                )}
              </li>
              <li>
                {t(
                  'methodology.limitSurvivorship',
                  'The instrument universe is what we currently track, which introduces survivorship bias: delisted and abandoned instruments are under-represented.'
                )}
              </li>
              <li>
                {t(
                  'methodology.limitHistory',
                  'Intraday history is substantially shorter than daily and weekly history, so intraday cells span fewer market regimes and are less robust.'
                )}
              </li>
              <li>
                {t(
                  'methodology.limitAdvice',
                  'All figures are historical. They are not forward returns and are not financial advice.'
                )}
              </li>
            </ul>
          </Section>

          {/* 10 */}
          <Section title={t('methodology.contactTitle', 'Corrections and data requests')}>
            <p>
              {t(
                'methodology.contactBody',
                'If you believe a figure or a definition on this page is wrong, we want to hear it — corrections are welcome at support@chartingpath.com. Institutions evaluating the dataset can request a fuller specification and sample extract at the same address.'
              )}
            </p>
            <p>
              <Link to="/outcomes" className="underline underline-offset-4 hover:text-foreground">
                {t('methodology.backToOutcomes', 'See the outcome data these rules produce')}
              </Link>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}