import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Portfolio-level factor exposure.
 *
 * A "cluster" is direction + asset class + country. We deliberately do NOT
 * compute pairwise return correlation: there is no price-history table
 * available, and raw correlation is unreliable for risk anyway — it converges
 * to 1 in exactly the stress scenarios that matter. Cluster grouping is the
 * honest approximation of shared factor exposure.
 *
 * TODO: sector-level clustering is blocked on backfilling instruments.sector
 * (NULL for all rows today). Do not add sector logic until it is populated.
 */
export interface ExposureBucket {
  exposure_bucket: string;
  direction: string;
  asset_type: string;
  country: string;
  positions: number;
  pct: number;
}

export interface UserExposure {
  total_open_positions: number;
  total_position_size_pct: number;
  net_long_pct: number;
  net_short_pct: number;
  buckets: ExposureBucket[];
}

export function useExposure(userId?: string) {
  const [exposure, setExposure] = useState<UserExposure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('v_user_exposure' as any)
        .select('*')
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error('[useExposure] query failed', error);
        setExposure(null);
      } else if (data) {
        const row = data as any;
        setExposure({
          total_open_positions: Number(row.total_open_positions ?? 0),
          total_position_size_pct: Number(row.total_position_size_pct ?? 0),
          net_long_pct: Number(row.net_long_pct ?? 0),
          net_short_pct: Number(row.net_short_pct ?? 0),
          buckets: (row.buckets ?? []).map((b: any) => ({
            exposure_bucket: b.exposure_bucket,
            direction: b.direction,
            asset_type: b.asset_type,
            country: b.country,
            positions: Number(b.positions ?? 0),
            pct: Number(b.pct ?? 0),
          })),
        });
      } else {
        setExposure(null);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  return { exposure, loading };
}

export interface ClusterExposure {
  cluster_key: string;
  existing_positions_in_cluster: number;
  existing_pct_in_cluster: number;
  correlated_after_add: number;
}

/** Cluster lookup for a proposed trade the user could act on. */
export function useExposureCluster(params: {
  userId?: string;
  symbol?: string;
  direction?: string;
  assetType?: string | null;
  newPositionPct?: number;
}) {
  const { userId, symbol, direction, assetType, newPositionPct = 1 } = params;
  const [cluster, setCluster] = useState<ClusterExposure | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCluster = useCallback(async () => {
    if (!userId || !symbol || !direction) return;
    setLoading(true);
    const { data, error } = await supabase.rpc('get_exposure_cluster' as any, {
      p_user_id: userId,
      p_symbol: symbol,
      p_direction: direction,
      p_asset_type: assetType ?? null,
      p_new_position_pct: newPositionPct,
    });
    if (error) {
      console.error('[useExposureCluster] rpc failed', error);
      setCluster(null);
    } else {
      const row = Array.isArray(data) ? (data[0] as any) : (data as any);
      setCluster(
        row
          ? {
              cluster_key: row.cluster_key,
              existing_positions_in_cluster: Number(row.existing_positions_in_cluster ?? 0),
              existing_pct_in_cluster: Number(row.existing_pct_in_cluster ?? 0),
              correlated_after_add: Number(row.correlated_after_add ?? 0),
            }
          : null
      );
    }
    setLoading(false);
  }, [userId, symbol, direction, assetType, newPositionPct]);

  useEffect(() => { fetchCluster(); }, [fetchCluster]);

  return { cluster, loading };
}

/** Plain-language label for a cluster key: professionals think in factor exposure. */
export function clusterLabel(direction: string, assetType: string, country: string): string {
  const dir = direction === 'short' ? 'short' : 'long';
  const place = !country || country === 'unknown' ? '' : `${country} `;
  const asset =
    assetType === 'stocks' || assetType === 'stock' || assetType === 'equity'
      ? 'equities'
      : assetType === 'forex' || assetType === 'fx'
        ? 'FX'
        : assetType === 'crypto'
          ? 'crypto'
          : assetType === 'commodities' || assetType === 'commodity'
            ? 'commodities'
            : assetType || 'assets';
  return `${dir} ${place}${asset}`.trim();
}