import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { type MandateRule, type MasterPlan } from "@/hooks/useMasterPlan";
import { useTradingCopilotContext } from "./TradingCopilotContext";
import { ChevronDown, Plus, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const FALLBACK_RULES: MandateRule[] = [
  { label: "3%", detail: "max per trade" },
  { label: "6", detail: "max open positions" },
  { label: "9:30–11:30", detail: "trading window" },
  { label: "2R", detail: "stop loss always" },
  { label: "No overnight", detail: "holds" },
  { label: "Breakouts", detail: "preferred pattern" },
];

interface MandateCardProps {
  onFocusNLBar?: (prefill?: string) => void;
  rules?: MandateRule[];
  hasPlan?: boolean;
  plans?: MasterPlan[];
  selectedPlanId?: string | null;
  onSelectPlan?: (planId: string) => void;
  onNewPlan?: () => void;
  canCreateMore?: boolean;
}

export function MandateCard({
  onFocusNLBar,
  rules,
  hasPlan,
  plans = [],
  selectedPlanId,
  onSelectPlan,
  onNewPlan,
  canCreateMore = true,
}: MandateCardProps) {
  const copilot = useTradingCopilotContext();
  const displayRules = rules && rules.length > 0 ? rules : FALLBACK_RULES;
  const hasMandate = hasPlan !== undefined ? hasPlan : true;
  const [showSelector, setShowSelector] = useState(false);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const openCopilot = (prefill?: string) => {
    if (prefill) {
      copilot.openWithContext(prefill);
    } else {
      copilot.openPlanBuilder();
    }
  };

  const handleNewPlan = () => {
    copilot.openNewPlanBuilder();
  };

  return (
    <Card className="rounded-lg border-border/60 bg-card">
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Master Plan
          </span>
          {plans.length > 1 && (
            <button
              onClick={() => setShowSelector(!showSelector)}
              className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors ml-1 truncate max-w-[100px]"
            >
              <span className="truncate">{selectedPlan?.name || "Select"}</span>
              <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", showSelector && "rotate-180")} />
            </button>
          )}
        </div>
        <button
          onClick={() => openCopilot()}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Edit
        </button>
      </CardHeader>

      {/* Plan selector dropdown */}
      {showSelector && plans.length > 1 && (
        <div className="px-3 pb-2 space-y-1">
          {plans.map(p => (
            <button
              key={p.id}
              onClick={() => {
                onSelectPlan?.(p.id);
                setShowSelector(false);
              }}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors",
                p.id === selectedPlanId
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {p.name || "Untitled Plan"}
            </button>
          ))}
          <button
            onClick={() => {
              setShowSelector(false);
              if (canCreateMore) {
                onNewPlan?.();
              }
            }}
            className={cn(
              "w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1",
              canCreateMore
                ? "text-primary/70 hover:text-primary hover:bg-primary/5"
                : "text-muted-foreground/50 cursor-not-allowed"
            )}
          >
            {canCreateMore ? (
              <Plus className="h-3 w-3" />
            ) : (
              <Lock className="h-3 w-3" />
            )}
            {canCreateMore ? "New plan" : "Upgrade for more plans"}
          </button>
        </div>
      )}

      <CardContent className="p-3 pt-0 space-y-3">
        {hasMandate ? (
          <>
            {/* Show selected plan name as a label if multiple plans */}
            {plans.length > 0 && selectedPlan && plans.length <= 1 && (
              <p className="text-xs text-muted-foreground truncate">{selectedPlan.name}</p>
            )}
            <div className="flex flex-wrap gap-1">
              {displayRules.map((rule) => (
                <button
                  key={rule.label}
                  onClick={() => openCopilot(`${rule.label} ${rule.detail}`)}
                  className="inline-flex items-center gap-1 rounded-md border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-sm text-blue-300 hover:bg-blue-500/20 transition-colors"
                >
                  <span className="font-mono font-bold text-blue-400">[{rule.label}]</span>
                  <span className="text-muted-foreground truncate">{rule.detail}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
          </>
        ) : (
          <button
            onClick={() => openCopilot()}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Set your mandate to start →
          </button>
        )}
      </CardContent>
    </Card>
  );
}
