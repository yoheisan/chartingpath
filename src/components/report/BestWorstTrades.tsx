import { useMemo } from 'react';
import { format } from 'date-fns';
import { type PaperTrade } from '@/hooks/useTradeReport';

interface Props { trades: PaperTrade[] }

function TradeTable({ title, trades, colorPositive }: { title: string; trades: PaperTrade[]; colorPositive: boolean }) {
  return (
    <div className="rounded-lg border border-border/40 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/40 bg-muted/20">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="divide-y divide-border/20">
        {trades.map(t => {
          const isOverride = t.attribution === 'override' || t.user_action === 'override';
          return (
            <div key={t.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono font-medium text-foreground">{t.symbol}</span>
                <span className="text-muted-foreground truncate max-w-[100px]">{t.setup_type || '—'}</span>
                <span className="text-muted-foreground">{t.closed_at ? format(new Date(t.closed_at), 'MMM d') : '—'}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-mono font-medium ${
                  colorPositive ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'
                }`}>
                  {(t.outcome_r ?? 0) >= 0 ? '+' : ''}{(t.outcome_r ?? 0).toFixed(1)}R
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  isOverride ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {isOverride ? 'You' : 'AI'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BestWorstTrades({ trades }: Props) {
  const { best, worst, worstOverrideCount } = useMemo(() => {
    const sorted = [...trades].sort((a, b) => (b.outcome_r ?? 0) - (a.outcome_r ?? 0));
    const best = sorted.slice(0, 5);
    const worst = sorted.slice(-5).reverse();
    const worstOverrideCount = worst.filter(
      t => t.attribution === 'override' || t.user_action === 'override'
    ).length;
    return { best, worst, worstOverrideCount };
  }, [trades]);

  return (
    <div className="bg-card border border-border/40 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Best & Worst Trades</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <TradeTable title="Best trades" trades={best} colorPositive={true} />
        <TradeTable title="Worst trades" trades={worst} colorPositive={false} />
      </div>
      <p className={`text-xs mt-3 ${worstOverrideCount >= 3 ? 'text-amber-400' : 'text-muted-foreground'}`}>
        Of your 5 worst trades, {worstOverrideCount} were overrides.
      </p>
    </div>
  );
}
