import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, EyeOff, Loader2 } from 'lucide-react';
import type { AlertEdgeStatus } from '@/hooks/useAlertsEdgeStatus';

interface Props {
  status?: AlertEdgeStatus;
  loading?: boolean;
}

/**
 * Explains, per alert row, whether the edge filter will let it fire and why not
 * when it won't. Same behaviour either way — the difference is whether we say so.
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
        <EyeOff className="h-3 w-3" />
        {t('alertEdgeStatus.watchOnly', 'Watch-only — will not fire')}
      </Badge>
      <p className="text-xs text-muted-foreground">{reasonText}</p>
    </div>
  );
}
