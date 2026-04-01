import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sunrise, TrendingUp, TrendingDown, AlertTriangle, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { CopilotAlert } from "@/hooks/useCopilotAlerts";

interface MorningBriefContext {
  headline: string;
  positions: { symbol: string; note: string; pnl_r: number; status: "watch" | "ok" }[];
  setups: { symbol: string; pattern_type: string; timeframe: string; direction: string; rr_ratio: number; note: string }[];
  watch: { symbol: string; note: string; proximity: "near_tp" | "near_sl" }[];
}

interface MorningBriefCardProps {
  alert: CopilotAlert;
  onAutoEnterAll: (setups: MorningBriefContext["setups"], alertId: string) => void;
  onReviewOneByOne: (setups: MorningBriefContext["setups"], alertId: string) => void;
  onSkip: (alertId: string) => void;
}

export function MorningBriefCard({ alert, onAutoEnterAll, onReviewOneByOne, onSkip }: MorningBriefCardProps) {
  const { t } = useTranslation();
  const ctx = alert.full_context as unknown as MorningBriefContext | null;
  const [acting, setActing] = useState(false);

  if (!ctx) return null;

  const todayStr = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  return (
    <Card className="border-t-2 border-t-accent overflow-hidden animate-in slide-in-from-top-3 fade-in-0 duration-300 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <Sunrise className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold">{t("copilot.morningBrief.title", "Morning Brief")}</span>
          <span className="text-xs text-muted-foreground">{todayStr}</span>
        </div>
        <button
          onClick={() => onSkip(alert.id)}
          className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Headline */}
      <p className="px-3 pb-2 text-sm text-foreground/90 leading-relaxed">{ctx.headline}</p>

      {/* Positions section */}
      {ctx.positions && ctx.positions.length > 0 && (
        <div className="border-t border-border/40 px-3 py-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {t("copilot.morningBrief.positions", "Your Positions")}
          </div>
          <div className="space-y-1">
            {ctx.positions.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{p.symbol}</span>
                  <span className="text-xs text-muted-foreground">{p.note}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-semibold tabular-nums text-xs",
                    p.pnl_r > 0 ? "text-emerald-500" : p.pnl_r < 0 ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {p.pnl_r >= 0 ? "+" : ""}{p.pnl_r.toFixed(1)}R
                  </span>
                  {p.status === "watch" ? (
                    <Badge variant="outline" className="text-[10px] h-4 px-1 border-amber-500/40 text-amber-600">
                      <Eye className="h-2.5 w-2.5 mr-0.5" /> watch
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">● ok</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New setups section */}
      {ctx.setups && ctx.setups.length > 0 && (
        <div className="border-t border-border/40 px-3 py-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {t("copilot.morningBrief.newSetups", "New Setups")}
          </div>
          <div className="space-y-1">
            {ctx.setups.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium">{s.symbol}</span>
                  <span className="text-xs text-muted-foreground truncate">{s.pattern_type}</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1">{s.timeframe}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(
                    "text-[10px] h-4 px-1",
                    s.direction === "long" ? "text-emerald-600 border-emerald-500/40" : "text-red-600 border-red-500/40"
                  )}>
                    {s.direction === "long" ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                    {s.direction}
                  </Badge>
                  <span className="text-xs font-medium tabular-nums">R:R {s.rr_ratio.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Watch section */}
      {ctx.watch && ctx.watch.length > 0 && (
        <div className="border-t border-border/40 px-3 py-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {t("copilot.morningBrief.watch", "Watch")}
          </div>
          <div className="space-y-1">
            {ctx.watch.map((w, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn("h-3 w-3", w.proximity === "near_sl" ? "text-amber-500" : "text-emerald-500")} />
                  <span className="font-medium">{w.symbol}</span>
                </div>
                <span className={cn(
                  "text-xs",
                  w.proximity === "near_sl" ? "text-amber-600" : "text-emerald-600"
                )}>
                  {w.note}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="border-t border-border/40 px-3 py-2.5 flex items-center gap-2">
        {ctx.setups && ctx.setups.length > 0 && (
          <>
            <Button
              size="sm"
              className="h-7 text-xs bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={acting}
              onClick={() => {
                setActing(true);
                onAutoEnterAll(ctx.setups, alert.id);
              }}
            >
              {t("copilot.morningBrief.autoEnter", "Auto-enter all setups")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={acting}
              onClick={() => {
                setActing(true);
                onReviewOneByOne(ctx.setups, alert.id);
              }}
            >
              {t("copilot.morningBrief.reviewOne", "Review one by one")}
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          disabled={acting}
          onClick={() => onSkip(alert.id)}
        >
          {t("copilot.morningBrief.skip", "Skip")}
        </Button>
      </div>
    </Card>
  );
}
