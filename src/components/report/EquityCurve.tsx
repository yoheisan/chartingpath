import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer, ComposedChart, Area, XAxis, YAxis,
  Tooltip, ReferenceLine, CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { splitByAttribution, calcTotalR, type PaperTrade } from '@/hooks/useTradeReport';

interface Props { trades: PaperTrade[] }

export function EquityCurve({ trades }: Props) {
  const { t } = useTranslation();
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
        isOverride,
        symbol: tr.symbol,
        setup: tr.setup_type || '—',
        tradeType: tr.trade_type,
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
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>🤖 AI{' '}
            <span className={aiTotalR >= 0 ? 'text-[hsl(var(--bullish))] font-medium' : 'text-[hsl(var(--bearish))] font-medium'}>
              {aiTotalR >= 0 ? '+' : ''}{aiTotalR.toFixed(1)}R
            </span>
          </span>
          <span>🧑 Override{' '}
            <span className={humanTotalR >= 0 ? 'text-[hsl(var(--bullish))] font-medium' : 'text-[hsl(var(--bearish))] font-medium'}>
              {humanTotalR >= 0 ? '+' : ''}{humanTotalR.toFixed(1)}R
            </span>
          </span>
        </div>
      </div>

      {/* Equity Curve Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
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
                fontSize: '13px',
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
                      <span>Trade: <span className={d.r >= 0 ? 'text-[hsl(var(--bullish))] font-semibold' : 'text-[hsl(var(--bearish))] font-semibold'}>{d.r >= 0 ? '+' : ''}{d.r}R</span></span>
                      <span>Cum: <span className={d.cumR >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'}>{d.cumR >= 0 ? '+' : ''}{d.cumR}R</span></span>
                    </div>
                    <p className="text-muted-foreground">{d.isOverride ? '🧑 Override' : '🤖 AI'} · {d.setup}</p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="cumR"
              stroke="hsl(var(--bullish))"
              fill="url(#eqFill)"
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const color = payload.r >= 0 ? 'hsl(var(--bullish))' : 'hsl(var(--bearish))';
                return <circle key={props.index} cx={cx} cy={cy} r={3} fill={color} stroke="none" />;
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Trade List */}
      <div className="border-t border-border/30 pt-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Trade Log</h3>
        <div className="grid grid-cols-[2.5rem_4rem_1fr_4rem_4rem_5rem_4.5rem] gap-x-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider pb-1.5 border-b border-border/30 px-2">
          <span>#</span>
          <span>Date</span>
          <span>Symbol</span>
          <span>Type</span>
          <span>Setup</span>
          <span>Result</span>
          <span className="text-right">Cum R</span>
        </div>
        <ScrollArea className="max-h-60">
          <div className="divide-y divide-border/20">
            {data.map(d => (
              <div
                key={d.idx}
                className="grid grid-cols-[2.5rem_4rem_1fr_4rem_4rem_5rem_4.5rem] gap-x-2 items-center py-1.5 px-2 text-xs hover:bg-muted/30 transition-colors"
              >
                <span className="text-muted-foreground">{d.idx}</span>
                <span className="text-muted-foreground">{format(new Date(d.date), 'MM/dd')}</span>
                <span className="font-medium text-foreground">{d.symbol}</span>
                <span className="text-muted-foreground capitalize">{d.tradeType}</span>
                <span className="text-muted-foreground truncate" title={d.setup}>{d.setup}</span>
                <span className={`font-semibold ${d.r > 0 ? 'text-[hsl(var(--bullish))]' : d.r < 0 ? 'text-[hsl(var(--bearish))]' : 'text-muted-foreground'}`}>
                  {d.r > 0 ? '+' : ''}{d.r}R
                  {d.r > 0 ? ' ✅' : d.r < 0 ? ' ❌' : ''}
                </span>
                <span className={`text-right font-medium ${d.cumR >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'}`}>
                  {d.cumR >= 0 ? '+' : ''}{d.cumR}R
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
