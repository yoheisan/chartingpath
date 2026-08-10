import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageMeta } from '@/components/PageMeta';
import { useOutcomeLookup } from '@/hooks/useOutcomeLookup';
import { MIN_SAMPLE_SIZE, OUTCOME_STATS } from '@/config/outcomeStats';

const ASSET_CLASSES = ['stocks', 'fx', 'crypto', 'etfs', 'indices', 'commodities'];
const TIMEFRAMES = ['15m', '1h', '4h', '8h', '1d', '1wk'];

const nf = (n: number, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : '—');

export default function Outcomes() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const assetParam = searchParams.get('asset') ?? 'all';
  const tfParam = searchParams.get('timeframe') ?? 'all';
  const asset = ASSET_CLASSES.includes(assetParam) ? assetParam : 'all';
  const timeframe = TIMEFRAMES.includes(tfParam) ? tfParam : 'all';

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const { data, isLoading, isError, refetch } = useOutcomeLookup({
    assetType: asset === 'all' ? undefined : asset,
    timeframe: timeframe === 'all' ? undefined : timeframe,
  });

  const rows = useMemo(() => data ?? [], [data]);

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={t('outcomes.metaTitle', 'Pattern Outcomes — Live Win Rates With Sample Sizes')}
        description={t(
          'outcomes.metaDescription',
          'Live chart pattern win rates, average R:R and expectancy, computed from resolved historical occurrences and always shown with sample size. No account required.'
        )}
        canonicalPath="/outcomes"
      />

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-14 max-w-6xl">
        {/* 1. Header */}
        <Badge variant="secondary" className="mb-4">
          {t('outcomes.noAccountBadge', 'No account required')}
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          {t('outcomes.title', 'The pattern fired. Then what?')}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-10">
          {t(
            'outcomes.subhead',
            'Every figure below is computed live from resolved pattern occurrences and shown with the sample size it rests on. Nothing here is a textbook statistic.'
          )}
        </p>

        {/* 2. Aggregate baseline callout */}
        <Card className="mb-10 border-border/60">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 mt-1 shrink-0 text-muted-foreground" />
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">
                  {t('outcomes.baselineTitle', 'Start with the number most vendors hide')}
                </h2>
                <p className="text-muted-foreground">
                  {t('outcomes.baselineBody', {
                    defaultValue:
                      'Across all {{resolved}} resolved occurrences, these patterns return {{expectancy}}R per trade, with a win rate of {{winRate}}% and an average R:R of {{rr}}. Most patterns, most of the time, do not work.',
                    resolved: OUTCOME_STATS.resolvedOutcomes.toLocaleString('en-US'),
                    expectancy: OUTCOME_STATS.aggregateExpectancyR,
                    winRate: (OUTCOME_STATS.aggregateWinRate * 100).toFixed(1),
                    rr: OUTCOME_STATS.aggregateAvgRR,
                  })}
                </p>
                <p className="text-muted-foreground">
                  {t(
                    'outcomes.baselinePurpose',
                    'The point of the table below is to find the narrow conditions where that is not true — and to show you how thin the evidence for each one is.'
                  )}
                </p>
                <Link
                  to="/methodology"
                  className="inline-flex items-center text-sm font-medium underline underline-offset-4 hover:text-foreground"
                >
                  {t('outcomes.baselineLink', 'How these numbers are produced')}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="w-full sm:w-56">
            <label className="text-sm text-muted-foreground mb-1.5 block">
              {t('outcomes.assetClass', 'Asset class')}
            </label>
            <Select value={asset} onValueChange={(v) => setParam('asset', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('outcomes.allAssets', 'All asset classes')}</SelectItem>
                {ASSET_CLASSES.map((a) => (
                  <SelectItem key={a} value={a}>
                    {t(`outcomes.asset.${a}`, a)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-56">
            <label className="text-sm text-muted-foreground mb-1.5 block">
              {t('outcomes.timeframe', 'Timeframe')}
            </label>
            <Select value={timeframe} onValueChange={(v) => setParam('timeframe', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('outcomes.allTimeframes', 'All timeframes')}</SelectItem>
                {TIMEFRAMES.map((tf) => (
                  <SelectItem key={tf} value={tf}>
                    {tf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 4. Results */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="p-10 text-center space-y-4">
                <p className="text-muted-foreground">
                  {t('outcomes.error', "We couldn't load the outcome data just now.")}
                </p>
                <Button variant="outline" onClick={() => refetch()}>
                  {t('outcomes.retry', 'Try again')}
                </Button>
              </div>
            ) : rows.length === 0 ? (
              /* 5. Empty state */
              <div className="p-10 text-center max-w-xl mx-auto space-y-3">
                <p className="font-medium">
                  {t('outcomes.emptyTitle', {
                    defaultValue:
                      'No combination in this filter reaches {{min}} resolved occurrences.',
                    min: MIN_SAMPLE_SIZE,
                  })}
                </p>
                <p className="text-muted-foreground text-sm">
                  {t(
                    'outcomes.emptyBody',
                    "We'd rather show you nothing than a win rate we can't stand behind."
                  )}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">{t('outcomes.colPattern', 'Pattern')}</th>
                      <th className="px-4 py-3 font-medium">{t('outcomes.colTimeframe', 'Timeframe')}</th>
                      <th className="px-4 py-3 font-medium">{t('outcomes.colAsset', 'Asset')}</th>
                      <th className="px-4 py-3 font-medium text-right">{t('outcomes.colSample', 'Sample (n)')}</th>
                      <th className="px-4 py-3 font-medium text-right">{t('outcomes.colWinRate', 'Win rate')}</th>
                      <th className="px-4 py-3 font-medium text-right">{t('outcomes.colRR', 'Avg R:R')}</th>
                      <th className="px-4 py-3 font-medium text-right">{t('outcomes.colExpectancy', 'Expectancy')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr
                        key={`${r.pattern_id}-${r.timeframe}-${r.asset_type}-${r.direction}-${i}`}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="px-4 py-3 font-medium">
                          {r.pattern_name}
                          <span className="text-muted-foreground font-normal"> · {r.direction}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.timeframe}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.asset_type}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{r.total_trades}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{nf(r.win_rate_pct, 1)}%</td>
                        <td className="px-4 py-3 text-right tabular-nums">{nf(r.avg_rr)}</td>
                        <td
                          className={`px-4 py-3 text-right tabular-nums ${
                            r.expectancy_r > 0 ? 'text-emerald-500 font-medium' : ''
                          }`}
                        >
                          {nf(r.expectancy_r, 3)}R
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 7. Disclaimer */}
        <p className="text-xs text-muted-foreground mt-4 max-w-3xl">
          {t('outcomes.disclaimer', {
            defaultValue:
              'Historical figures only. Occurrences that expired without reaching target or stop are excluded from the denominator. Figures are gross of costs and are not forward returns. Cells with fewer than {{min}} resolved occurrences are not shown.',
            min: MIN_SAMPLE_SIZE,
          })}
        </p>

        {/* 6. Single CTA */}
        <div className="mt-14 flex justify-center">
          <Button asChild size="lg">
            <Link to="/auth?mode=signup">
              {t('outcomes.cta', 'Alert me when one of these fires')}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}