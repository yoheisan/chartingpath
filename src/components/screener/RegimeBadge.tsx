import { useRegimeContext } from '@/hooks/useRegimeContext';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Activity } from 'lucide-react';

type Regime = 'risk_on' | 'risk_off' | 'neutral' | 'trending' | 'ranging';

const CONFIG: Record<
  Regime,
  { label: string; color: string; icon: JSX.Element; tip: string }
> = {
  risk_on: {
    label: 'Risk-On',
    color: 'bg-bullish/20 text-bullish border-bullish/30',
    icon: <TrendingUp className="h-3 w-3" />,
    tip: 'Bullish macro environment — pattern win rates elevated',
  },
  risk_off: {
    label: 'Risk-Off',
    color: 'bg-bearish/20 text-bearish border-bearish/30',
    icon: <TrendingDown className="h-3 w-3" />,
    tip: 'Risk-off macro environment — pattern win rates suppressed',
  },
  neutral: {
    label: 'Neutral',
    color: 'bg-muted/50 text-muted-foreground border-muted',
    icon: <Minus className="h-3 w-3" />,
    tip: 'Mixed macro signals — check individual pattern stats',
  },
  trending: {
    label: 'Trending',
    color: 'bg-primary/20 text-primary border-primary/30',
    icon: <Activity className="h-3 w-3" />,
    tip: 'Trending market — continuation patterns perform best',
  },
  ranging: {
    label: 'Ranging',
    color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    icon: <AlertTriangle className="h-3 w-3" />,
    tip: 'Ranging market — reversal patterns perform best',
  },
};

export function RegimeBadge() {
  const { data: regime, isLoading } = useRegimeContext();

  if (isLoading || !regime) return null;

  const c = CONFIG[regime.market_regime] ?? CONFIG.neutral;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`gap-1.5 cursor-help ${c.color}`}
          >
            {c.icon}
            <span className="font-medium">{c.label}</span>
            {typeof regime.vix_close === 'number' && (
              <span className="opacity-70 text-[10px]">
                VIX {regime.vix_close.toFixed(1)}
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-xs">{c.tip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}