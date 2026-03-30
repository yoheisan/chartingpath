import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type StalenessLevel = 'fresh' | 'amber' | 'red';

export function getStalenessLevel(lastConfirmedAt: string): StalenessLevel {
  const ageMs = Date.now() - new Date(lastConfirmedAt).getTime();
  const ageMin = ageMs / 60_000;
  if (ageMin > 5) return 'red';
  if (ageMin > 2) return 'amber';
  return 'fresh';
}

export function getStalenessAge(lastConfirmedAt: string): string {
  const ageMs = Date.now() - new Date(lastConfirmedAt).getTime();
  const mins = Math.floor(ageMs / 60_000);
  if (mins < 1) return '<1m ago';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

const colorMap: Record<StalenessLevel, string> = {
  fresh: 'text-foreground',
  amber: 'text-amber-500',
  red: 'text-red-400',
};

interface StalenessPriceProps {
  price: number;
  lastConfirmedAt: string;
  className?: string;
}

export const StalenessPrice = ({ price, lastConfirmedAt, className = '' }: StalenessPriceProps) => {
  const level = getStalenessLevel(lastConfirmedAt);
  const age = getStalenessAge(lastConfirmedAt);
  const priceColor = colorMap[level];

  const priceEl = (
    <span className={`${priceColor} ${className}`}>
      ${price.toFixed(2)}
    </span>
  );

  if (level === 'fresh') {
    return (
      <span className="inline-flex items-center gap-1">
        {priceEl}
        <span className="text-[10px] text-muted-foreground">{age}</span>
      </span>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help">
            {priceEl}
            <span className={`text-[10px] ${level === 'red' ? 'text-red-400' : 'text-amber-500'}`}>
              {age}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-xs">
          {level === 'red'
            ? 'Price data may be stale — SL/TP checks may be delayed.'
            : 'Price is slightly delayed — scanner refreshes every few minutes.'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
