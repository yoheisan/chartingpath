import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';
import { useForwardRecord } from '@/hooks/useForwardRecord';

interface Props {
  userId?: string;
}

export function ForwardRecordPanel({ userId }: Props) {
  const { t } = useTranslation();
  const { record, loading, minResolved } = useForwardRecord(userId);

  if (!userId) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          {t('forwardRecord.title', 'Forward record')}
        </CardTitle>
        <CardDescription>
          {t('forwardRecord.subtitle', 'Every edge-filtered signal we issued, logged automatically as a paper trade.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label={t('forwardRecord.issued', 'Signals issued')} value={String(record?.issued ?? 0)} />
              <Stat label={t('forwardRecord.resolved', 'Resolved')} value={String(record?.resolved ?? 0)} />
              <Stat
                label={t('forwardRecord.forwardWinRate', 'Forward win rate')}
                value={record?.sufficientSample && record.forwardWinRate !== null
                  ? `${record.forwardWinRate.toFixed(1)}%`
                  : '—'}
              />
              <Stat
                label={t('forwardRecord.forwardExpectancy', 'Forward expectancy')}
                value={record?.sufficientSample && record.forwardExpectancy !== null
                  ? `${record.forwardExpectancy.toFixed(2)}R`
                  : '—'}
              />
            </div>

            {!record?.sufficientSample && (
              <p className="text-xs text-muted-foreground">
                {t('forwardRecord.insufficient', 'Insufficient sample — record still building ({{resolved}} of {{min}} resolved).', {
                  resolved: record?.resolved ?? 0,
                  min: minResolved,
                })}
              </p>
            )}

            <div className="rounded-md border border-border/50 bg-muted/20 p-3 text-xs">
              <div className="font-medium text-foreground">
                {t('forwardRecord.backtested', 'Backtested, same cells')}
              </div>
              <div className="mt-1 text-muted-foreground">
                {record && record.backtestSample > 0
                  ? t('forwardRecord.backtestedValues', 'Win rate {{wr}}% · expectancy {{exp}}R · n={{n}}', {
                      wr: record.backtestWinRate!.toFixed(1),
                      exp: record.backtestExpectancy!.toFixed(2),
                      n: record.backtestSample.toLocaleString(),
                    })
                  : t('forwardRecord.noBacktest', 'No backtested figures for these cells yet.')}
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {t('forwardRecord.disclaimer', 'Historical outcomes are not forward returns. Figures are gross of costs. This is not financial advice.')}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-semibold tabular-nums text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}