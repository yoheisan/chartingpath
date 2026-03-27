import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer, ComposedChart, Area, Bar, XAxis, YAxis,
  Tooltip, ReferenceLine, CartesianGrid, Cell,
} from 'recharts';
import { format } from 'date-fns';
import { splitByAttribution, calcTotalR, type PaperTrade } from '@/hooks/useTradeReport';

interface Props { trades: PaperTrade[] }

export function EquityCurve({ trades }: Props) {
  const { t } = useTranslation();
  const [showBars, setShowBars] = useState(true);
  const { ai, human } = useMemo(() => splitByAttribution(trades), [trades]);

  const data = useMemo(() => {
    let cumR = 0;
    let peak = 0;
    return trades.map((tr, i) => {
      const r = tr.outcome_r ?? 0;
      cumR += r;
      peak = Math.max(peak, cumR);
      const dd = cumR - peak;
      const isOverride = tr.attribution === 'override' || tr.user_action === 'override';
      return {
        idx: i + 1,
        date: tr.closed_at || tr.created_at,
        cumR: parseFloat(cumR.toFixed(2)),
        r: parseFloat(r.toFixed(2)),
        dd: parseFloat(dd.toFixed(2)),
        isAi: !isOverride,
        isOverride,
        symbol: tr.symbol,
        setup: tr.setup_type || '—',
        outcome: r > 0 ? 'win' : r < 0 ? 'loss' : 'breakeven',
      };
    });
  }, [trades]);

  const aiTotalR = calcTotalR(ai);
  const humanTotalR = calcTotalR(human);
  const totalR = calcTotalR(trades);
  const wins = trades.filter(t => (t.outcome_r ?? 0) > 0).length;
  const losses = trades.filter(t => (t.outcome_r ?? 0) < 0).length;
  const maxDD = data.length > 0 ? Math.min(...data.map(d => d.dd)) : 0;

  return (
    <div className="bg-card border border-border/40 rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('report.equityCurve')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {trades.length} trades · {wins}W / {losses}L · Net{' '}
            <span className={totalR >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'}>
              {totalR >= 0 ? '+' : ''}{totalR.toFixed(1)}R
            </span>
            {' '}· Max DD{' '}
            <span className="text-[hsl(var(--bearish))]">{maxDD.toFixed(1)}R</span>
          </p>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
          <input type="checkbox" checked={showBars} onChange={() => setShowBars(!showBars)} className="rounded" />
          Show per-trade bars
        </label>
      </div>

      {/* Equity + per-trade bars */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="eqFillUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--bullish))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--bullish))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} opacity={0.4} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={v => format(new Date(v), 'MMM d')}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="cumR"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}R`}
            />
            {showBars && (
              <YAxis
                yAxisId="bar"
                orientation="right"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${v}R`}
              />
            )}
            <ReferenceLine yAxisId="cumR" y={0} stroke="hsl(var(--border))" strokeDasharray="4 4" />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '13px',
                padding: '8px 12px',
              }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                if (!d) return null;
                return (
                  <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs space-y-1">
                    <p className="font-medium text-foreground">{d.symbol} · #{d.idx}</p>
                    <p className="text-muted-foreground">{format(new Date(d.date), 'MMM d, yyyy HH:mm')}</p>
                    <div className="flex gap-3 pt-1">
                      <span>
                        Trade:{' '}
                        <span className={d.r >= 0 ? 'text-[hsl(var(--bullish))] font-semibold' : 'text-[hsl(var(--bearish))] font-semibold'}>
                          {d.r >= 0 ? '+' : ''}{d.r}R
                        </span>
                      </span>
                      <span>
                        Cum:{' '}
                        <span className={d.cumR >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'}>
                          {d.cumR >= 0 ? '+' : ''}{d.cumR}R
                        </span>
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      {d.isOverride ? '🧑 Override' : '🤖 AI'} · {d.setup}
                    </p>
                    {d.dd < 0 && (
                      <p className="text-[hsl(var(--bearish))]">DD: {d.dd}R</p>
                    )}
                  </div>
                );
              }}
            />
            {showBars && (
              <Bar yAxisId="bar" dataKey="r" barSize={6} radius={[2, 2, 0, 0]} opacity={0.7}>
                {data.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.r >= 0 ? 'hsl(var(--bullish))' : 'hsl(var(--bearish))'}
                  />
                ))}
              </Bar>
            )}
            <Area
              yAxisId="cumR"
              type="monotone"
              dataKey="cumR"
              stroke="hsl(var(--bullish))"
              fill="url(#eqFillUp)"
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const color = payload.isOverride ? '#f59e0b' : '#3b82f6';
                return (
                  <circle
                    key={props.index}
                    cx={cx}
                    cy={cy}
                    r={payload.r >= 0 ? 3.5 : 3}
                    fill={payload.r >= 0 ? color : 'hsl(var(--bearish))'}
                    stroke={payload.r >= 0 ? 'none' : 'hsl(var(--bearish))'}
                    strokeWidth={1}
                    opacity={0.9}
                  />
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Drawdown mini chart */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">Underwater (Drawdown)</p>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
              <XAxis dataKey="date" hide />
              <YAxis
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${v}R`}
                domain={['dataMin', 0]}
              />
              <Area
                type="monotone"
                dataKey="dd"
                stroke="hsl(var(--bearish))"
                fill="hsl(var(--bearish))"
                fillOpacity={0.15}
                strokeWidth={1.5}
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attribution summary */}
      <div className="flex gap-6 text-xs text-muted-foreground border-t border-border/30 pt-3">
        <span>🤖 AI contributed{' '}
          <span className={aiTotalR >= 0 ? 'text-[hsl(var(--bullish))] font-medium' : 'text-[hsl(var(--bearish))] font-medium'}>
            {aiTotalR >= 0 ? '+' : ''}{aiTotalR.toFixed(1)}R
          </span> ({ai.length} trades)
        </span>
        <span>🧑 Overrides contributed{' '}
          <span className={humanTotalR >= 0 ? 'text-[hsl(var(--bullish))] font-medium' : 'text-[hsl(var(--bearish))] font-medium'}>
            {humanTotalR >= 0 ? '+' : ''}{humanTotalR.toFixed(1)}R
          </span> ({human.length} trades)
        </span>
      </div>
    </div>
  );
}
