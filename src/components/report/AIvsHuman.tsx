import { useMemo } from 'react';
import { splitByAttribution, calcWinRate, calcAvgR, calcTotalR, calcAvgHoldTime, type PaperTrade } from '@/hooks/useTradeReport';

interface Props { trades: PaperTrade[] }

function StatBlock({ label, value, color }: { label: string; value: string; color?: boolean }) {
  return (
    <div className="flex justify-between text-sm py-1.5 border-b border-border/20 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-medium ${color === undefined ? 'text-foreground' : color ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'}`}>
        {value}
      </span>
    </div>
  );
}

export function AIvsHuman({ trades }: Props) {
  const { ai, human } = useMemo(() => splitByAttribution(trades), [trades]);

  const stats = (t: PaperTrade[]) => {
    const wr = calcWinRate(t);
    const avgR = calcAvgR(t);
    const totalR = calcTotalR(t);
    const hold = calcAvgHoldTime(t);
    const sorted = [...t].sort((a, b) => (b.outcome_r ?? 0) - (a.outcome_r ?? 0));
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    return { wr, avgR, totalR, hold, best, worst, count: t.length };
  };

  const aiStats = useMemo(() => stats(ai), [ai]);
  const humanStats = useMemo(() => stats(human), [human]);

  const overrideCost = useMemo(() => {
    const cost = calcTotalR(human);
    return cost;
  }, [human]);

  return (
    <div className="bg-card border border-border/40 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">AI vs Human Trades</h2>

      <div className="grid md:grid-cols-2 gap-4">
        {/* AI column */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <h3 className="text-sm font-semibold text-blue-400 mb-3">Copilot (AI-approved)</h3>
          <StatBlock label="Win rate" value={`${aiStats.wr}%`} />
          <StatBlock label="Avg R per trade" value={`${aiStats.avgR >= 0 ? '+' : ''}${aiStats.avgR.toFixed(1)}R`} color={aiStats.avgR >= 0} />
          <StatBlock label="Total R" value={`${aiStats.totalR >= 0 ? '+' : ''}${aiStats.totalR.toFixed(1)}R`} color={aiStats.totalR >= 0} />
          <StatBlock label="Trade count" value={`${aiStats.count} trades`} />
          {aiStats.best && <StatBlock label="Best trade" value={`${aiStats.best.symbol} +${(aiStats.best.outcome_r ?? 0).toFixed(1)}R`} color={true} />}
          {aiStats.worst && <StatBlock label="Worst trade" value={`${aiStats.worst.symbol} ${(aiStats.worst.outcome_r ?? 0).toFixed(1)}R`} color={false} />}
          <StatBlock label="Avg hold time" value={`${aiStats.hold.hours}hrs ${aiStats.hold.mins}min`} />
        </div>

        {/* Human column */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <h3 className="text-sm font-semibold text-amber-400 mb-3">Your overrides</h3>
          {humanStats.count === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No overrides yet — great discipline!</p>
          ) : (
            <>
              <StatBlock label="Win rate" value={`${humanStats.wr}%`} />
              <StatBlock label="Avg R per trade" value={`${humanStats.avgR >= 0 ? '+' : ''}${humanStats.avgR.toFixed(1)}R`} color={humanStats.avgR >= 0} />
              <StatBlock label="Total R" value={`${humanStats.totalR >= 0 ? '+' : ''}${humanStats.totalR.toFixed(1)}R`} color={humanStats.totalR >= 0} />
              <StatBlock label="Trade count" value={`${humanStats.count} trades`} />
              {humanStats.best && <StatBlock label="Best trade" value={`${humanStats.best.symbol} +${(humanStats.best.outcome_r ?? 0).toFixed(1)}R`} color={true} />}
              {humanStats.worst && <StatBlock label="Worst trade" value={`${humanStats.worst.symbol} ${(humanStats.worst.outcome_r ?? 0).toFixed(1)}R`} color={false} />}
              <StatBlock label="Avg hold time" value={`${humanStats.hold.hours}hrs ${humanStats.hold.mins}min`} />
            </>
          )}
        </div>
      </div>

      {human.length > 0 && (
        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
          Your overrides have {overrideCost >= 0 ? 'gained' : 'cost'} you{' '}
          <span className={overrideCost >= 0 ? 'text-[hsl(var(--bullish))]' : 'text-[hsl(var(--bearish))]'}>
            {Math.abs(overrideCost).toFixed(1)}R
          </span>{' '}
          over {human.length} trades. Override win rate: {humanStats.wr}% vs Copilot's {aiStats.wr}%.
        </p>
      )}
    </div>
  );
}
