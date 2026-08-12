import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Layers } from 'lucide-react';
import { useExposureCluster } from '@/hooks/useExposure';
import { trackEvent } from '@/lib/analytics';

interface Props {
  userId?: string;
  symbol?: string;
  direction?: string;
  assetType?: string | null;
  /** Size of the position the user is about to add, in % of account. */
  newPositionPct?: number;
  maxCorrelatedPct?: number;
}

/**
 * Inline factor-exposure notice shown wherever the user could act on a signal.
 * Informs, never blocks — the user decides.
 */
export function ClusterExposureNotice({
  userId,
  symbol,
  direction,
  assetType,
  newPositionPct = 1,
  maxCorrelatedPct = 4.0,
}: Props) {
  const { t } = useTranslation();
  const { cluster, loading } = useExposureCluster({ userId, symbol, direction, assetType, newPositionPct });

  const over = !!cluster && cluster.correlated_after_add > maxCorrelatedPct;

  useEffect(() => {
    if (cluster && cluster.existing_positions_in_cluster > 0) {
      trackEvent('exposure.cluster_warning_shown', {
        cluster_key: cluster.cluster_key,
        existing_pct: cluster.existing_pct_in_cluster,
        after_add: cluster.correlated_after_add,
      });
    }
  }, [cluster]);

  if (!userId || loading || !cluster || cluster.existing_positions_in_cluster === 0) return null;

  return (
    <div
      className={`flex items-start gap-2 rounded-md border p-3 text-xs ${
        over ? 'border-destructive/50 bg-destructive/10 text-destructive' : 'border-border/50 bg-muted/20 text-muted-foreground'
      }`}
    >
      {over ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <Layers className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
      <div className="space-y-1">
        <p>
          {t('exposure.inlineNotice', 'You already hold {{count}} positions in this cluster ({{existing}}% of account). Adding this takes correlated exposure to {{after}}%.', {
            count: cluster.existing_positions_in_cluster,
            existing: cluster.existing_pct_in_cluster.toFixed(1),
            after: cluster.correlated_after_add.toFixed(1),
          })}
        </p>
        {over && (
          <p className="font-medium">
            {t('exposure.inlineOverCap', 'That is above your {{cap}}% correlated-exposure cap. This is one bet, not several — we are telling you, not stopping you.', {
              cap: maxCorrelatedPct.toFixed(1),
            })}
          </p>
        )}
      </div>
    </div>
  );
}

/** Call when a user proceeds despite an over-cap correlated-exposure warning. */
export function trackActedDespiteWarning(clusterKey: string, afterAdd: number) {
  trackEvent('exposure.acted_despite_warning', { cluster_key: clusterKey, after_add: afterAdd });
}