import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/hooks/useCredits";
import { track } from "@/services/analytics";

const DISMISS_KEY = 'upgrade_nudge_dismissed_at';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function DashboardUpgradeNudge() {
  const { user } = useAuth();
  const { planTier, isExhausted, loading } = useCredits();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < DISMISS_DURATION_MS) {
      setDismissed(true);
    } else {
      setDismissed(false);
    }
  }, []);

  // Track impression once when visible
  const shouldShow = !loading && !!user && planTier === 'FREE' && !dismissed;
  useEffect(() => {
    if (shouldShow) {
      track('paywall_shown', { context: 'dashboard_nudge', current_plan: planTier, limit_type: 'nudge' });
    }
  }, [shouldShow, planTier]);

  if (!shouldShow) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setDismissed(true);
    track('paywall_shown', { context: 'dashboard_nudge_dismissed', current_plan: planTier, limit_type: 'nudge' });
  };

  return (
    <div className="relative rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4 sm:p-5">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-md hover:bg-muted transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Unlock the full trading loop</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isExhausted
              ? "You've used all your free credits. Upgrade to keep scanning patterns, running backtests, and generating scripts."
              : "Get more credits, intraday timeframes, advanced patterns, and unlimited alerts with a paid plan."
            }
          </p>
        </div>

        <Button
          asChild
          size="sm"
          className="shrink-0"
          onClick={() => {
            track('upgrade_clicked', { source: 'dashboard_nudge', current_plan: planTier } as any);
          }}
        >
          <Link to="/pricing">
            See Plans <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
