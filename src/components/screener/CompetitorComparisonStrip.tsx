import { Check, X } from 'lucide-react';

const ROWS: { feature: string; finviz: boolean; cp: boolean }[] = [
  { feature: 'Pattern detection', finviz: true, cp: true },
  { feature: '1h intraday scanning', finviz: true, cp: true },
  { feature: 'Labeled outcome data', finviz: false, cp: true },
  { feature: 'Win rates per pattern', finviz: false, cp: true },
  { feature: 'Regime-adjusted win rates', finviz: false, cp: true },
];

function Cell({ value }: { value: boolean }) {
  return value ? (
    <Check className="h-4 w-4 text-bullish mx-auto" />
  ) : (
    <X className="h-4 w-4 text-muted-foreground/50 mx-auto" />
  );
}

export function CompetitorComparisonStrip() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 overflow-hidden max-w-2xl mx-auto">
      <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-border/50 bg-muted/30 text-xs font-medium text-muted-foreground">
        <div>Feature</div>
        <div className="text-center">Finviz</div>
        <div className="text-center text-primary">ChartingPath</div>
      </div>
      {ROWS.map((row) => (
        <div
          key={row.feature}
          className="grid grid-cols-3 gap-2 px-4 py-2.5 text-sm border-b border-border/30 last:border-0"
        >
          <div className="text-foreground">{row.feature}</div>
          <div>
            <Cell value={row.finviz} />
          </div>
          <div>
            <Cell value={row.cp} />
          </div>
        </div>
      ))}
    </div>
  );
}