/**
 * Regime Heatmap Component
 * 
 * Displays pattern performance across regime conditions.
 * Research-grade visualization with reliability indicators.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info } from 'lucide-react';
import {
  TrendRegime,
  VolatilityRegime,
  BucketStats,
  SAMPLE_SIZE_THRESHOLDS,
  describeRegime,
  getSampleSizeTier,
} from '@/types/RegimeAnalytics';

interface RegimeHeatmapProps {
  patternId: string;
  patternName: string;
  buckets: Record<string, BucketStats>;
  metricKey: 'avgRMultiple' | 'winRate' | 'n';
  className?: string;
}

const TRENDS: TrendRegime[] = ['UP', 'FLAT', 'DOWN'];
const VOLATILITIES: VolatilityRegime[] = ['LOW', 'MED', 'HIGH'];

const METRIC_LABELS: Record<string, string> = {
  avgRMultiple: 'Avg R-Multiple',
  winRate: 'Win Rate',
  n: 'Sample Size',
};

const METRIC_FORMATTERS: Record<string, (v: number) => string> = {
  avgRMultiple: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}R`,
  winRate: (v) => `${(v * 100).toFixed(0)}%`,
  n: (v) => v.toString(),
};

export function RegimeHeatmap({
  patternId,
  patternName,
  buckets,
  metricKey,
  className,
}: RegimeHeatmapProps) {
  // Calculate color scale bounds
  const values = Object.values(buckets)
    .filter(b => b.n >= SAMPLE_SIZE_THRESHOLDS.MINIMUM)
    .map(b => b[metricKey] as number);
  
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 0);
  
  const getCell = (trend: TrendRegime, vol: VolatilityRegime) => {
    const key = `${trend}_${vol}`;
    return buckets[key];
  };
  
  const getCellColor = (value: number, n: number): string => {
    if (n < SAMPLE_SIZE_THRESHOLDS.MINIMUM) {
      return 'bg-muted/50';
    }
    
    if (metricKey === 'n') {
      // Sample size: blue scale
      const tier = getSampleSizeTier(n);
      const tierColors = {
        insufficient: 'bg-muted/50',
        low: 'bg-blue-100 dark:bg-blue-900/30',
        moderate: 'bg-blue-200 dark:bg-blue-800/40',
        high: 'bg-blue-300 dark:bg-blue-700/50',
        excellent: 'bg-blue-400 dark:bg-blue-600/60',
      };
      return tierColors[tier];
    }
    
    // R-Multiple or Win Rate: green-red diverging scale
    if (value > 0) {
      const intensity = Math.min(1, value / (maxVal || 1));
      if (intensity > 0.7) return 'bg-emerald-500/70 dark:bg-emerald-600/60';
      if (intensity > 0.4) return 'bg-emerald-400/60 dark:bg-emerald-700/50';
      return 'bg-emerald-300/50 dark:bg-emerald-800/40';
    } else if (value < 0) {
      const intensity = Math.min(1, Math.abs(value) / (Math.abs(minVal) || 1));
      if (intensity > 0.7) return 'bg-red-500/70 dark:bg-red-600/60';
      if (intensity > 0.4) return 'bg-red-400/60 dark:bg-red-700/50';
      return 'bg-red-300/50 dark:bg-red-800/40';
    }
    return 'bg-muted';
  };
  
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">{patternName}</h4>
        <Badge variant="outline" className="text-xs">
          {METRIC_LABELS[metricKey]}
        </Badge>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left font-medium text-muted-foreground">
                Trend / Vol
              </th>
              {VOLATILITIES.map(vol => (
                <th key={vol} className="p-2 text-center font-medium text-muted-foreground">
                  {vol}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TRENDS.map(trend => (
              <tr key={trend}>
                <td className="p-2 font-medium text-muted-foreground border-r border-border">
                  {trend === 'UP' ? '↑ Up' : trend === 'DOWN' ? '↓ Down' : '→ Flat'}
                </td>
                {VOLATILITIES.map(vol => {
                  const cell = getCell(trend, vol);
                  const value = cell?.[metricKey] ?? 0;
                  const n = cell?.n ?? 0;
                  const isReliable = n >= SAMPLE_SIZE_THRESHOLDS.MINIMUM;
                  
                  return (
                    <td key={vol} className="p-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'p-3 text-center cursor-help transition-colors',
                                getCellColor(value as number, n),
                                !isReliable && 'opacity-50'
                              )}
                            >
                              <div className="font-mono font-medium">
                                {isReliable 
                                  ? METRIC_FORMATTERS[metricKey](value as number)
                                  : '—'
                                }
                              </div>
                              <div className="text-sm text-muted-foreground mt-0.5">
                                n={n}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-medium">
                                {describeRegime(trend, vol)}
                              </p>
                              {cell ? (
                                <>
                                  <p className="text-xs">
                                    Sample size: {n} trades
                                  </p>
                                  <p className="text-xs">
                                    Win rate: {(cell.winRate * 100).toFixed(1)}%
                                  </p>
                                  <p className="text-xs">
                                    Avg R: {cell.avgRMultiple >= 0 ? '+' : ''}{cell.avgRMultiple.toFixed(2)}
                                  </p>
                                  {!isReliable && (
                                    <p className="text-xs text-amber-500 flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      Below minimum sample size
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  No trades in this regime
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-emerald-400/60" />
          <span>Positive</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-400/60" />
          <span>Negative</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-muted/50" />
          <span>Insufficient data</span>
        </div>
      </div>
    </div>
  );
}
