import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';

interface Props { tradeCount: number }

export function ReportEmptyState({ tradeCount }: Props) {
  const { t } = useTranslation();
  const remaining = Math.max(0, 5 - tradeCount);
  const pct = Math.round((tradeCount / 5) * 100);

  return (
    <div className="bg-card border border-border/40 rounded-xl p-8 text-center">
      <p className="text-sm text-muted-foreground mb-4">
        {t('report.emptyStateMessage')}
        <br />
        <span className="text-foreground font-medium">
          {t(remaining !== 1 ? 'report.moreToGo_plural' : 'report.moreToGo', { count: remaining })}
        </span>
      </p>
      <div className="max-w-xs mx-auto">
        <Progress value={pct} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">{t('report.tradesCompleted', { current: tradeCount })}</p>
      </div>
    </div>
  );
}
