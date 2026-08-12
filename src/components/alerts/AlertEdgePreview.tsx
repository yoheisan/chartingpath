import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { usePatternEdge } from '@/hooks/usePatternEdge';

interface Props {
  symbol: string;
  timeframe: string;
  patterns: string[];
  labelFor?: (patternId: string) => string;
}

/**
 * Shows the measured edge for each chosen pattern/timeframe/asset combination
 * BEFORE the alert is saved. Combinations without a measured edge are not
 * blocked — they are saved as watch-only and never alerted on.
 */
export function AlertEdgePreview({ symbol, timeframe, patterns, labelFor }: Props) {
  const { t } = useTranslation();
  const { edges, assetType, loading } = usePatternEdge(symbol, timeframe, patterns);

  if (!symbol || !timeframe || patterns.length === 0) return null;

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">
          {t('alertEdge.title', 'Measured edge for this combination')}
        </span>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>

      {!loading && !assetType && (
        <p className="text-xs text-muted-foreground">
          {t('alertEdge.unknownAsset', 'We could not resolve an asset class for this symbol, so we have no measured edge for it.')}
        </p>
      )}

      {edges.map((e) => (
        <div key={e.patternId} className="space-y-1 border-t pt-2 first:border-t-0 first:pt-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{labelFor?.(e.patternId) ?? e.patternId}</span>
            {e.qualifies ? (
              <Badge variant="secondary" className="gap-1 text-[11px]">
                <CheckCircle2 className="h-3 w-3" />
                {t('alertEdge.hasEdge', 'Measured edge')}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-[11px]">
                <AlertTriangle className="h-3 w-3" />
                {t('alertEdge.watchOnly', 'Watch-only')}
              </Badge>
            )}
          </div>

          {e.qualifies ? (
            <>
              <p className="text-xs text-muted-foreground">
                {t('alertEdge.stats', 'Win rate {{wr}}% · expectancy {{exp}}R gross · avg R:R {{rr}} · n={{n}}', {
                  wr: e.winRatePct.toFixed(1),
                  exp: e.expectancyR.toFixed(2),
                  rr: e.avgRr.toFixed(2),
                  n: e.totalTrades.toLocaleString(),
                })}
              </p>
              <p className="text-xs font-medium">
                {t('alertEdge.netStats', '{{net}}R after estimated costs (−{{cost}}R)', {
                  net: e.expectancyRNet.toFixed(2),
                  cost: e.estCostR.toFixed(2),
                })}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t('alertEdge.noEdge', 'This combination has no measured edge (n={{n}}, expectancy {{exp}}R gross, {{net}}R after estimated costs). We won\'t alert on it — you can still save it as a watch-only alert.', {
                n: e.totalTrades.toLocaleString(),
                exp: e.expectancyR.toFixed(2),
                net: e.expectancyRNet.toFixed(2),
              })}
            </p>
          )}
        </div>
      ))}

      <p className="border-t pt-2 text-[11px] leading-relaxed text-muted-foreground">
        {t('alertEdge.disclaimer', 'Historical outcomes are not forward returns. Cost figures are provisional estimates, not your broker\'s actual spread and commission. This is not financial advice.')}
      </p>
    </div>
  );
}