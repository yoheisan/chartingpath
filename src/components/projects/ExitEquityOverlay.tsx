import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { LineChart as LineChartIcon, Eye, EyeOff } from 'lucide-react';

export interface ExitEquityPoint {
  date: string;
  value: number;
  drawdown: number;
}

export interface ExitEquitySeries {
  strategyId: string;
  strategyName: string;
  color: string;
  data: ExitEquityPoint[];
  finalValue: number;
  returnPercent: number;
}

interface ExitEquityOverlayProps {
  series: ExitEquitySeries[];
  initialCapital?: number;
}

const DEFAULT_COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 76%, 36%)',  // green
  'hsl(221, 83%, 53%)',  // blue
  'hsl(45, 93%, 47%)',   // amber
  'hsl(280, 67%, 50%)',  // purple
  'hsl(12, 76%, 61%)',   // orange
  'hsl(173, 80%, 40%)',  // teal
  'hsl(340, 82%, 52%)',  // pink
];

/**
 * Overlay equity curves from multiple exit strategies for comparison
 */
export const ExitEquityOverlay = ({ 
  series, 
  initialCapital = 10000 
}: ExitEquityOverlayProps) => {
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(
    new Set(series.map(s => s.strategyId))
  );

  const toggleSeries = (strategyId: string) => {
    setVisibleSeries(prev => {
      const next = new Set(prev);
      if (next.has(strategyId)) {
        next.delete(strategyId);
      } else {
        next.add(strategyId);
      }
      return next;
    });
  };

  // Merge all series data by date and forward-fill missing values
  const chartData = useMemo(() => {
    // Collect all unique dates across all series
    const allDates = new Set<string>();
    series.forEach(s => {
      s.data.forEach(point => {
        allDates.add(point.date.split('T')[0]);
      });
    });
    
    // Sort dates chronologically
    const sortedDates = Array.from(allDates).sort();
    
    // Build data with forward-fill for missing values
    const result: Array<Record<string, number | string>> = [];
    const lastValues: Record<string, number> = {};
    
    // Initialize with initial capital
    series.forEach(s => {
      lastValues[s.strategyId] = s.data[0]?.value ?? initialCapital;
    });
    
    sortedDates.forEach(dateKey => {
      const entry: Record<string, number | string> = { 
        date: new Date(dateKey).toISOString() 
      };
      
      // For each strategy, use the value if available, otherwise forward-fill
      series.forEach(s => {
        const point = s.data.find(p => p.date.split('T')[0] === dateKey);
        if (point) {
          lastValues[s.strategyId] = point.value;
        }
        entry[s.strategyId] = lastValues[s.strategyId];
      });
      
      result.push(entry);
    });
    
    return result;
  }, [series, initialCapital]);

  // Sort series by final return for legend ordering
  const sortedSeries = useMemo(() => 
    [...series].sort((a, b) => b.returnPercent - a.returnPercent),
  [series]);

  const bestStrategy = sortedSeries[0];
  const worstStrategy = sortedSeries[sortedSeries.length - 1];

  if (series.length === 0) return null;

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <LineChartIcon className="h-5 w-5" />
          Exit Strategy Equity Comparison
        </CardTitle>
        <CardDescription>
          Overlay of equity curves for each exit method
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Strategy toggles */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (visibleSeries.size === 0) {
                setVisibleSeries(new Set(series.map(s => s.strategyId)));
              } else {
                setVisibleSeries(new Set());
              }
            }}
            className="gap-2 text-muted-foreground"
          >
            {visibleSeries.size === 0 ? (
              <>
                <Eye className="h-3 w-3" />
                Show All
              </>
            ) : (
              <>
                <EyeOff className="h-3 w-3" />
                Clear All
              </>
            )}
          </Button>
          {sortedSeries.map((s, idx) => (
            <Button
              key={s.strategyId}
              variant={visibleSeries.has(s.strategyId) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleSeries(s.strategyId)}
              className="gap-2"
              style={visibleSeries.has(s.strategyId) ? { 
                backgroundColor: s.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
                borderColor: s.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
              } : {}}
            >
              {visibleSeries.has(s.strategyId) ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
              {s.strategyName}
              <span className={s.returnPercent >= 0 ? 'text-green-300' : 'text-red-300'}>
                {s.returnPercent >= 0 ? '+' : ''}{s.returnPercent.toFixed(1)}%
              </span>
            </Button>
          ))}
        </div>

        {/* Performance summary */}
        <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Best:</span>{' '}
              <span className="font-semibold text-green-500">
                {bestStrategy.strategyName} ({bestStrategy.returnPercent >= 0 ? '+' : ''}{bestStrategy.returnPercent.toFixed(1)}%)
              </span>
            </div>
            {sortedSeries.length > 1 && (
              <div>
                <span className="text-muted-foreground">Worst:</span>{' '}
                <span className={`font-semibold ${worstStrategy.returnPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {worstStrategy.strategyName} ({worstStrategy.returnPercent >= 0 ? '+' : ''}{worstStrategy.returnPercent.toFixed(1)}%)
                </span>
              </div>
            )}
            <div className="border-l border-border pl-4">
              <span className="text-muted-foreground">Spread:</span>{' '}
              <span className="font-semibold">
                {(bestStrategy.returnPercent - worstStrategy.returnPercent).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Equity Chart */}
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(val) => new Date(val).toLocaleDateString()}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const sorted = [...payload].sort((a, b) => (b.value as number) - (a.value as number));
                  return (
                    <div className="rounded-lg border border-border/60 bg-card/95 backdrop-blur-sm shadow-xl px-4 py-3 min-w-[220px] max-h-[280px] overflow-y-auto">
                      <p className="text-sm font-medium text-muted-foreground mb-2 border-b border-border/40 pb-1.5">
                        {new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <div className="space-y-1.5">
                        {sorted.map((entry) => {
                          const s = series.find(s => s.strategyId === entry.dataKey);
                          const val = entry.value as number;
                          const roi = ((val - initialCapital) / initialCapital) * 100;
                          return (
                            <div key={entry.dataKey as string} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                                <span className="text-sm text-muted-foreground truncate">{s?.strategyName || entry.dataKey}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[12px] font-semibold text-foreground">${val.toFixed(0)}</span>
                                <span className={`text-sm font-medium ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend 
                formatter={(value) => {
                  const strategy = series.find(s => s.strategyId === value);
                  return strategy?.strategyName || value;
                }}
              />
              <ReferenceLine 
                y={initialCapital} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3" 
              />
              
              {sortedSeries.map((s, idx) => (
                visibleSeries.has(s.strategyId) && (
                  <Line
                    key={s.strategyId}
                    type="monotone"
                    dataKey={s.strategyId}
                    name={s.strategyId}
                    stroke={s.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
                    strokeWidth={s.strategyId === bestStrategy.strategyId ? 2.5 : 1.5}
                    dot={false}
                  />
                )
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExitEquityOverlay;
