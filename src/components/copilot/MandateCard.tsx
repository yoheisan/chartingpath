import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { type MandateRule } from "@/hooks/useMasterPlan";
import { useTradingCopilotContext } from "./TradingCopilotContext";

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
}

export function MandateCard({ onFocusNLBar, rules, hasPlan }: MandateCardProps) {
  const copilot = useTradingCopilotContext();
  const displayRules = rules && rules.length > 0 ? rules : FALLBACK_RULES;
  const hasMandate = hasPlan !== undefined ? hasPlan : true;

  const openCopilot = (prefill?: string) => {
    if (prefill) {
      copilot.openWithContext(prefill);
    } else {
      copilot.openPlanBuilder();
    }
  };

  return (
    <Card className="rounded-lg border-border/60 bg-card">
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Master Plan
        </span>
        <button
          onClick={() => openCopilot()}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Edit
        </button>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        {hasMandate ? (
          <>
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
