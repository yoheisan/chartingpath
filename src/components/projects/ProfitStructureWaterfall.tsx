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
  Cell,
  ReferenceLine,
} from 'recharts';
import { Layers } from 'lucide-react';

interface TradeForWaterfall {
  rMultiple: number;
  isWin: boolean;
}

interface ProfitStructureWaterfallProps {
  trades: TradeForWaterfall[];
  initialCapital?: number;
  embedded?: boolean;
}

/**
 * Profit Structure Waterfall — Gross Profit vs Gross Loss breakdown
 * showing where edge comes from.
 */
export const ProfitStructureWaterfall = ({ trades, initialCapital = 10000, embedded }: ProfitStructureWaterfallProps) => {
  const data = useMemo(() => {
    const wins = trades.filter(t => t.isWin);
    const losses = trades.filter(t => !t.isWin);

    const grossProfit = wins.reduce((s, t) => s + t.rMultiple, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.rMultiple, 0));
    const netPnL = grossProfit - grossLoss;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    // Waterfall structure: [invisible base, visible bar]
    return {
      bars: [
        {
          name: 'Gross Profit',
          value: grossProfit,
          base: 0,
          fill: 'profit' as const,
          label: `+${grossProfit.toFixed(1)}R`,
        },
        {
          name: 'Gross Loss',
          value: grossLoss,
          base: netPnL, // starts from net, goes up to gross profit
          fill: 'loss' as const,
          label: `-${grossLoss.toFixed(1)}R`,
        },
        {
          name: 'Net P&L',
          value: Math.abs(netPnL),
          base: netPnL < 0 ? netPnL : 0,
          fill: netPnL >= 0 ? 'net-positive' as const : 'net-negative' as const,
          label: `${netPnL >= 0 ? '+' : ''}${netPnL.toFixed(1)}R`,
        },
      ],
      stats: {
        grossProfit,
        grossLoss,
        netPnL,
        profitFactor,
        winCount: wins.length,
        lossCount: losses.length,
      },
    };
  }, [trades]);

  if (trades.length === 0) return null;

  const fillColors: Record<string, string> = {
    profit: 'hsl(142, 76%, 36%)',
    loss: 'hsl(0, 84%, 60%)',
    'net-positive': 'hsl(221, 83%, 53%)',
    'net-negative': 'hsl(0, 60%, 50%)',
  };

  const content = (
    <>
      {/* Stats */}
      <div className="flex flex-wrap gap-4 mb-4 p-3 rounded-lg bg-muted/30 border border-border/50 text-sm">
        <div>
          <span className="text-muted-foreground">Gross Profit:</span>{' '}
          <span className="font-semibold text-green-500">+{data.stats.grossProfit.toFixed(1)}R</span>
          <span className="text-muted-foreground ml-1">({data.stats.winCount} wins)</span>
        </div>
        <div>
          <span className="text-muted-foreground">Gross Loss:</span>{' '}
          <span className="font-semibold text-red-500">-{data.stats.grossLoss.toFixed(1)}R</span>
          <span className="text-muted-foreground ml-1">({data.stats.lossCount} losses)</span>
        </div>
        <div className="border-l border-border pl-4">
          <span className="text-muted-foreground">Profit Factor:</span>{' '}
          <span className={`font-semibold ${data.stats.profitFactor >= 1 ? 'text-green-500' : 'text-red-500'}`}>
            {data.stats.profitFactor === Infinity ? '∞' : data.stats.profitFactor.toFixed(2)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Net:</span>{' '}
          <span className={`font-semibold ${data.stats.netPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {data.stats.netPnL >= 0 ? '+' : ''}{data.stats.netPnL.toFixed(1)}R
          </span>
        </div>
      </div>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.bars} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}R`} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                padding: '8px 12px',
                fontSize: '14px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 2 }}
              itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
              formatter={(val: number, name: string, props: any) => {
                return [props.payload.label, props.payload.name];
              }}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
            {/* Invisible base */}
            <Bar dataKey="base" stackId="waterfall" fill="transparent" />
            {/* Visible bar */}
            <Bar dataKey="value" stackId="waterfall" radius={[4, 4, 0, 0]}>
              {data.bars.map((entry, idx) => (
                <Cell key={idx} fill={fillColors[entry.fill]} fillOpacity={0.9} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );

  if (embedded) return content;

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Profit Structure
        </CardTitle>
        <CardDescription>
          Gross Profit vs Gross Loss waterfall — where your edge comes from
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};

export default ProfitStructureWaterfall;
