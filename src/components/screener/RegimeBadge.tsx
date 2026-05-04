import { useRegimeContext } from '@/hooks/useRegimeContext';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Regime = 'risk_on' | 'risk_off' | 'neutral' | 'trending' | 'ranging';

const CONFIG: Record<
  Regime,
  { labelKey: string; labelFallback: string; color: string; icon: JSX.Element; tipKey: string; tipFallback: string }
> = {
  risk_on: {
    labelKey: 'regime.riskOn', labelFallback: 'Risk-On',
    color: 'bg-bullish/20 text-bullish border-bullish/30',
    icon: <TrendingUp className="h-3 w-3" />,
    tipKey: 'regime.tipRiskOn', tipFallback: 'Bullish macro environment — pattern win rates elevated',
  },
  risk_off: {
    labelKey: 'regime.riskOff', labelFallback: 'Risk-Off',
    color: 'bg-bearish/20 text-bearish border-bearish/30',
    icon: <TrendingDown className="h-3 w-3" />,
    tipKey: 'regime.tipRiskOff', tipFallback: 'Risk-off macro environment — pattern win rates suppressed',
  },
  neutral: {
    labelKey: 'regime.neutral', labelFallback: 'Neutral',
    color: 'bg-muted/50 text-muted-foreground border-muted',
    icon: <Minus className="h-3 w-3" />,
    tipKey: 'regime.tipNeutral', tipFallback: 'Mixed macro signals — check individual pattern stats',
  },
  trending: {
    labelKey: 'regime.trending', labelFallback: 'Trending',
    color: 'bg-primary/20 text-primary border-primary/30',
    icon: <Activity className="h-3 w-3" />,
    tipKey: 'regime.tipTrending', tipFallback: 'Trending market — continuation patterns perform best',
  },
  ranging: {
    labelKey: 'regime.ranging', labelFallback: 'Ranging',
    color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
    icon: <AlertTriangle className="h-3 w-3" />,
    tipKey: 'regime.tipRanging', tipFallback: 'Ranging market — reversal patterns perform best',
  },
};

export function RegimeBadge() {
  const { t } = useTranslation();
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
            <span className="font-medium">{t(c.labelKey, c.labelFallback)}</span>
            {typeof regime.vix_close === 'number' && (
              <span className="opacity-70 text-[10px]">
                {t('regime.vix', 'VIX {{value}}', { value: regime.vix_close.toFixed(1) })}
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-xs">{t(c.tipKey, c.tipFallback)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}