import { useMemo } from 'react';
import { format } from 'date-fns';
import { calcWinRate, calcAvgR, type PaperTrade, type MasterPlanRow } from '@/hooks/useTradeReport';

interface Props {
  trades: PaperTrade[];
  plans: MasterPlanRow[];
}

export function PlanChangeHistory({ trades, plans }: Props) {
  const timeline = useMemo(() => {
    if (plans.length === 0) return [];

    return plans.map((plan, i) => {
      const start = new Date(plan.created_at);
      const end = i < plans.length - 1 ? new Date(plans[i + 1].created_at) : new Date();
      const periodTrades = trades.filter(t => {
        const d = new Date(t.closed_at || t.created_at);
        return d >= start && d < end;
      });

      const wr = calcWinRate(periodTrades);
      const avgR = calcAvgR(periodTrades);

      let prevWr = 0, prevAvgR = 0;
      if (i > 0) {
        const prevStart = new Date(plans[i - 1].created_at);
        const prevEnd = start;
        const prevTrades = trades.filter(t => {
          const d = new Date(t.closed_at || t.created_at);
          return d >= prevStart && d < prevEnd;
        });
        prevWr = calcWinRate(prevTrades);
        prevAvgR = calcAvgR(prevTrades);
      }

      let verdict: 'improved' | 'declined' | 'too_early' = 'too_early';
      if (periodTrades.length >= 5 && i > 0) {
        if (wr > prevWr || avgR > prevAvgR) verdict = 'improved';
        else if (wr < prevWr && avgR < prevAvgR) verdict = 'declined';
      }

      return {
        plan,
        tradesCount: periodTrades.length,
        wr,
        avgR,
        verdict,
        isFirst: i === 0,
      };
    });
  }, [trades, plans]);

  if (plans.length === 0) {
    return (
      <div className="bg-card border border-border/40 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">Plan Change History</h2>
        <p className="text-sm text-muted-foreground">No trading plan found. Create one on the Copilot page.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/40 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Plan Change History</h2>

      <div className="space-y-4">
        {timeline.map((entry, i) => (
          <div key={entry.plan.id} className="flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
              {i < timeline.length - 1 && <div className="w-px flex-1 bg-border/40" />}
            </div>

            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">
                  {entry.plan.name || 'Trading Plan'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(entry.plan.created_at), 'MMM d, yyyy')}
                </span>
                {!entry.isFirst && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    entry.verdict === 'improved' ? 'bg-[hsl(var(--bullish))]/20 text-[hsl(var(--bullish))]' :
                    entry.verdict === 'declined' ? 'bg-[hsl(var(--bearish))]/20 text-[hsl(var(--bearish))]' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {entry.verdict === 'improved' ? 'Improved' : entry.verdict === 'declined' ? 'Declined' : 'Too early'}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {entry.tradesCount} trades · {entry.wr}% win rate · avg {entry.avgR >= 0 ? '+' : ''}{entry.avgR.toFixed(1)}R
              </p>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 1 && (
        <p className="text-xs text-muted-foreground mt-2">
          You haven't changed your plan yet. Paper test for longer before evaluating changes.
        </p>
      )}
    </div>
  );
}
