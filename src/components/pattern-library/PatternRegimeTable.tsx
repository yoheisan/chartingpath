import { useRegimeContext, usePatternRegimeStats } from '@/hooks/useRegimeContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  patternKey: string;
}

const REGIME_LABELS: Record<string, { key: string; fallback: string; color: string }> = {
  risk_on: { key: 'regime.riskOn', fallback: 'Risk-On', color: 'text-bullish' },
  risk_off: { key: 'regime.riskOff', fallback: 'Risk-Off', color: 'text-bearish' },
  neutral: { key: 'regime.neutral', fallback: 'Neutral', color: 'text-muted-foreground' },
  trending: { key: 'regime.trending', fallback: 'Trending', color: 'text-primary' },
  ranging: { key: 'regime.ranging', fallback: 'Ranging', color: 'text-yellow-500' },
};

export function PatternRegimeTable({ patternKey }: Props) {
  const { t } = useTranslation();
  const { data: stats, isLoading } = usePatternRegimeStats(patternKey);
  const { data: currentRegime } = useRegimeContext();

  if (isLoading || !stats || stats.length === 0) return null;

  const totalSamples = stats.reduce((a, b) => a + (b.sample_size || 0), 0);

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm">{t('regime.title', 'Win Rate by Market Regime')}</h4>
        <span className="text-xs text-muted-foreground">
          {t('regime.basedOn', '— based on {{count}} outcomes', { count: totalSamples })}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-xs text-muted-foreground">
              <th className="text-left py-2 pr-4">{t('regime.colRegime', 'Regime')}</th>
              <th className="text-right py-2 px-3">{t('regime.colWinRate', 'Win Rate')}</th>
              <th className="text-right py-2 px-3">{t('regime.colSample', 'Sample')}</th>
              <th className="text-right py-2 pl-3">{t('regime.colAvgR', 'Avg R')}</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((row) => {
              const isCurrent = currentRegime?.market_regime === row.regime;
              const rl = REGIME_LABELS[row.regime] ?? {
                key: '', fallback: row.regime,
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
                    <span className={`font-medium ${rl.color}`}>{rl.key ? t(rl.key, rl.fallback) : rl.fallback}</span>
                    {isCurrent && (
                      <Badge
                        variant="outline"
                        className="ml-2 text-[10px] py-0 px-1.5 border-primary/40 text-primary"
                      >
                        {t('regime.now', 'Now')}
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