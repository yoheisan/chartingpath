import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { ArrowUpDown } from 'lucide-react';

interface TradeForExcursion {
  entryDate: string;
  rMultiple: number;
  isWin: boolean;
  patternId?: string;
  patternName?: string;
}

interface TradeExcursionChartProps {
  trades: TradeForExcursion[];
}

/**
 * Trade Excursion chart — shows each trade's R-multiple as a bar,
 * giving an instant visual of win/loss distribution and outliers.
 */
export const TradeExcursionChart = ({ trades }: TradeExcursionChartProps) => {
  const chartData = useMemo(() => {
    return trades.map((t, i) => ({
      index: i + 1,
      rMultiple: Math.round(t.rMultiple * 100) / 100,
      isWin: t.isWin,
      date: new Date(t.entryDate).toLocaleDateString(),
      pattern: t.patternName || t.patternId || '',
    }));
  }, [trades]);

  const stats = useMemo(() => {
    const wins = trades.filter(t => t.isWin);
    const losses = trades.filter(t => !t.isWin);
    const avgWinR = wins.length > 0 ? wins.reduce((s, t) => s + t.rMultiple, 0) / wins.length : 0;
    const avgLossR = losses.length > 0 ? losses.reduce((s, t) => s + t.rMultiple, 0) / losses.length : 0;
    const bestR = trades.length > 0 ? Math.max(...trades.map(t => t.rMultiple)) : 0;
    const worstR = trades.length > 0 ? Math.min(...trades.map(t => t.rMultiple)) : 0;
    return { avgWinR, avgLossR, bestR, worstR };
  }, [trades]);

  if (trades.length === 0) return null;

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5" />
          Trade Excursion (R-Multiple Distribution)
        </CardTitle>
        <CardDescription>
          Each bar = one trade's R-multiple outcome. Green = win, Red = loss.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stats row */}
        <div className="flex flex-wrap gap-4 mb-4 p-3 rounded-lg bg-muted/30 border border-border/50 text-sm">
          <div>
            <span className="text-muted-foreground">Avg Win:</span>{' '}
            <span className="font-semibold text-green-500">+{stats.avgWinR.toFixed(2)}R</span>
          </div>
          <div>
            <span className="text-muted-foreground">Avg Loss:</span>{' '}
            <span className="font-semibold text-red-500">{stats.avgLossR.toFixed(2)}R</span>
          </div>
          <div className="border-l border-border pl-4">
            <span className="text-muted-foreground">Best:</span>{' '}
            <span className="font-semibold">+{stats.bestR.toFixed(2)}R</span>
          </div>
          <div>
            <span className="text-muted-foreground">Worst:</span>{' '}
            <span className="font-semibold">{stats.worstR.toFixed(2)}R</span>
          </div>
        </div>

        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="10%">
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="index"
                tick={{ fontSize: 11 }}
                label={{ value: 'Trade #', position: 'insideBottom', offset: -3, fontSize: 12 }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${v}R`}
              />
              <Tooltip
                formatter={(val: number) => [`${val >= 0 ? '+' : ''}${val.toFixed(2)}R`, 'R-Multiple']}
                labelFormatter={(label) => {
                  const item = chartData[Number(label) - 1];
                  return item ? `Trade #${label} • ${item.date}${item.pattern ? ` • ${item.pattern}` : ''}` : `Trade #${label}`;
                }}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Bar dataKey="rMultiple" radius={[2, 2, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.isWin ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeExcursionChart;
