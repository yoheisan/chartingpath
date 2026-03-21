/**
 * Edge Metrics Badge Component
 * 
 * Displays trading edge metrics (Win Rate, Expectancy, Profit Factor) with:
 * - Clear values for premium users
 * - Blurred/teaser display for free users to drive upgrades
 */

import { Badge } from '@/components/ui/badge';
import { Lock, TrendingUp, Crown, BarChart3, Target, Percent } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface EdgeMetrics {
  winRate: number | null; // 0-100 percentage
  avgRMultiple: number | null; // Expectancy in R terms
  profitFactor: number | null; // Gross profit / gross loss
  sampleSize: number | null; // Number of trades
  reliabilityScore?: number; // 0-100
}

interface EdgeMetricsBadgeProps {
  metrics: EdgeMetrics | null;
  isLocked?: boolean;
  compact?: boolean;
  showTooltip?: boolean;
  className?: string;
}

/**
 * Returns color class based on metric quality
 */
function getMetricColor(value: number | null, type: 'winRate' | 'expectancy' | 'profitFactor'): string {
  if (value === null) return 'text-muted-foreground';
  
  switch (type) {
    case 'winRate':
      if (value >= 60) return 'text-green-500';
      if (value >= 45) return 'text-yellow-500';
      return 'text-red-500';
    case 'expectancy':
      if (value >= 0.5) return 'text-green-500';
      if (value >= 0) return 'text-yellow-500';
      return 'text-red-500';
    case 'profitFactor':
      if (value >= 1.5) return 'text-green-500';
      if (value >= 1.0) return 'text-yellow-500';
      return 'text-red-500';
    default:
      return 'text-foreground';
  }
}

/**
 * Blurred metric display for free users
 */
function BlurredMetric({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-1">
      <Icon className="h-3 w-3 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-xs blur-sm select-none">88.8%</span>
    </div>
  );
}

/**
 * Main Edge Metrics Badge - inline display
 */
export function EdgeMetricsBadge({
  metrics,
  isLocked = false,
  compact = false,
  showTooltip = true,
  className,
}: EdgeMetricsBadgeProps) {
  // If locked, show teaser with blur
  if (isLocked) {
    const content = (
      <div className={cn(
        'inline-flex items-center gap-2 px-2 py-1 rounded-md border border-dashed',
        'bg-muted/30 border-muted-foreground/30',
        className
      )}>
        <Lock className="h-3 w-3 text-muted-foreground" />
        {compact ? (
          <span className="text-sm text-muted-foreground blur-[3px] select-none">
            Win 55% | 0.4R
          </span>
        ) : (
          <div className="flex items-center gap-3">
            <BlurredMetric label="Win" icon={Percent} />
            <BlurredMetric label="Exp" icon={Target} />
          </div>
        )}
        <Crown className="h-3 w-3 text-amber-500" />
      </div>
    );

    if (!showTooltip) return content;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1 font-medium">
                <Crown className="h-3 w-3 text-amber-500" />
                <span>Upgrade to unlock edge metrics</span>
              </div>
              <p className="text-xs text-muted-foreground">
                See historical Win Rate, Expectancy, and Profit Factor for each pattern.
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // No metrics available
  if (!metrics || (metrics.winRate === null && metrics.avgRMultiple === null)) {
    return (
      <span className="text-xs text-muted-foreground">—</span>
    );
  }

  // Compact display: just win rate and expectancy inline
  if (compact) {
    const content = (
      <div className={cn('inline-flex items-center gap-2 text-xs', className)}>
        {metrics.winRate !== null && (
          <span className={cn('font-mono font-medium', getMetricColor(metrics.winRate, 'winRate'))}>
            {metrics.winRate.toFixed(0)}%
          </span>
        )}
        {metrics.avgRMultiple !== null && (
          <span className={cn('font-mono', getMetricColor(metrics.avgRMultiple, 'expectancy'))}>
            {metrics.avgRMultiple >= 0 ? '+' : ''}{metrics.avgRMultiple.toFixed(2)}R
          </span>
        )}
      </div>
    );

    if (!showTooltip) return content;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <EdgeMetricsTooltipContent metrics={metrics} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full display with all metrics
  const content = (
    <div className={cn(
      'inline-flex items-center gap-3 px-2 py-1 rounded-md border',
      'bg-muted/20 border-border/50',
      className
    )}>
      {metrics.winRate !== null && (
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Win</span>
          <span className={cn('font-mono text-xs font-medium', getMetricColor(metrics.winRate, 'winRate'))}>
            {metrics.winRate.toFixed(0)}%
          </span>
        </div>
      )}
      {metrics.avgRMultiple !== null && (
        <div className="flex items-center gap-1">
          <Target className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Exp</span>
          <span className={cn('font-mono text-xs font-medium', getMetricColor(metrics.avgRMultiple, 'expectancy'))}>
            {metrics.avgRMultiple >= 0 ? '+' : ''}{metrics.avgRMultiple.toFixed(2)}R
          </span>
        </div>
      )}
      {metrics.profitFactor !== null && (
        <div className="flex items-center gap-1">
          <BarChart3 className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">PF</span>
          <span className={cn('font-mono text-xs font-medium', getMetricColor(metrics.profitFactor, 'profitFactor'))}>
            {metrics.profitFactor.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );

  if (!showTooltip) return content;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <EdgeMetricsTooltipContent metrics={metrics} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Tooltip content for edge metrics
 */
function EdgeMetricsTooltipContent({ metrics }: { metrics: EdgeMetrics }) {
  return (
    <div className="space-y-2 p-1">
      <div className="text-xs font-medium">Historical Edge Metrics</div>
      <div className="space-y-1 text-xs">
        {metrics.winRate !== null && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Win Rate:</span>
            <span className={cn('font-mono font-medium', getMetricColor(metrics.winRate, 'winRate'))}>
              {metrics.winRate.toFixed(1)}%
            </span>
          </div>
        )}
        {metrics.avgRMultiple !== null && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Expectancy:</span>
            <span className={cn('font-mono font-medium', getMetricColor(metrics.avgRMultiple, 'expectancy'))}>
              {metrics.avgRMultiple >= 0 ? '+' : ''}{metrics.avgRMultiple.toFixed(2)}R
            </span>
          </div>
        )}
        {metrics.profitFactor !== null && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Profit Factor:</span>
            <span className={cn('font-mono font-medium', getMetricColor(metrics.profitFactor, 'profitFactor'))}>
              {metrics.profitFactor.toFixed(2)}
            </span>
          </div>
        )}
        {metrics.sampleSize !== null && (
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-border/50">
            <span className="text-muted-foreground">Sample Size:</span>
            <span className="font-mono">
              {metrics.sampleSize.toLocaleString()} trades
            </span>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground pt-1 border-t border-border/50">
        Based on historical backtest data. Not a guarantee of future results.
      </p>
    </div>
  );
}

/**
 * Compact inline badge for table cells
 */
export function EdgeMetricsInline({
  metrics,
  isLocked = false,
  className,
}: {
  metrics: EdgeMetrics | null;
  isLocked?: boolean;
  className?: string;
}) {
  if (isLocked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn(
              'inline-flex items-center gap-1 text-xs text-muted-foreground cursor-help',
              className
            )}>
              <span className="blur-[2px] select-none font-mono">55%</span>
              <Lock className="h-3 w-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="flex items-center gap-1">
              <Crown className="h-3 w-3 text-amber-500" />
              <span className="text-xs">Upgrade to see edge metrics</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!metrics || metrics.winRate === null) {
    return <span className={cn('text-xs text-muted-foreground', className)}>—</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(
            'font-mono text-xs font-medium cursor-help',
            getMetricColor(metrics.winRate, 'winRate'),
            className
          )}>
            {metrics.winRate.toFixed(0)}%
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <EdgeMetricsTooltipContent metrics={metrics} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Badge showing just expectancy with context
 */
export function ExpectancyBadge({
  expectancy,
  isLocked = false,
  className,
}: {
  expectancy: number | null;
  isLocked?: boolean;
  className?: string;
}) {
  if (isLocked) {
    return (
      <Badge variant="outline" className={cn(
        'border-dashed opacity-60 cursor-help',
        className
      )}>
        <span className="blur-[2px] select-none">+0.4R</span>
        <Lock className="h-3 w-3 ml-1" />
      </Badge>
    );
  }

  if (expectancy === null) {
    return null;
  }

  const color = getMetricColor(expectancy, 'expectancy');
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        'font-mono',
        expectancy >= 0.3 ? 'border-green-500/30 bg-green-500/10' : 
        expectancy >= 0 ? 'border-yellow-500/30 bg-yellow-500/10' : 
        'border-red-500/30 bg-red-500/10',
        color,
        className
      )}
    >
      {expectancy >= 0 ? '+' : ''}{expectancy.toFixed(2)}R
    </Badge>
  );
}
