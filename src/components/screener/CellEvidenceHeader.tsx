import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { ASSET_TYPE_LABELS, type AssetType } from '@/types/screener';
import {
  expectancyBand,
  EXPECTANCY_BAND_CLASS,
  EXPECTANCY_BAND_LABEL,
} from '@/config/economicSignificance';

/**
 * Cell-level evidence header.
 *
 * Win rate, sample size, expectancy and edge-vs-chance are measured on the
 * CELL — pattern / timeframe / asset class / direction — across every
 * instrument in that cell. They are NOT instrument-specific. Repeating them on
 * each instrument row reads as "APTV has a 6.80 point edge", which is a claim
 * we cannot make: per-instrument slicing would create ~48,000 cells with tiny
 * samples and guaranteed spurious winners.
 *
 * So the numbers live here, once, at group level — and nowhere else.
 */
export interface CellEvidence {
  patternLabel: string;
  timeframe?: string | null;
  assetType?: AssetType | string | null;
  direction?: string | null;
  /** 0-100 */
  winRate?: number | null;
  sampleSize?: number | null;
  /** Net of costs where available. */
  expectancyR?: number | null;
  /** Net of costs. Preferred for banding when present. */
  expectancyRNet?: number | null;
  edgePoints?: number | null;
  isPrior?: boolean;
  instrumentCount: number;
}

export function CellEvidenceHeader({ evidence }: { evidence: CellEvidence }) {
  const { t } = useTranslation();
  const {
    patternLabel, timeframe, assetType, direction,
    winRate, sampleSize, expectancyR, expectancyRNet, edgePoints, isPrior, instrumentCount,
  } = evidence;

  const assetLabel = assetType
    ? (ASSET_TYPE_LABELS as Record<string, string>)[assetType as string] ?? String(assetType)
    : null;

  const parts = [
    patternLabel,
    timeframe ? String(timeframe).toLowerCase() : null,
    assetLabel,
    direction ? (direction === 'long' ? t('screener.long', 'Long') : t('screener.short', 'Short')) : null,
  ].filter(Boolean);

  const hasStats = !isPrior && (sampleSize ?? 0) > 0 && (winRate != null || expectancyR != null || edgePoints != null);
  // Band on the economics, not on the statistical edge.
  const band = isPrior ? null : expectancyBand(expectancyRNet ?? expectancyR);

  return (
    <div className="py-1">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-semibold text-sm text-foreground">{parts.join(' · ')}</span>
        <Badge variant="secondary" className="text-xs">{instrumentCount}</Badge>

        {band && (
          <Badge variant="outline" className={`text-xs ${EXPECTANCY_BAND_CLASS[band]}`}>
            {t(`cellEvidence.band.${band}`, EXPECTANCY_BAND_LABEL[band])}
          </Badge>
        )}

        {hasStats ? (
          <span className="text-xs text-muted-foreground font-mono">
            {edgePoints != null && (
              <>
                {t('cellEvidence.edge', 'edge {{pts}} pts vs chance', { pts: Number(edgePoints).toFixed(2) })}
                {' · '}
              </>
            )}
            {winRate != null && <>{t('cellEvidence.winRate', 'win rate {{wr}}%', { wr: Number(winRate).toFixed(0) })}{' · '}</>}
            {sampleSize != null && <>n={Number(sampleSize).toLocaleString()}</>}
            {expectancyR != null && (
              <>
                {' · '}
                {t('cellEvidence.expectancy', 'net expectancy {{r}}R after costs', {
                  r: (Number(expectancyR) >= 0 ? '+' : '') + Number(expectancyR).toFixed(2),
                })}
              </>
            )}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {t('cellEvidence.noStats', 'No measured outcome sample for this combination.')}
          </span>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground/80 mt-0.5">
        {t('cellEvidence.attribution', 'These figures describe the pattern/timeframe/asset combination, not the individual instrument.')}
      </p>
    </div>
  );
}

export default CellEvidenceHeader;
