import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Check, Minus, Plus, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MasterPlan } from "@/hooks/useMasterPlan";

// ── All 15 patterns ChartingPath detects ──
const ALL_PATTERNS = [
  "Ascending Triangle",
  "Bear Flag",
  "Bull Flag",
  "Cup & Handle",
  "Descending Triangle",
  "Donchian Breakout Long",
  "Donchian Breakout Short",
  "Double Bottom",
  "Double Top",
  "Falling Wedge",
  "Head & Shoulders",
  "Inverse Head & Shoulders",
  "Rising Wedge",
  "Triple Bottom",
  "Triple Top",
] as const;

const DIRECTION_OPTIONS = [
  { value: "long_only", label: "Long only" },
  { value: "short_only", label: "Short only" },
  { value: "both", label: "Both" },
] as const;

const WINDOW_PRESETS = [
  { label: "Morning session 09:30–12:00", start: "09:30", end: "12:00" },
  { label: "Full day 09:30–16:00", start: "09:30", end: "16:00" },
] as const;

const EXCLUSION_OPTIONS = [
  "No overnight holds",
  "No earnings plays",
  "No crypto",
  "No forex",
  "No small caps under $2",
] as const;

interface TradingPlanBuilderProps {
  existingPlan?: MasterPlan | null;
  onSaved: () => void;
  onCancel: () => void;
  onSwitchToNL: () => void;
}

export function TradingPlanBuilder({ existingPlan, onSaved, onCancel, onSwitchToNL }: TradingPlanBuilderProps) {
  // Section 1 — Patterns
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  // Section 2 — Direction
  const [direction, setDirection] = useState<string>("both");
  // Section 3 — Risk
  const [riskPct, setRiskPct] = useState(2);
  // Section 4 — Position limits
  const [maxPositions, setMaxPositions] = useState(3);
  // Section 5 — Trading window
  const [windowStart, setWindowStart] = useState("09:30");
  const [windowEnd, setWindowEnd] = useState("16:00");
  const [activePreset, setActivePreset] = useState<string | null>("Full day 09:30–16:00");
  // Section 6 — Exclusions
  const [exclusions, setExclusions] = useState<string[]>([]);
  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill from existing plan
  useEffect(() => {
    if (!existingPlan) return;
    if (existingPlan.preferred_patterns?.length) {
      setSelectedPatterns(existingPlan.preferred_patterns);
    }
    if (existingPlan.trend_direction) {
      setDirection(existingPlan.trend_direction);
    }
    if (existingPlan.max_position_pct != null) {
      setRiskPct(existingPlan.max_position_pct);
    }
    if (existingPlan.max_open_positions != null) {
      setMaxPositions(existingPlan.max_open_positions);
    }
    if (existingPlan.trading_window_start) {
      setWindowStart(existingPlan.trading_window_start);
    }
    if (existingPlan.trading_window_end) {
      setWindowEnd(existingPlan.trading_window_end);
    }
    if (existingPlan.excluded_conditions?.length) {
      setExclusions(existingPlan.excluded_conditions);
    }
    // Check if window matches a preset
    const matchedPreset = WINDOW_PRESETS.find(
      p => p.start === existingPlan.trading_window_start && p.end === existingPlan.trading_window_end
    );
    setActivePreset(matchedPreset?.label ?? "Custom");
  }, [existingPlan]);

  const togglePattern = (p: string) => {
    setSelectedPatterns(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const toggleExclusion = (e: string) => {
    setExclusions(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  };

  const exampleRisk = useMemo(() => {
    const accountSize = 10000;
    return Math.round(accountSize * (riskPct / 100));
  }, [riskPct]);

  const summaryText = useMemo(() => {
    if (selectedPatterns.length === 0) return null;
    const pNames = selectedPatterns.length <= 3
      ? selectedPatterns.join(", ")
      : `${selectedPatterns.slice(0, 2).join(", ")} +${selectedPatterns.length - 2} more`;
    const dir = direction === "both" ? "" : ` ${direction.replace("_", " ")}`;
    const excl = exclusions.length > 0 ? ` Excluding: ${exclusions.join(", ")}.` : "";
    return `Copilot will paper-test ${pNames}${dir} setups, risking ${riskPct}% per trade, up to ${maxPositions} positions at a time, between ${windowStart} and ${windowEnd}.${excl}`;
  }, [selectedPatterns, direction, riskPct, maxPositions, windowStart, windowEnd, exclusions]);

  const canSave = selectedPatterns.length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Deactivate existing plans
      await supabase
        .from("master_plans" as any)
        .update({ is_active: false } as any)
        .eq("user_id", user.id)
        .eq("is_active", true);

      // Build the raw NL summary for the record
      const rawNl = `Patterns: ${selectedPatterns.join(", ")}. Direction: ${direction}. Risk: ${riskPct}%. Max positions: ${maxPositions}. Window: ${windowStart}–${windowEnd}.${exclusions.length ? ` Exclude: ${exclusions.join(", ")}.` : ""}`;

      const { error } = await supabase
        .from("master_plans" as any)
        .insert({
          user_id: user.id,
          is_active: true,
          raw_nl_input: rawNl,
          max_position_pct: riskPct,
          max_open_positions: maxPositions,
          trading_window_start: windowStart,
          trading_window_end: windowEnd,
          stop_loss_rule: "2R",
          excluded_conditions: exclusions,
          preferred_patterns: selectedPatterns,
          sector_filters: [],
          trend_direction: direction,
          min_market_cap: exclusions.includes("No small caps under $2") ? "$2" : null,
        } as any);

      if (error) throw error;

      window.dispatchEvent(new CustomEvent("mandate-saved"));
      toast.success("Trading plan saved — Copilot is now paper-testing it.");
      onSaved();
    } catch (err: any) {
      console.error("Save plan error:", err);
      toast.error(err.message || "Failed to save plan");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6 pb-8">
        {/* ── Section 1: Patterns ── */}
        <section className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Which patterns should Copilot watch for?</h4>
          <p className="text-xs text-muted-foreground">Select one or more. Copilot only paper-trades setups it detects from these patterns.</p>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setSelectedPatterns([...ALL_PATTERNS])}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Select all
            </button>
            <span className="text-muted-foreground/40 text-xs">·</span>
            <button
              onClick={() => setSelectedPatterns([])}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_PATTERNS.map(p => {
              const selected = selectedPatterns.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePattern(p)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all border",
                    selected
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-muted/40 border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  {selected && <Check className="h-3 w-3" />}
                  {p}
                </button>
              );
            })}
          </div>
          {selectedPatterns.length === 0 && (
            <p className="text-xs text-destructive">Select at least 1 pattern to continue</p>
          )}
        </section>

        {/* ── Section 2: Direction ── */}
        <section className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Trade direction</h4>
          <div className="flex gap-2">
            {DIRECTION_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDirection(opt.value)}
                className={cn(
                  "flex-1 py-2 rounded-md text-xs font-medium transition-all border text-center",
                  direction === opt.value
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-muted/40 border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Section 3: Risk per trade ── */}
        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">How much of your account per trade?</h4>
          <div className="px-1">
            <Slider
              value={[riskPct]}
              onValueChange={([v]) => setRiskPct(v)}
              min={0.5}
              max={10}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0.5%</span>
              <span className="font-semibold text-foreground">{riskPct}%</span>
              <span>10%</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            At {riskPct}% — a $10,000 account risks <span className="font-semibold text-foreground">${exampleRisk}</span> per trade
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">Stop loss</p>
              <p className="text-sm font-semibold text-foreground">2R (fixed)</p>
            </div>
            <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">Take profit</p>
              <p className="text-sm font-semibold text-foreground">3R (fixed)</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/70">Stop and target are fixed at 2R/3R — the system trails your stop automatically</p>
        </section>

        {/* ── Section 4: Position limits ── */}
        <section className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">How many trades at once?</h4>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMaxPositions(Math.max(1, maxPositions - 1))}
              className="h-8 w-8 rounded-md border border-border/50 bg-muted/40 flex items-center justify-center hover:bg-muted transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="text-lg font-semibold text-foreground w-8 text-center">{maxPositions}</span>
            <button
              onClick={() => setMaxPositions(Math.min(10, maxPositions + 1))}
              className="h-8 w-8 rounded-md border border-border/50 bg-muted/40 flex items-center justify-center hover:bg-muted transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Copilot will not open a new trade if {maxPositions} are already open
          </p>
        </section>

        {/* ── Section 5: Trading window ── */}
        <section className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">When should Copilot scan for trades?</h4>
          <p className="text-xs text-muted-foreground">Copilot only enters trades during this window. All open trades close at the end.</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {WINDOW_PRESETS.map(preset => (
              <button
                key={preset.label}
                onClick={() => {
                  setWindowStart(preset.start);
                  setWindowEnd(preset.end);
                  setActivePreset(preset.label);
                }}
                className={cn(
                  "px-2.5 py-1.5 rounded-md text-xs font-medium transition-all border",
                  activePreset === preset.label
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-muted/40 border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                {preset.label}
              </button>
            ))}
            <button
              onClick={() => setActivePreset("Custom")}
              className={cn(
                "px-2.5 py-1.5 rounded-md text-xs font-medium transition-all border",
                activePreset === "Custom"
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-muted/40 border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              Custom
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start time</label>
              <input
                type="time"
                value={windowStart}
                onChange={e => { setWindowStart(e.target.value); setActivePreset("Custom"); }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End time</label>
              <input
                type="time"
                value={windowEnd}
                onChange={e => { setWindowEnd(e.target.value); setActivePreset("Custom"); }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground/70">
            Trades opened during this window are automatically closed at {windowEnd} if still open
          </p>
        </section>

        {/* ── Section 6: Exclusions ── */}
        <section className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Anything Copilot should always avoid? <span className="font-normal text-muted-foreground">(optional)</span></h4>
          <p className="text-xs text-muted-foreground">These are the only exclusions the system can enforce.</p>
          <div className="flex flex-wrap gap-1.5">
            {EXCLUSION_OPTIONS.map(e => {
              const selected = exclusions.includes(e);
              return (
                <button
                  key={e}
                  onClick={() => toggleExclusion(e)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all border",
                    selected
                      ? "bg-destructive/10 border-destructive/30 text-destructive"
                      : "bg-muted/40 border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  {selected && <Check className="h-3 w-3" />}
                  {e}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Plan Summary ── */}
        {summaryText && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs font-medium text-primary mb-1">Your trading plan:</p>
            <p className="text-xs text-foreground/80 leading-relaxed">{summaryText}</p>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="space-y-2 pt-2">
          <Button
            className="w-full h-auto py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            onClick={handleSave}
            disabled={!canSave || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-2" />
            )}
            {existingPlan ? "Save changes" : "Start paper testing →"}
          </Button>
          <div className="flex justify-center gap-3">
            <button
              onClick={onSwitchToNL}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Type my plan instead
            </button>
            <span className="text-muted-foreground/40 text-xs">·</span>
            <button
              onClick={onCancel}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
