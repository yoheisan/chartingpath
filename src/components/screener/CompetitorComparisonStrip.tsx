import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ROWS: { key: string; fallback: string; finviz: boolean; cp: boolean }[] = [
  { key: 'competitor.rowPatternDetection', fallback: 'Pattern detection', finviz: true, cp: true },
  { key: 'competitor.rowIntraday', fallback: '1h intraday scanning', finviz: true, cp: true },
  { key: 'competitor.rowOutcomeData', fallback: 'Labeled outcome data', finviz: false, cp: true },
  { key: 'competitor.rowWinRates', fallback: 'Win rates per pattern', finviz: false, cp: true },
  { key: 'competitor.rowRegimeAdjusted', fallback: 'Regime-adjusted win rates', finviz: false, cp: true },
];

function Cell({ value }: { value: boolean }) {
  return value ? (
    <Check className="h-4 w-4 text-bullish mx-auto" />
  ) : (
    <X className="h-4 w-4 text-muted-foreground/50 mx-auto" />
  );
}

export function CompetitorComparisonStrip() {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 overflow-hidden max-w-2xl mx-auto">
      <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-border/50 bg-muted/30 text-xs font-medium text-muted-foreground">
        <div>{t('competitor.feature', 'Feature')}</div>
        <div className="text-center">{t('competitor.finviz', 'Finviz')}</div>
        <div className="text-center text-primary">{t('competitor.chartingpath', 'ChartingPath')}</div>
      </div>
      {ROWS.map((row) => (
        <div
          key={row.key}
          className="grid grid-cols-3 gap-2 px-4 py-2.5 text-sm border-b border-border/30 last:border-0"
        >
          <div className="text-foreground">{t(row.key, row.fallback)}</div>
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