import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Layers } from 'lucide-react';
import { useExposure, clusterLabel } from '@/hooks/useExposure';
import { trackEvent } from '@/lib/analytics';

interface Props {
  userId?: string;
  /** Cap on aggregate exposure to any one correlated cluster. */
  maxCorrelatedPct?: number;
}

/**
 * Portfolio-level factor exposure. Clusters are direction + asset class +
 * country — not setup similarity. Ten correlated trades at 1% each is a 10%
 * bet, not ten 1% bets.
 */
export function ExposurePanel({ userId, maxCorrelatedPct = 4.0 }: Props) {
  const { t } = useTranslation();
  const { exposure, loading } = useExposure(userId);

  useEffect(() => {
    if (!loading && userId) trackEvent('exposure.panel_view', {
      positions: exposure?.total_open_positions ?? 0,
      total_pct: exposure?.total_position_size_pct ?? 0,
    });
  }, [loading, userId, exposure?.total_open_positions, exposure?.total_position_size_pct]);

  if (!userId) return null;

  const topClusters = (exposure?.buckets ?? []).slice(0, 4);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4" />
          {t('exposure.title', 'Exposure')}
        </CardTitle>
        <CardDescription>
          {t('exposure.subtitle', 'What you are actually betting on. Positions that share a direction, asset class and country move together — they are one bet, not several.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : !exposure || exposure.total_open_positions === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('exposure.empty', 'No open positions — no correlated exposure to report.')}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label={t('exposure.openPositions', 'Open positions')} value={String(exposure.total_open_positions)} />
              <Stat label={t('exposure.totalRisk', 'Total open risk')} value={`${exposure.total_position_size_pct.toFixed(1)}%`} />
              <Stat label={t('exposure.netLong', 'Net long')} value={`${(exposure.net_long_pct ?? 0).toFixed(1)}%`} />
              <Stat label={t('exposure.netShort', 'Net short')} value={`${(exposure.net_short_pct ?? 0).toFixed(1)}%`} />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('exposure.topClusters', 'Largest correlated bets')}
              </div>
              {topClusters.map((b) => {
                const over = b.pct > maxCorrelatedPct;
                return (
                  <div
                    key={b.exposure_bucket}
                    className={`rounded-md border p-3 text-sm ${over ? 'border-destructive/50 bg-destructive/10' : 'border-border/50 bg-muted/20'}`}
                  >
                    <span className={over ? 'font-medium text-destructive' : 'text-foreground'}>
                      {t('exposure.clusterLine', '{{positions}} positions {{label}} — {{pct}}% of account in one correlated bet.', {
                        positions: b.positions,
                        label: clusterLabel(b.direction, b.asset_type, b.country),
                        pct: b.pct.toFixed(1),
                      })}
                    </span>
                    {over && (
                      <p className="mt-1 text-xs text-destructive">
                        {t('exposure.overCap', 'Above your {{cap}}% correlated-exposure cap.', { cap: maxCorrelatedPct.toFixed(1) })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground">
              {t('exposure.footnote', 'Clusters group positions by direction, asset class and country. We do not estimate pairwise correlation — it collapses toward 1 in the stress scenarios that matter.')}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/50 bg-muted/20 p-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}