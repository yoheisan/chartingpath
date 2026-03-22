import { Progress } from '@/components/ui/progress';

interface Props { tradeCount: number }

export function ReportEmptyState({ tradeCount }: Props) {
  const remaining = Math.max(0, 5 - tradeCount);
  const pct = Math.round((tradeCount / 5) * 100);

  return (
    <div className="bg-card border border-border/40 rounded-xl p-8 text-center">
      <p className="text-sm text-muted-foreground mb-4">
        Your report fills in as you paper trade. You need at least 5 closed trades to see full performance analysis.
        <br />
        <span className="text-foreground font-medium">{remaining} more trade{remaining !== 1 ? 's' : ''} to go.</span>
      </p>
      <div className="max-w-xs mx-auto">
        <Progress value={pct} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">{tradeCount}/5 trades completed</p>
      </div>
    </div>
  );
}
