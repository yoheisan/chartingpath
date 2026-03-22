import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, ArrowRight, Trophy } from "lucide-react";
import { PlanTier, TIER_DISPLAY } from "@/config/plans";
import { track } from "@/services/analytics";

export type UpsellTrigger = 
  | 'last_credit_used'
  | 'last_backtest'
  | 'alert_limit_hit'
  | 'last_free_generation';

interface PostActionUpsellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: UpsellTrigger;
  currentTier: PlanTier;
  /** What the user just completed */
  completedAction?: string;
}

const TRIGGER_COPY: Record<UpsellTrigger, { emoji: string; title: string; subtitle: string }> = {
  last_credit_used: {
    emoji: "⚡",
    title: "That was your last credit!",
    subtitle: "You've completed all your free analyses this month. Upgrade to keep going.",
  },
  last_backtest: {
    emoji: "📊",
    title: "Great backtest! Want more?",
    subtitle: "You've used your last free backtest. Unlock unlimited runs with a paid plan.",
  },
  alert_limit_hit: {
    emoji: "🔔",
    title: "Alert limit reached",
    subtitle: "You've set all the alerts your plan allows. Upgrade for more active alerts.",
  },
  last_free_generation: {
    emoji: "📜",
    title: "Script generated! Need more?",
    subtitle: "That was your last free generation. Upgrade for unlimited script exports.",
  },
};

export function PostActionUpsell({ open, onOpenChange, trigger, currentTier, completedAction }: PostActionUpsellProps) {
  const copy = TRIGGER_COPY[trigger];
  const nextTierKey = getNextTier(currentTier);
  const nextTier = TIER_DISPLAY[nextTierKey];

  if (open) {
    track('paywall_shown', {
      context: `post_action_${trigger}`,
      current_plan: currentTier,
      limit_type: trigger,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <div className="mx-auto mb-2 text-5xl">{copy.emoji}</div>
          <DialogTitle className="text-xl">{copy.title}</DialogTitle>
          <DialogDescription>{copy.subtitle}</DialogDescription>
        </DialogHeader>

        {completedAction && (
          <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mx-auto">
            <Trophy className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-emerald-600 dark:text-emerald-400">{completedAction}</span>
          </div>
        )}

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 mt-3">
          <p className="text-sm font-medium mb-1">
            Upgrade to {nextTier.name} — ${nextTier.monthlyPrice}/mo
          </p>
          <p className="text-xs text-muted-foreground">
            {nextTier.monthlyCredits} credits/mo • {nextTier.maxActiveAlerts} alerts • {nextTier.bestFor}
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-3">
          <Button
            asChild
            size="lg"
            onClick={() => {
              track('upgrade_clicked', { source: `post_action_${trigger}`, current_plan: currentTier } as any);
              onOpenChange(false);
            }}
          >
            <Link to="/pricing">
              <ArrowRight className="h-4 w-4 mr-2" />
              Upgrade Now
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Continue on {TIER_DISPLAY[currentTier].name}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getNextTier(current: PlanTier): PlanTier {
  const ladder: PlanTier[] = ['FREE', 'LITE', 'PLUS', 'PRO', 'ELITE'];
  const idx = ladder.indexOf(current);
  return ladder[Math.min(idx + 1, ladder.length - 1)];
}
