import { useTranslation } from 'react-i18next';
import { ShieldOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSuspendedCells } from '@/hooks/usePatternEdge';

/**
 * Shows the combinations the kill switch has switched off. This is a trust feature:
 * suspensions are automatic (forward n>=50 and negative forward expectancy) and
 * reinstatement is manual, so this list is a public record of where the backtest
 * did not survive contact with forward data.
 */
export function SuspendedCellsPanel() {
  const { t } = useTranslation();
  const { cells, loading } = useSuspendedCells();

  if (loading || cells.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldOff className="h-4 w-4 text-muted-foreground" />
          {t('killSwitch.title', 'Suspended combinations')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('killSwitch.subtitle', {
            defaultValue:
              'We stopped alerting on {{n}} combinations because forward results contradicted the backtest. Suspension is automatic; putting one back is a deliberate manual decision.',
            n: cells.length,
          })}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {cells.map((c) => (
          <div
            key={`${c.patternId}|${c.timeframe}|${c.assetType}|${c.direction}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{c.patternId}</span>
              <Badge variant="outline" className="text-[11px]">{c.timeframe}</Badge>
              <Badge variant="outline" className="text-[11px]">{c.assetType}</Badge>
              <Badge variant="outline" className="text-[11px]">{c.direction}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {t('killSwitch.forwardStats', {
                defaultValue: 'forward n={{n}}, {{exp}}R',
                n: c.forwardN,
                exp: c.forwardExpectancyR === null ? '—' : c.forwardExpectancyR.toFixed(2),
              })}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
