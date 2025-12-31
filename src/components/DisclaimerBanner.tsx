import { Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DISCLAIMERS } from "@/constants/disclaimers";

interface DisclaimerBannerProps {
  variant?: 'compact' | 'full' | 'inline';
  className?: string;
}

/**
 * Reusable disclaimer banner for compliance.
 * Used on: Project artifacts, Backtest results, Alerts, Exports
 */
export const DisclaimerBanner = ({ 
  variant = 'compact',
  className 
}: DisclaimerBannerProps) => {
  if (variant === 'inline') {
    return (
      <p className={cn(
        "text-xs text-muted-foreground flex items-center gap-1.5",
        className
      )}>
        <Shield className="h-3 w-3 shrink-0" />
        <span>{DISCLAIMERS.SHORT}</span>
      </p>
    );
  }

  if (variant === 'full') {
    return (
      <div className={cn(
        "p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg",
        className
      )}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-sm space-y-2">
            <p className="font-medium text-amber-700 dark:text-amber-400">
              Important Disclaimer
            </p>
            <p className="text-muted-foreground whitespace-pre-line">
              {DISCLAIMERS.LONG}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default: compact
  return (
    <div className={cn(
      "flex items-start gap-3 p-4 bg-muted/50 rounded-lg border border-border/50",
      className
    )}>
      <Shield className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
      <p className="text-sm text-muted-foreground">
        <strong>Disclaimer:</strong> {DISCLAIMERS.SHORT.replace('⚠️ ', '')}
      </p>
    </div>
  );
};

export default DisclaimerBanner;
