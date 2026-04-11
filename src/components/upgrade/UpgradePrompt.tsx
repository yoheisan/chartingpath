import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Zap, ArrowRight, Check, TrendingUp } from "lucide-react";
import { TIER_DISPLAY, PlanTier } from "@/config/plans";
import { track } from "@/services/analytics";

export type UpgradeContext = 
  | 'credits_exhausted'
  | 'credits_low'
  | 'feature_gated'
  | 'alert_limit'
  | 'backtest_limit'
  | 'timeframe_gated'
  | 'dashboard_nudge';

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: PlanTier;
  context: UpgradeContext;
  featureLabel?: string;
  /** Remaining credits (for exhaustion context) */
  creditsRemaining?: number;
}

const CONTEXT_COPY: Record<UpgradeContext, { title: string; description: string; icon: React.ReactNode }> = {
  credits_exhausted: {
    title: "You've used all your credits",
    description: "Upgrade your plan to continue running analyses and unlock more powerful features.",
    icon: <Zap className="h-6 w-6 text-amber-500" />,
  },
  credits_low: {
    title: "Credits running low",
    description: "You're almost out of monthly credits. Upgrade to keep your workflow uninterrupted.",
    icon: <Zap className="h-6 w-6 text-amber-500" />,
  },
  feature_gated: {
    title: "Unlock this feature",
    description: "This feature requires a higher plan. Upgrade to access advanced tools.",
    icon: <TrendingUp className="h-6 w-6 text-primary" />,
  },
  alert_limit: {
    title: "Alert limit reached",
    description: "You've hit your plan's alert limit. Upgrade for more active alerts.",
    icon: <Zap className="h-6 w-6 text-amber-500" />,
  },
  backtest_limit: {
    title: "Backtest limit reached",
    description: "You've used your daily backtests. Upgrade for more runs and deeper analysis.",
    icon: <TrendingUp className="h-6 w-6 text-primary" />,
  },
  timeframe_gated: {
    title: "Unlock more timeframes",
    description: "Intraday timeframes are available on higher plans. Upgrade to analyze shorter intervals.",
    icon: <TrendingUp className="h-6 w-6 text-primary" />,
  },
  dashboard_nudge: {
    title: "Get more from ChartingPath",
    description: "Upgrade to unlock advanced pattern scanning, more alerts, and deeper backtesting.",
    icon: <TrendingUp className="h-6 w-6 text-primary" />,
  },
};

// Determine next recommended tier
function getNextTier(current: PlanTier): PlanTier {
  const ladder: PlanTier[] = ['FREE', 'LITE', 'PRO', 'ELITE'];
  const idx = ladder.indexOf(current);
  return ladder[Math.min(idx + 1, ladder.length - 1)];
}

export function UpgradePrompt({ 
  open, onOpenChange, currentTier, context, featureLabel, creditsRemaining 
}: UpgradePromptProps) {
  const copy = CONTEXT_COPY[context];
  const nextTier = getNextTier(currentTier);
  const nextInfo = TIER_DISPLAY[nextTier];
  const currentInfo = TIER_DISPLAY[currentTier];

  // Track impression
  if (open) {
    track('paywall_shown', {
      context,
      current_plan: currentTier,
      limit_type: context,
    });
  }

  const featureCompare = [
    { label: 'Monthly credits', current: `${currentInfo.monthlyCredits}`, next: `${nextInfo.monthlyCredits}` },
    { label: 'Active alerts', current: `${currentInfo.maxActiveAlerts}`, next: `${nextInfo.maxActiveAlerts}` },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            {copy.icon}
          </div>
          <DialogTitle className="text-center text-xl">
            {featureLabel ? `Upgrade to access ${featureLabel}` : copy.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {copy.description}
          </DialogDescription>
        </DialogHeader>

        {creditsRemaining !== undefined && context === 'credits_exhausted' && (
          <div className="text-center py-2">
            <span className="text-3xl font-bold text-destructive">0</span>
            <span className="text-sm text-muted-foreground ml-1">credits remaining</span>
          </div>
        )}

        {/* Plan comparison */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-lg border border-border/50 p-4 bg-muted/30">
            <Badge variant="outline" className="mb-2">{currentInfo.name}</Badge>
            <p className="text-xs text-muted-foreground mb-3">Current plan</p>
            {featureCompare.map(f => (
              <div key={f.label} className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">{f.label}</span>
                <span>{f.current}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg border-2 border-primary/50 p-4 bg-primary/5">
            <Badge className="mb-2 bg-primary">{nextInfo.name}</Badge>
            <p className="text-xs text-muted-foreground mb-3">
              ${nextInfo.monthlyPrice}/mo
            </p>
            {featureCompare.map(f => (
              <div key={f.label} className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="font-semibold text-primary">{f.next}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <Button asChild size="lg" onClick={() => {
            track('upgrade_clicked', { source: context, current_plan: currentTier } as any);
            onOpenChange(false);
          }}>
            <Link to="/pricing">
              <ArrowRight className="h-4 w-4 mr-2" />
              View All Plans
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
