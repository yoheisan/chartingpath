import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUserProfile } from '@/hooks/useUserProfile';
import { PLANS_CONFIG, PlanTier } from '@/config/plans';
import { cn } from '@/lib/utils';

export interface TimeframeOption {
  value: string;
  label: string;
  shortLabel: string;
}

export const STUDY_TIMEFRAMES: TimeframeOption[] = [
  { value: '15m', label: '15 Minutes', shortLabel: '15M' },
  { value: '1h', label: '1 Hour', shortLabel: '1H' },
  { value: '4h', label: '4 Hours', shortLabel: '4H' },
  { value: '8h', label: '8 Hours', shortLabel: '8H' },
  { value: '1d', label: 'Daily', shortLabel: '1D' },
  { value: '1wk', label: 'Weekly', shortLabel: '1W' },
];

interface TimeframeSelectorProps {
  value: string;
  onChange: (timeframe: string) => void;
  className?: string;
  size?: 'sm' | 'default';
  showLabels?: boolean;
}

/**
 * Get plan tier from subscription plan string
 */
function getPlanTier(subscriptionPlan: string): PlanTier {
  const planMapping: Record<string, PlanTier> = {
    'free': 'FREE',
    'starter': 'PLUS',
    'pro': 'PRO',
    'pro_plus': 'PRO',
    'elite': 'TEAM',
  };
  return planMapping[subscriptionPlan.toLowerCase()] || 'FREE';
}

/**
 * TimeframeSelector - Tier-gated timeframe selection component
 * 
 * Free users: Daily (1d) only
 * Paid users (PLUS+): All timeframes (1h, 4h, 1d, 1wk)
 */
export function TimeframeSelector({
  value,
  onChange,
  className,
  size = 'default',
  showLabels = false,
}: TimeframeSelectorProps) {
  const { subscriptionPlan } = useUserProfile();
  
  const tier = useMemo(() => getPlanTier(subscriptionPlan), [subscriptionPlan]);
  const allowedTimeframes = useMemo(() => {
    return PLANS_CONFIG.tiers[tier]?.study?.allowedTimeframes || ['1d'];
  }, [tier]);
  
  const isPaidUser = tier !== 'FREE';

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-1', className)}>
        {STUDY_TIMEFRAMES.map((tf) => {
          const isAllowed = allowedTimeframes.includes(tf.value);
          const isSelected = value === tf.value;
          
          if (!isAllowed) {
            return (
              <Tooltip key={tf.value}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size={size}
                    className={cn(
                      'relative opacity-50 cursor-not-allowed',
                      size === 'sm' ? 'h-7 px-2 text-xs' : 'h-9 px-3'
                    )}
                    disabled
                  >
                    {showLabels ? tf.label : tf.shortLabel}
                    <Lock className="h-3 w-3 ml-1 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">
                      Upgrade to access {tf.label} charts
                    </span>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          }
          
          return (
            <Button
              key={tf.value}
              variant={isSelected ? 'default' : 'outline'}
              size={size}
              className={cn(
                size === 'sm' ? 'h-7 px-2 text-xs' : 'h-9 px-3',
                isSelected && 'bg-primary text-primary-foreground'
              )}
              onClick={() => onChange(tf.value)}
            >
              {showLabels ? tf.label : tf.shortLabel}
            </Button>
          );
        })}
        
        {!isPaidUser && (
          <Badge variant="secondary" className="ml-2 text-sm gap-1">
            <Crown className="h-3 w-3 text-amber-500" />
            Upgrade for more
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Hook to get allowed timeframes for current user
 */
export function useStudyTimeframes() {
  const { subscriptionPlan } = useUserProfile();
  
  const tier = useMemo(() => getPlanTier(subscriptionPlan), [subscriptionPlan]);
  const allowedTimeframes = useMemo(() => {
    return PLANS_CONFIG.tiers[tier]?.study?.allowedTimeframes || ['1d'];
  }, [tier]);
  
  const isTimeframeAllowed = (timeframe: string) => allowedTimeframes.includes(timeframe);
  const isPaidUser = tier !== 'FREE';
  
  return {
    allowedTimeframes,
    isTimeframeAllowed,
    isPaidUser,
    tier,
  };
}

export default TimeframeSelector;
