import { useMemo } from 'react';
import { type PaperTrade, calcAvgR } from '@/hooks/useTradeReport';

interface Props { trades: PaperTrade[] }

interface PatternStats {
  name: string;
  wins: number;
  total: number;
  winRate: number;
  avgR: number;
}

export function PatternWinRate({ trades }: Props) {
  const patterns = useMemo(() => {
    const map = new Map<string, PaperTrade[]>();
    for (const t of trades) {
      const name = t.setup_type || t.pattern_id || 'Unknown';
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(t);
    }

    const stats: PatternStats[] = [];
    map.forEach((pts, name) => {
      const wins = pts.filter(t => (t.outcome_r ?? 0) > 0).length;
      const winRate = Math.round((wins / pts.length) * 100);
      stats.push({ name, wins, total: pts.length, winRate, avgR: calcAvgR(pts) });
    });

    return stats.sort((a, b) => b.winRate - a.winRate);
  }, [trades]);

  const best = patterns.find(p => p.total >= 3);
  const worst = [...patterns].filter(p => p.total >= 3).sort((a, b) => a.winRate - b.winRate)[0];

  return (
    <div className="bg-card border border-border/40 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Win Rate by Pattern</h2>

      <div className="space-y-2.5">
        {patterns.map(p => {
          if (p.total < 3) {
            return (
              <div key={p.name} className="text-xs text-muted-foreground/60">
                {p.name} — {p.total} trades — not enough data
              </div>
            );
          }

          const barColor = p.winRate >= 60
            ? 'bg-[hsl(var(--bullish))]'
            : p.winRate >= 40
              ? 'bg-amber-500'
              : 'bg-[hsl(var(--bearish))]';

          return (
            <div key={p.name} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-36 flex-shrink-0 truncate">{p.name}</span>
              <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-700`}
                  style={{ width: `${p.winRate}%` }}
                />
              </div>
              <span className="text-xs font-mono text-foreground w-40 text-right flex-shrink-0">
                {p.winRate}% · ({p.total} trades) · Avg {p.avgR >= 0 ? '+' : ''}{p.avgR.toFixed(1)}R
              </span>
            </div>
          );
        })}
      </div>

      {best && worst && best.name !== worst.name && (
        <p className="text-xs text-muted-foreground mt-4">
          Your best performing pattern is <span className="text-foreground font-medium">{best.name}</span> at {best.winRate}% win rate.
          Your worst is <span className="text-foreground font-medium">{worst.name}</span> at {worst.winRate}%.
        </p>
      )}
    </div>
  );
}
