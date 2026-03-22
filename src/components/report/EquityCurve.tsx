import { useMemo, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { splitByAttribution, calcTotalR, type PaperTrade } from '@/hooks/useTradeReport';

interface Props { trades: PaperTrade[] }

export function EquityCurve({ trades }: Props) {
  const [showAi, setShowAi] = useState(true);
  const [showOverrides, setShowOverrides] = useState(true);
  const { ai, human } = useMemo(() => splitByAttribution(trades), [trades]);

  const data = useMemo(() => {
    let cumR = 0;
    return trades.map(t => {
      cumR += t.outcome_r ?? 0;
      const isOverride = t.attribution === 'override' || t.user_action === 'override';
      return {
        date: t.closed_at || t.created_at,
        cumR: parseFloat(cumR.toFixed(2)),
        isAi: !isOverride,
        isOverride,
        symbol: t.symbol,
        r: t.outcome_r ?? 0,
      };
    });
  }, [trades]);

  const aiTotalR = calcTotalR(ai);
  const humanTotalR = calcTotalR(human);

  return (
    <div className="bg-card border border-border/40 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Equity Curve</h2>
        <div className="flex gap-3">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={showAi} onChange={() => setShowAi(!showAi)} className="rounded" />
            <span className="w-2 h-2 rounded-full bg-blue-500" /> AI trades
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={showOverrides} onChange={() => setShowOverrides(!showOverrides)} className="rounded" />
            <span className="w-2 h-2 rounded-full bg-amber-500" /> My overrides
          </label>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--bullish))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--bullish))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={v => format(new Date(v), 'MMM d')}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}R`}
            />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="4 4" />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [`${value >= 0 ? '+' : ''}${value}R`, 'Cumulative R']}
              labelFormatter={v => format(new Date(v), 'MMM d, yyyy')}
            />
            <Area
              type="monotone"
              dataKey="cumR"
              stroke="hsl(var(--bullish))"
              fill="url(#equityFill)"
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (payload.isAi && showAi)
                  return <circle key={props.index} cx={cx} cy={cy} r={3} fill="#3b82f6" stroke="none" />;
                if (payload.isOverride && showOverrides)
                  return <circle key={props.index} cx={cx} cy={cy} r={3} fill="#f59e0b" stroke="none" />;
                return <circle key={props.index} cx={cx} cy={cy} r={0} />;
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
        <span>AI trades contributed: <span className={aiTotalR >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'}>
          {aiTotalR >= 0 ? '+' : ''}{aiTotalR.toFixed(1)}R</span> total</span>
        <span>Your overrides contributed: <span className={humanTotalR >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'}>
          {humanTotalR >= 0 ? '+' : ''}{humanTotalR.toFixed(1)}R</span> total</span>
      </div>
    </div>
  );
}
