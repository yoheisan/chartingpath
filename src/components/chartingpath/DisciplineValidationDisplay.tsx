import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Shield, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Clock, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { DisciplineStats } from '@/services/tradeDisciplineService';
import { DisciplineFilters } from './TradeDisciplineFilters';

interface DisciplineValidationDisplayProps {
  stats: DisciplineStats;
  filters: DisciplineFilters;
}

export const DisciplineValidationDisplay: React.FC<DisciplineValidationDisplayProps> = ({
  stats,
  filters
}) => {
  const effectivenessScore = stats.totalSignals > 0 
    ? Math.round((stats.rejectedTrades / stats.totalSignals) * 100)
    : 0;

  const getFilterIcon = (filterName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Trend': <TrendingUp className="w-3 h-3" />,
      'R:R': <Target className="w-3 h-3" />,
      'Volume': <BarChart3 className="w-3 h-3" />,
      'Pattern': <Shield className="w-3 h-3" />,
      'Max positions': <AlertTriangle className="w-3 h-3" />,
      'liquidity': <Clock className="w-3 h-3" />,
      'news': <AlertTriangle className="w-3 h-3" />,
      'Stop': <Target className="w-3 h-3" />,
      'Cooldown': <Clock className="w-3 h-3" />
    };
    return icons[filterName] || <Shield className="w-3 h-3" />;
  };

  const activeFiltersCount = [
    filters.trendAlignmentEnabled,
    filters.minRiskRewardEnabled,
    filters.volumeConfirmationEnabled,
    filters.maxPatternsEnabled,
    filters.maxConcurrentTradesEnabled,
    filters.timeFilterEnabled,
    filters.atrStopValidationEnabled,
    filters.cooldownEnabled
  ].filter(Boolean).length;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Trade Discipline Filter Results
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-sm">
                  These filters screened {stats.totalSignals} potential trade signals 
                  and rejected {stats.rejectedTrades} that didn't meet discipline criteria.
                  This helps avoid low-quality trades and enforces professional standards.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 rounded-lg bg-background">
            <div className="text-lg font-bold">{stats.totalSignals}</div>
            <div className="text-xs text-muted-foreground">Total Signals</div>
          </div>
          <div className="p-2 rounded-lg bg-green-500/10">
            <div className="text-lg font-bold text-green-600 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              {stats.allowedTrades}
            </div>
            <div className="text-xs text-muted-foreground">Trades Taken</div>
          </div>
          <div className="p-2 rounded-lg bg-red-500/10">
            <div className="text-lg font-bold text-red-600 flex items-center justify-center gap-1">
              <XCircle className="w-4 h-4" />
              {stats.rejectedTrades}
            </div>
            <div className="text-xs text-muted-foreground">Filtered Out</div>
          </div>
        </div>

        {/* Filter Effectiveness */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Filter Effectiveness</span>
            <span className="font-medium">{effectivenessScore}% of signals filtered</span>
          </div>
          <Progress value={effectivenessScore} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {effectivenessScore > 50 
              ? "Filters are working hard to protect you from low-quality setups."
              : effectivenessScore > 20
                ? "Moderate filtering - most signals passed discipline checks."
                : "Minimal filtering - your signals are mostly high-quality."}
          </p>
        </div>

        {/* Rejection Breakdown */}
        {Object.keys(stats.rejectionsByFilter).length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Rejections by Filter</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.rejectionsByFilter)
                .sort((a, b) => b[1] - a[1])
                .map(([filter, count]) => (
                  <Badge 
                    key={filter} 
                    variant="outline" 
                    className="gap-1 text-xs bg-red-500/5 border-red-500/20"
                  >
                    {getFilterIcon(filter)}
                    {filter}: {count}
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {/* Active Filters */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{activeFiltersCount}/8 Filters Active</span>
            <Badge variant="outline" className="text-xs">
              Bloomberg-Grade Protection
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
