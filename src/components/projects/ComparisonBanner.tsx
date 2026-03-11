import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

interface Metrics {
  winRate: number;
  expectancy: number;
  sharpe: number;
  profitFactor: number;
  totalTrades: number;
}

interface ComparisonBannerProps {
  previous: Metrics;
  current: Metrics;
}

const DeltaChip = ({ label, prev, curr, format, higherIsBetter = true }: {
  label: string;
  prev: number;
  curr: number;
  format: (v: number) => string;
  higherIsBetter?: boolean;
}) => {
  const diff = curr - prev;
  const pctChange = prev !== 0 ? (diff / Math.abs(prev)) * 100 : curr !== 0 ? 100 : 0;
  const isPositive = higherIsBetter ? diff > 0 : diff < 0;
  const isNeutral = Math.abs(pctChange) < 0.5;

  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[100px]">
      <span className="text-xs text-muted-foreground flex items-center gap-0.5">{label}{glossaryTerm && <InfoTooltip term={glossaryTerm} size="h-3 w-3" />}</span>
      <span className="text-sm font-semibold">{format(curr)}</span>
      <span className={`text-xs font-medium flex items-center gap-0.5 ${
        isNeutral ? 'text-muted-foreground' : isPositive ? 'text-green-500' : 'text-red-500'
      }`}>
        {!isNeutral && (isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />)}
        {isNeutral ? '—' : `${diff > 0 ? '+' : ''}${pctChange.toFixed(1)}%`}
      </span>
    </div>
  );
};

const ComparisonBanner = ({ previous, current }: ComparisonBannerProps) => {
  const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const fmtR = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}R`;
  const fmtNum = (v: number) => v === Infinity ? '∞' : v.toFixed(2);

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <ArrowRight className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">Optimization Comparison vs. Previous Run</span>
      </div>
      <div className="flex items-center justify-around flex-wrap gap-4">
        <DeltaChip label="Win Rate" prev={previous.winRate} curr={current.winRate} format={fmtPct} />
        <DeltaChip label="Expectancy" prev={previous.expectancy} curr={current.expectancy} format={fmtR} />
        <DeltaChip label="Sharpe" prev={previous.sharpe} curr={current.sharpe} format={fmtNum} />
        <DeltaChip label="Profit Factor" prev={previous.profitFactor} curr={current.profitFactor} format={fmtNum} />
        <DeltaChip label="Trades" prev={previous.totalTrades} curr={current.totalTrades} format={v => String(v)} higherIsBetter={false} />
      </div>
    </div>
  );
};

export default ComparisonBanner;
