import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageMeta } from '@/components/PageMeta';
import { MIN_SAMPLE_SIZE, OUTCOME_STATS } from '@/config/outcomeStats';

const n = (v: number) => v.toLocaleString('en-US');

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

export default function Methodology() {
  const { t } = useTranslation();

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

          {/* 8 */}
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