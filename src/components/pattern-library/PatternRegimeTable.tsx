import { useRegimeContext, usePatternRegimeStats } from '@/hooks/useRegimeContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';

interface Props {
  patternKey: string;
}

const REGIME_LABELS: Record<string, { label: string; color: string }> = {
  risk_on: { label: 'Risk-On', color: 'text-bullish' },
  risk_off: { label: 'Risk-Off', color: 'text-bearish' },
  neutral: { label: 'Neutral', color: 'text-muted-foreground' },
  trending: { label: 'Trending', color: 'text-primary' },
  ranging: { label: 'Ranging', color: 'text-yellow-500' },
};

export function PatternRegimeTable({ patternKey }: Props) {
  const { data: stats, isLoading } = usePatternRegimeStats(patternKey);
  const { data: currentRegime } = useRegimeContext();

  if (isLoading || !stats || stats.length === 0) return null;

  const totalSamples = stats.reduce((a, b) => a + (b.sample_size || 0), 0);

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm">Win Rate by Market Regime</h4>
        <span className="text-xs text-muted-foreground">
          — based on {totalSamples.toLocaleString()} outcomes
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-xs text-muted-foreground">
              <th className="text-left py-2 pr-4">Regime</th>
              <th className="text-right py-2 px-3">Win Rate</th>
              <th className="text-right py-2 px-3">Sample</th>
              <th className="text-right py-2 pl-3">Avg R</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((row) => {
              const isCurrent = currentRegime?.market_regime === row.regime;
              const rl = REGIME_LABELS[row.regime] ?? {
                label: row.regime,
                color: 'text-foreground',
              };
              const wrColor =
                row.win_rate >= 60
                  ? 'text-bullish'
                  : row.win_rate >= 50
                  ? 'text-foreground'
                  : 'text-bearish';
              return (
                <tr
                  key={row.regime}
                  className={`border-b border-border/30 last:border-0 ${
                    isCurrent ? 'bg-primary/5' : ''
                  }`}
                >
                  <td className="py-2 pr-4">
                    <span className={`font-medium ${rl.color}`}>{rl.label}</span>
                    {isCurrent && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-[10px] py-0 px-1.5 border-primary/40 text-primary"
                      >
                        Now
                      </Badge>
                    )}
                  </td>
                  <td className={`py-2 px-3 text-right font-semibold ${wrColor}`}>
                    {row.win_rate}%
                  </td>
                  <td className="py-2 px-3 text-right text-muted-foreground">
                    {row.sample_size.toLocaleString()}
                  </td>
                  <td className="py-2 pl-3 text-right text-foreground">
                    {row.avg_r}R
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}