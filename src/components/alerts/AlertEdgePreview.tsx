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
 * BEFORE the alert is saved. Nothing is blocked: combinations without a measured
 * edge save as watch-only and still notify, labelled as detections not signals.
 * Cost is computed from the user's own broker profile.
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
                {t('alertEdge.netStatsBroker', '{{net}}R after your broker costs (−{{cost}}R)', {
                  net: e.expectancyRNet.toFixed(2),
                  cost: e.estCostR.toFixed(2),
                })}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t('alertEdge.noEdgeWatchOnly', "This combination has no measured edge after your broker's costs (n={{n}}, {{exp}}R gross, {{net}}R net). You can still create it: it will notify you, labelled watch-only rather than presented as a signal.", {
                n: e.totalTrades.toLocaleString(),
                exp: e.expectancyR.toFixed(2),
                net: e.expectancyRNet.toFixed(2),
              })}
            </p>
          )}
        </div>
      ))}

      <p className="border-t pt-2 text-[11px] leading-relaxed text-muted-foreground">
        {t('alertEdge.disclaimerBroker', "Historical outcomes are not forward returns. Cost is computed from this trade's stop distance using your selected broker profile — a researched approximation, not your broker's live spread and commission. Change it in Account → Preferences. This is not financial advice.")}
      </p>
    </div>
  );
}