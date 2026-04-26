import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Target, Clock, Database, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePatternDetailStats } from "@/hooks/usePatternDetailStats";
import { useRegimeContext, usePatternRegimeStats } from "@/hooks/useRegimeContext";

interface Props {
  patternKey: string;
}

export const PatternPerformanceSnapshot = ({ patternKey }: Props) => {
  const { t } = useTranslation();
  const { data: stats, isLoading } = usePatternDetailStats(patternKey);
  const { data: regime } = useRegimeContext();
  const { data: regimeStats } = usePatternRegimeStats(patternKey);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!stats || stats.totalDetections < 20) return null;

  const currentRegimeStat = regimeStats?.find(
    (r) => r.regime === regime?.market_regime
  );

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        {t('patternLibrary.howPerforms', 'How this pattern performs on ChartingPath')}
      </h3>
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-background/50 border">
            <div className="text-2xl font-bold text-primary">{stats.winRate}%</div>
            <div className="text-xs text-muted-foreground mt-1">{t('patternLibrary.winRate', 'Win rate')}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-background/50 border">
            <div className="text-2xl font-bold text-bullish">{stats.avgRR}R</div>
            <div className="text-xs text-muted-foreground mt-1">{t('patternLibrary.avgRMultiple', 'Avg R-multiple to TP')}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-background/50 border">
            <div className="text-2xl font-bold text-foreground">{stats.avgBars}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('patternLibrary.avgBarsToResolution', 'Avg bars to resolution')}</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-background/50 border">
            <div className="text-2xl font-bold text-foreground">{stats.totalDetections.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('patternLibrary.totalDetections', 'Total detections')}</div>
          </div>
        </div>
        {stats.liveSetupsCount > 0 && (
          <div className="mt-3 pt-3 border-t text-sm">
            <Link
              to={`/patterns/live?pattern=${patternKey}`}
              className="text-primary hover:underline flex items-center gap-1"
            >
              {t('patternLibrary.liveSetupsNow', 'Live setups right now: {{count}}', { count: stats.liveSetupsCount })}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
        {currentRegimeStat && regime && (
          <div
            className={`mt-3 pt-3 border-t text-xs flex items-start gap-2 ${
              currentRegimeStat.win_rate >= stats.winRate
                ? 'text-bullish'
                : 'text-bearish'
            }`}
          >
            {currentRegimeStat.win_rate >= stats.winRate ? (
              <TrendingUp className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            )}
            <span>
              In current {regime.market_regime.replace('_', '-')} regime: win rate is{' '}
              <strong>{currentRegimeStat.win_rate}%</strong>
              {currentRegimeStat.win_rate < stats.winRate
                ? ` (${stats.winRate - currentRegimeStat.win_rate}% below average)`
                : ` (${currentRegimeStat.win_rate - stats.winRate}% above average)`}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
};
