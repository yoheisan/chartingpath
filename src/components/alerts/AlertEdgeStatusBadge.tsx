import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Eye, Loader2 } from 'lucide-react';
import type { AlertEdgeStatus } from '@/hooks/useAlertsEdgeStatus';

interface Props {
  status?: AlertEdgeStatus;
  loading?: boolean;
}

/**
 * Explains, per alert row, whether the combination has a measured edge after the
 * user's broker costs. Both kinds of alert notify; only the framing differs.
 * Silence and noise are both failures — an unexplained label is the third.
 */
export function AlertEdgeStatusBadge({ status, loading }: Props) {
  const { t } = useTranslation();

  if (!status) {
    return loading ? (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        {t('alertEdgeStatus.checking', 'Checking edge…')}
      </span>
    ) : null;
  }

  if (status.qualifies) {
    return (
      <div className="mt-1 space-y-0.5">
        <Badge variant="secondary" className="gap-1 text-[11px]">
          <CheckCircle2 className="h-3 w-3" />
          {t('alertEdgeStatus.qualifying', 'Meets the edge bar')}
        </Badge>
        <p className="text-xs text-muted-foreground">
          {t('alertEdgeStatus.qualifyingDetail', 'n={{n}} · {{net}}R net expectancy after estimated costs', {
            n: status.totalTrades.toLocaleString(),
            net: status.expectancyRNet.toFixed(2),
          })}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {t('alertEdgeStatus.costBasis', 'Based on your selected broker costs.')}
        </p>
      </div>
    );
  }

  const reasonText =
    status.reason === 'insufficient_sample'
      ? t('alertEdgeStatus.reasonSample', 'Not enough measured outcomes yet (n={{n}}).', { n: status.totalTrades.toLocaleString() })
      : status.reason === 'negative_expectancy'
        ? t('alertEdgeStatus.reasonNegative', 'Measured expectancy is negative ({{exp}}R).', { exp: status.expectancyR.toFixed(2) })
        : status.reason === 'negative_after_costs'
          ? t('alertEdgeStatus.reasonCosts', 'Positive gross ({{exp}}R) but negative after estimated costs ({{net}}R).', {
              exp: status.expectancyR.toFixed(2), net: status.expectancyRNet.toFixed(2),
            })
          : t('alertEdgeStatus.reasonUnknownAsset', 'We could not resolve an asset class for this symbol, so there is no measured edge.');

  return (
    <div className="mt-1 space-y-0.5">
      <Badge variant="outline" className="gap-1 text-[11px] text-muted-foreground">
        <Eye className="h-3 w-3" />
        {t('alertEdgeStatus.watchOnlyNotifies', "Watch-only — no measured edge after your broker's costs")}
      </Badge>
      <p className="text-xs text-muted-foreground">{reasonText}</p>
      <p className="text-[11px] text-muted-foreground">
        {t('alertEdgeStatus.watchOnlyStillNotifies', 'It still notifies you, flagged as a detection rather than a signal. Based on your selected broker costs.')}
      </p>
    </div>
  );
}
