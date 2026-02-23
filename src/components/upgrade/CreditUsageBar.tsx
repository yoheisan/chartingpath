import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { UpgradePrompt, UpgradeContext } from "./UpgradePrompt";
import { useCredits } from "@/hooks/useCredits";
import { track } from "@/services/analytics";

interface CreditUsageBarProps {
  /** Compact mode for sidebars/headers */
  compact?: boolean;
  className?: string;
}

export function CreditUsageBar({ compact = false, className = "" }: CreditUsageBarProps) {
  const { balance, monthlyAllocation, planTier, planName, usagePercent, isLow, isExhausted, loading } = useCredits();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (loading) return null;

  const upgradeContext: UpgradeContext = isExhausted ? 'credits_exhausted' : 'credits_low';
  const progressValue = Math.max(0, Math.min(100, usagePercent));
  const progressColor = isExhausted ? 'bg-destructive' : isLow ? 'bg-amber-500' : 'bg-primary';

  if (compact) {
    return (
      <>
        <button
          onClick={() => {
            if (isLow || isExhausted) {
              track('paywall_shown', { context: upgradeContext, current_plan: planTier, limit_type: 'credits' });
              setShowUpgrade(true);
            }
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 bg-card/50 hover:bg-card transition-colors ${className}`}
        >
          <Zap className={`h-4 w-4 ${isExhausted ? 'text-destructive' : isLow ? 'text-amber-500' : 'text-primary'}`} />
          <span className="text-sm font-semibold tabular-nums">{balance}</span>
          <span className="text-xs text-muted-foreground">credits</span>
          {isExhausted && <AlertTriangle className="h-3 w-3 text-destructive" />}
        </button>
        <UpgradePrompt
          open={showUpgrade}
          onOpenChange={setShowUpgrade}
          currentTier={planTier}
          context={upgradeContext}
          creditsRemaining={balance}
        />
      </>
    );
  }

  return (
    <>
      <div className={`rounded-xl border border-border/50 bg-card/80 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className={`h-5 w-5 ${isExhausted ? 'text-destructive' : isLow ? 'text-amber-500' : 'text-primary'}`} />
            <span className="font-semibold">Credits</span>
            <Badge variant="outline" className="text-xs capitalize">{planName}</Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{balance}</span>
            {' / '}{monthlyAllocation}
          </span>
        </div>

        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${progressValue}%` }}
          />
        </div>

        {(isLow || isExhausted) && (
          <div className="flex items-center justify-between mt-3">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              {isExhausted ? "No credits remaining" : "Credits running low"}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                track('paywall_shown', { context: upgradeContext, current_plan: planTier, limit_type: 'credits' });
                setShowUpgrade(true);
              }}
            >
              Upgrade
            </Button>
          </div>
        )}
      </div>

      <UpgradePrompt
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        currentTier={planTier}
        context={upgradeContext}
        creditsRemaining={balance}
      />
    </>
  );
}
