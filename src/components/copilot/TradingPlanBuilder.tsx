import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Check, Minus, Plus, ChevronRight, Loader2, ChevronDown, Settings2, Globe, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { MasterPlan, AssetTradingSchedule, TradingSchedules } from "@/hooks/useMasterPlan";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// G10 major FX pairs — reliable price feeds
const G10_MAJORS = new Set([
  "EURUSD=X", "GBPUSD=X", "USDJPY=X", "AUDUSD=X",
  "USDCAD=X", "NZDUSD=X", "USDCHF=X", "EURGBP=X",
  "EURJPY=X", "GBPJPY=X",
]);

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

const EXCLUSION_OPTIONS = [
  "No overnight holds",
  "No earnings plays",
  "No small caps under $2",
] as const;

const MTF_TIMEFRAME_OPTIONS = [
  { value: "15m", label: "15M" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "Daily" },
  { value: "1w", label: "Weekly" },
] as const;

const ASSET_CLASS_OPTIONS = [
  { value: "stocks", label: "Stocks" },
  { value: "forex", label: "Forex" },
  { value: "crypto", label: "Crypto" },
  { value: "commodities", label: "Commodities" },
  { value: "indices", label: "Indices" },
  { value: "etfs", label: "ETFs" },
] as const;

const STOCK_EXCHANGE_OPTIONS = [
  "NYSE", "NASDAQ", "S&P 500", "Russell 2000", "LSE", "TSX",
] as const;

const FX_CATEGORY_OPTIONS = [
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
  { value: "exotic", label: "Exotic" },
] as const;

const CRYPTO_CATEGORY_OPTIONS = [
  { value: "major", label: "Major (Top 10)" },
  { value: "alt", label: "Altcoins" },
] as const;

const TREND_CONTEXT_OPTIONS = [
  { value: "any", label: "Any", desc: "No filter" },
  { value: "with_trend", label: "With trend only", desc: "Higher win rate" },
  { value: "counter_trend", label: "Allow counter", desc: "More setups" },
] as const;

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun", short: "S" },
  { value: 1, label: "Mon", short: "M" },
  { value: 2, label: "Tue", short: "T" },
  { value: 3, label: "Wed", short: "W" },
  { value: 4, label: "Thu", short: "T" },
  { value: 5, label: "Fri", short: "F" },
  { value: 6, label: "Sat", short: "S" },
] as const;

const TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central Europe (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Europe/Zurich", label: "Zurich (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Pacific/Auckland", label: "Auckland (NZST)" },
  { value: "UTC", label: "UTC" },
] as const;

// Assets that naturally trade 24/7 or near 24/7
const ALWAYS_AVAILABLE_ASSETS = new Set(["crypto", "forex"]);

const DEFAULT_SCHEDULE: AssetTradingSchedule = {
  is_247: false,
  days: [1, 2, 3, 4, 5], // Mon-Fri
  start: "09:30",
  end: "16:00",
};

const DEFAULT_247_SCHEDULE: AssetTradingSchedule = {
  is_247: true,
  days: [0, 1, 2, 3, 4, 5, 6],
  start: null,
  end: null,
};

interface TradingPlanBuilderProps {
  existingPlan?: MasterPlan | null;
  onSaved: () => void;
  onCancel: () => void;
  onSwitchToNL: () => void;
  isNewPlan?: boolean;
  plans?: MasterPlan[];
  onSelectPlan?: (id: string) => void;
}

export function TradingPlanBuilder({ existingPlan, onSaved, onCancel, onSwitchToNL, isNewPlan, plans, onSelectPlan }: TradingPlanBuilderProps) {
  // Plan name
  const [planName, setPlanName] = useState("My Trading Plan");
  // Section 1 — Patterns
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  // Section 2 — Direction
  const [direction, setDirection] = useState<string>("both");
  // Section 3 — Risk
  const [riskPct, setRiskPct] = useState(2);
  // Section 4 — Position limits
  const [maxPositions, setMaxPositions] = useState(3);
  // Section 5 — Trading window
  const [timezone, setTimezone] = useState("America/New_York");
  const [tradingSchedules, setTradingSchedules] = useState<TradingSchedules>({});
  // Legacy fallback (used when no asset classes selected)
  const [windowStart, setWindowStart] = useState("09:30");
  const [windowEnd, setWindowEnd] = useState("16:00");
  const [is24hTrading, setIs24hTrading] = useState(false);
  // Instrument universe
  const [assetClasses, setAssetClasses] = useState<string[]>([]);
  const [stockExchanges, setStockExchanges] = useState<string[]>([]);
  const [fxCategories, setFxCategories] = useState<string[]>([]);
  const [cryptoCategories, setCryptoCategories] = useState<string[]>([]);
  // Section 6 — Exclusions
  const [exclusions, setExclusions] = useState<string[]>([]);
  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mtfTimeframes, setMtfTimeframes] = useState<string[]>([]);
  const [mtfMinAligned, setMtfMinAligned] = useState(2);
  const [minAgentScore, setMinAgentScore] = useState(70);
  const [agentScoreEnabled, setAgentScoreEnabled] = useState(false);
  const [trendContext, setTrendContext] = useState("any");
  const [confluenceEnabled, setConfluenceEnabled] = useState(false);
  const [minConfluence, setMinConfluence] = useState(60);
  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill from existing plan (reset all fields first to avoid stale state when switching plans)
  useEffect(() => {
    if (!existingPlan) return;
    // Reset all fields to defaults, then apply existing plan values
    setPlanName((existingPlan as any).name ?? "My Trading Plan");
    setSelectedPatterns(existingPlan.preferred_patterns ?? []);
    setDirection(existingPlan.trend_direction ?? "both");
    setRiskPct(existingPlan.max_position_pct ?? 1);
    setMaxPositions(existingPlan.max_open_positions ?? 3);
    setTimezone(existingPlan.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
    setWindowStart(existingPlan.trading_window_start ?? "");
    setWindowEnd(existingPlan.trading_window_end ?? "");
    setIs24hTrading(existingPlan.trading_window_start === "00:00" && existingPlan.trading_window_end === "23:59");
    setTradingSchedules(
      existingPlan.trading_schedules && Object.keys(existingPlan.trading_schedules).length > 0
        ? existingPlan.trading_schedules
        : {}
    );
    setExclusions(existingPlan.excluded_conditions ?? []);
    // Advanced settings
    const hasMtf = (existingPlan.mtf_required_timeframes?.length ?? 0) > 0;
    const hasAgent = existingPlan.min_agent_score != null;
    const hasTrend = existingPlan.trend_context_filter != null && existingPlan.trend_context_filter !== "any";
    const hasConfl = existingPlan.min_confluence_score != null;
    setMtfTimeframes(existingPlan.mtf_required_timeframes ?? []);
    setMtfMinAligned(existingPlan.mtf_min_aligned ?? 2);
    setMinAgentScore(existingPlan.min_agent_score ?? 65);
    setAgentScoreEnabled(hasAgent);
    setTrendContext(existingPlan.trend_context_filter ?? "any");
    setMinConfluence(existingPlan.min_confluence_score ?? 60);
    setConfluenceEnabled(hasConfl);
    setShowAdvanced(hasMtf || hasAgent || hasTrend || hasConfl);
    // Instrument universe
    setAssetClasses(existingPlan.asset_classes ?? []);
    setStockExchanges(existingPlan.stock_exchanges ?? []);
    setFxCategories(existingPlan.fx_categories ?? []);
    setCryptoCategories(existingPlan.crypto_categories ?? []);
  }, [existingPlan]);

  const togglePattern = (p: string) => {
    setSelectedPatterns(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const toggleExclusion = (e: string) => {
    setExclusions(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  };

  const toggleMtfTimeframe = (tf: string) => {
    setMtfTimeframes(prev => prev.includes(tf) ? prev.filter(x => x !== tf) : [...prev, tf]);
  };

  const toggleAssetClass = (ac: string) => {
    setAssetClasses(prev => {
      const next = prev.includes(ac) ? prev.filter(x => x !== ac) : [...prev, ac];
      // Clear sub-filters when asset class removed
      if (!next.includes("stocks")) setStockExchanges([]);
      if (!next.includes("forex")) setFxCategories([]);
      if (!next.includes("crypto")) setCryptoCategories([]);
      // Auto-create schedule for newly added asset class
      if (!prev.includes(ac) && next.includes(ac)) {
        setTradingSchedules(s => ({
          ...s,
          [ac]: ALWAYS_AVAILABLE_ASSETS.has(ac) ? { ...DEFAULT_247_SCHEDULE } : { ...DEFAULT_SCHEDULE },
        }));
      }
      // Remove schedule when asset class removed
      if (prev.includes(ac) && !next.includes(ac)) {
        setTradingSchedules(s => {
          const copy = { ...s };
          delete copy[ac];
          return copy;
        });
      }
      return next;
    });
  };

  const toggleStockExchange = (ex: string) => {
    setStockExchanges(prev => prev.includes(ex) ? prev.filter(x => x !== ex) : [...prev, ex]);
  };

  const toggleFxCategory = (cat: string) => {
    setFxCategories(prev => prev.includes(cat) ? prev.filter(x => x !== cat) : [...prev, cat]);
  };

  const toggleCryptoCategory = (cat: string) => {
    setCryptoCategories(prev => prev.includes(cat) ? prev.filter(x => x !== cat) : [...prev, cat]);
  };

  const updateSchedule = (asset: string, updates: Partial<AssetTradingSchedule>) => {
    setTradingSchedules(prev => ({
      ...prev,
      [asset]: { ...(prev[asset] || DEFAULT_SCHEDULE), ...updates },
    }));
  };

  const toggleScheduleDay = (asset: string, day: number) => {
    setTradingSchedules(prev => {
      const current = prev[asset] || DEFAULT_SCHEDULE;
      const days = current.days.includes(day)
        ? current.days.filter(d => d !== day)
        : [...current.days, day].sort();
      return { ...prev, [asset]: { ...current, days } };
    });
  };

  const exampleRisk = useMemo(() => {
    const accountSize = 10000;
    return Math.round(accountSize * (riskPct / 100));
  }, [riskPct]);

  const hasAdvancedSettings = mtfTimeframes.length > 0 || agentScoreEnabled || trendContext !== "any" || confluenceEnabled;

  const summaryText = useMemo(() => {
    if (selectedPatterns.length === 0) return null;
    const pNames = selectedPatterns.length <= 3
      ? selectedPatterns.join(", ")
      : `${selectedPatterns.slice(0, 2).join(", ")} +${selectedPatterns.length - 2} more`;
    const dir = direction === "both" ? "" : ` ${direction.replace("_", " ")}`;
    const excl = exclusions.length > 0 ? ` Excluding: ${exclusions.join(", ")}.` : "";
    let adv = "";
    if (mtfTimeframes.length > 0) {
      adv += ` MTF: ${mtfMinAligned}/${mtfTimeframes.length} timeframes must align.`;
    }
    if (agentScoreEnabled) {
      adv += ` Agent score ≥${minAgentScore}.`;
    }
    if (trendContext !== "any") {
      adv += ` ${trendContext.replace("_", " ")} setups only.`;
    }
    if (confluenceEnabled) {
      adv += ` Confluence ≥${minConfluence}%.`;
    }
    let universe = "";
    if (assetClasses.length > 0) {
      const parts = assetClasses.map(a => a.charAt(0).toUpperCase() + a.slice(1));
      universe = ` Universe: ${parts.join(", ")}.`;
      if (stockExchanges.length) universe += ` Exchanges: ${stockExchanges.join(", ")}.`;
      if (fxCategories.length) universe += ` FX: ${fxCategories.join(", ")}.`;
      if (cryptoCategories.length) universe += ` Crypto: ${cryptoCategories.join(", ")}.`;
    }
    const tzLabel = TIMEZONE_OPTIONS.find(t => t.value === timezone)?.label || timezone;
    const windowInfo = assetClasses.length > 0
      ? ` Per-asset schedules in ${tzLabel}.`
      : ` Trading ${windowStart}–${windowEnd} ${tzLabel}.`;
    return `Copilot will paper-test ${pNames}${dir} setups, risking ${riskPct}% per trade, up to ${maxPositions} positions at a time.${windowInfo}${excl}${adv}${universe}`;
  }, [selectedPatterns, direction, riskPct, maxPositions, windowStart, windowEnd, exclusions, mtfTimeframes, mtfMinAligned, agentScoreEnabled, minAgentScore, trendContext, confluenceEnabled, minConfluence, assetClasses, stockExchanges, fxCategories, cryptoCategories, timezone]);

  const canSave = selectedPatterns.length > 0;

  // Detect if the plan includes exotic FX
  const hasExoticFx = assetClasses.includes("forex") && fxCategories.includes("exotic");

  const [showExoticConfirm, setShowExoticConfirm] = useState(false);

  const handleSaveClick = () => {
    if (!canSave) return;
    if (hasExoticFx) {
      setShowExoticConfirm(true);
      return;
    }
    performSave();
  };

  const handleRemoveExoticAndSave = () => {
    setFxCategories(prev => prev.filter(c => c !== "exotic"));
    setShowExoticConfirm(false);
    // Save after state update via setTimeout
    setTimeout(() => performSave(), 0);
  };

  const handleContinueWithExotic = () => {
    setShowExoticConfirm(false);
    performSave();
  };

  const performSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const rawNl = `Patterns: ${selectedPatterns.join(", ")}. Direction: ${direction}. Risk: ${riskPct}%. Max positions: ${maxPositions}. Timezone: ${timezone}.${exclusions.length ? ` Exclude: ${exclusions.join(", ")}.` : ""}${mtfTimeframes.length ? ` MTF: ${mtfMinAligned}/${mtfTimeframes.length} aligned.` : ""}${agentScoreEnabled ? ` Agent≥${minAgentScore}.` : ""}${trendContext !== "any" ? ` ${trendContext}.` : ""}${confluenceEnabled ? ` Confluence≥${minConfluence}%.` : ""}${assetClasses.length ? ` Universe: ${assetClasses.join(", ")}.` : ""}`;

      // Determine effective window from schedules or fallback
      const hasSchedules = assetClasses.length > 0 && Object.keys(tradingSchedules).length > 0;

      const planData = {
        user_id: user.id,
        is_active: true,
        name: planName,
        raw_nl_input: rawNl,
        max_position_pct: riskPct,
        max_open_positions: maxPositions,
        trading_window_start: hasSchedules ? null : (is24hTrading ? "00:00" : windowStart),
        trading_window_end: hasSchedules ? null : (is24hTrading ? "23:59" : windowEnd),
        timezone,
        stop_loss_rule: "2R",
        excluded_conditions: exclusions,
        preferred_patterns: selectedPatterns,
        sector_filters: [],
        trend_direction: direction,
        min_market_cap: exclusions.includes("No small caps under $2") ? "$2" : null,
        mtf_required_timeframes: mtfTimeframes.length > 0 ? mtfTimeframes : [],
        mtf_min_aligned: mtfTimeframes.length > 0 ? mtfMinAligned : null,
        min_agent_score: agentScoreEnabled ? minAgentScore : null,
        trend_context_filter: trendContext,
        min_confluence_score: confluenceEnabled ? minConfluence : null,
        asset_classes: assetClasses,
        fx_categories: fxCategories,
        crypto_categories: cryptoCategories,
        stock_exchanges: stockExchanges,
        trading_schedules: hasSchedules ? tradingSchedules : {},
      } as any;

      let error;
      if (existingPlan && !isNewPlan) {
        ({ error } = await supabase
          .from("master_plans" as any)
          .update(planData)
          .eq("id", existingPlan.id));
      } else {
        ({ error } = await supabase
          .from("master_plans" as any)
          .insert(planData));
      }

      if (error) throw error;

      window.dispatchEvent(new CustomEvent("mandate-saved"));
      toast.success(existingPlan && !isNewPlan ? "Trading plan updated." : "Trading plan created — Copilot is now paper-testing it.");
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
        {/* ── Plan Name / Plan Selector ── */}
        <section className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Plan name</h4>
          {!isNewPlan && plans && plans.length > 1 ? (
            <select
              value={existingPlan?.id ?? ''}
              onChange={e => {
                if (onSelectPlan) onSelectPlan(e.target.value);
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {plans.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={planName}
              onChange={e => setPlanName(e.target.value)}
              placeholder="e.g. Momentum Breakouts, Swing Longs"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
              maxLength={60}
            />
          )}
        </section>

        {/* ── Instrument Universe ── */}
        <section className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">What markets should Copilot trade? <span className="font-normal text-muted-foreground">(optional)</span></h4>
          <p className="text-xs text-muted-foreground">Leave empty for all assets. Select specific asset classes to narrow the scan universe.</p>
          <div className="flex flex-wrap gap-1.5">
            {ASSET_CLASS_OPTIONS.map(ac => {
              const selected = assetClasses.includes(ac.value);
              return (
                <button
                  key={ac.value}
                  onClick={() => toggleAssetClass(ac.value)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all border",
                    selected
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-muted/40 border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  {selected && <Check className="h-3 w-3" />}
                  {ac.label}
                </button>
              );
            })}
          </div>

          {/* Sub-filters for Stocks */}
          {assetClasses.includes("stocks") && (
            <div className="ml-2 pl-3 border-l-2 border-primary/20 space-y-1.5">
              <p className="text-sm text-muted-foreground font-medium">Stock exchanges</p>
              <div className="flex flex-wrap gap-1.5">
                {STOCK_EXCHANGE_OPTIONS.map(ex => {
                  const selected = stockExchanges.includes(ex);
                  return (
                    <button
                      key={ex}
                      onClick={() => toggleStockExchange(ex)}
                      className={cn(
                        "px-2 py-1 rounded-md text-sm font-medium transition-all border",
                        selected
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {selected && <Check className="h-2.5 w-2.5 mr-0.5 inline" />}
                      {ex}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-filters for Forex */}
          {assetClasses.includes("forex") && (
            <div className="ml-2 pl-3 border-l-2 border-primary/20 space-y-1.5">
              <p className="text-sm text-muted-foreground font-medium">FX pair categories</p>
              <div className="flex flex-wrap gap-1.5">
                {FX_CATEGORY_OPTIONS.map(cat => {
                  const selected = fxCategories.includes(cat.value);
                  return (
                    <button
                      key={cat.value}
                      onClick={() => toggleFxCategory(cat.value)}
                      className={cn(
                        "px-2 py-1 rounded-md text-sm font-medium transition-all border",
                        selected
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {selected && <Check className="h-2.5 w-2.5 mr-0.5 inline" />}
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-filters for Crypto */}
          {assetClasses.includes("crypto") && (
            <div className="ml-2 pl-3 border-l-2 border-primary/20 space-y-1.5">
              <p className="text-sm text-muted-foreground font-medium">Crypto categories</p>
              <div className="flex flex-wrap gap-1.5">
                {CRYPTO_CATEGORY_OPTIONS.map(cat => {
                  const selected = cryptoCategories.includes(cat.value);
                  return (
                    <button
                      key={cat.value}
                      onClick={() => toggleCryptoCategory(cat.value)}
                      className={cn(
                        "px-2 py-1 rounded-md text-sm font-medium transition-all border",
                        selected
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {selected && <Check className="h-2.5 w-2.5 mr-0.5 inline" />}
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

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

        {/* ── Section 5: Trading Window & Timezone ── */}
        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">When should Copilot scan for trades?</h4>
          
          {/* Timezone selector */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Timezone</span>
            </div>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map(tz => (
                  <SelectItem key={tz.value} value={tz.value} className="text-xs">
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Per-asset-class schedules (when asset classes are selected) */}
          {assetClasses.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Configure trading hours per asset class. Crypto and FX can trade 24/7.</p>
              {assetClasses.map(ac => {
                const schedule = tradingSchedules[ac] || (ALWAYS_AVAILABLE_ASSETS.has(ac) ? DEFAULT_247_SCHEDULE : DEFAULT_SCHEDULE);
                const acLabel = ASSET_CLASS_OPTIONS.find(o => o.value === ac)?.label || ac;
                return (
                  <div key={ac} className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-semibold text-foreground">{acLabel}</h5>
                      {ALWAYS_AVAILABLE_ASSETS.has(ac) && (
                        <button
                          onClick={() => updateSchedule(ac, {
                            is_247: !schedule.is_247,
                            ...(schedule.is_247 ? { days: [1, 2, 3, 4, 5], start: "00:00", end: "23:59" } : { days: [0, 1, 2, 3, 4, 5, 6], start: null, end: null }),
                          })}
                          className={cn(
                            "px-2 py-0.5 rounded-full text-sm font-semibold transition-all border",
                            schedule.is_247
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted/40 border-border/50 text-muted-foreground"
                          )}
                        >
                          {schedule.is_247 ? "24/7 ON" : "24/7 OFF"}
                        </button>
                      )}
                    </div>

                    {/* Day of week selector */}
                    <div className="space-y-1">
                      <span className="text-sm text-muted-foreground">Trading days</span>
                      <div className="flex gap-1">
                        {DAYS_OF_WEEK.map(day => {
                          const active = schedule.days.includes(day.value);
                          return (
                            <button
                              key={day.value}
                              onClick={() => toggleScheduleDay(ac, day.value)}
                              className={cn(
                                "h-7 w-7 rounded-md text-sm font-semibold transition-all border",
                                active
                                  ? "bg-primary/15 border-primary/40 text-primary"
                                  : "bg-muted/30 border-border/40 text-muted-foreground hover:text-foreground"
                              )}
                              title={day.label}
                            >
                              {day.label.charAt(0)}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => {
                            const allDays = [0, 1, 2, 3, 4, 5, 6];
                            const weekdays = [1, 2, 3, 4, 5];
                            const isAll = schedule.days.length === 7;
                            updateSchedule(ac, { days: isAll ? weekdays : allDays });
                          }}
                          className="ml-1 px-1.5 h-7 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border/40"
                        >
                          {schedule.days.length === 7 ? "Weekdays" : "All"}
                        </button>
                      </div>
                    </div>

                    {/* Time window (hidden when 24/7) */}
                    {!schedule.is_247 && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">Start</label>
                          <input
                            type="time"
                            value={schedule.start || "09:30"}
                            onChange={e => updateSchedule(ac, { start: e.target.value })}
                            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">End</label>
                          <input
                            type="time"
                            value={schedule.end || "16:00"}
                            onChange={e => updateSchedule(ac, { end: e.target.value })}
                            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Legacy global window when no asset classes selected */
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Copilot only enters trades during this window. All open trades close at the end.</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={is24hTrading}
                  onChange={e => {
                    setIs24hTrading(e.target.checked);
                    if (e.target.checked) {
                      setWindowStart("00:00");
                      setWindowEnd("23:59");
                    }
                  }}
                  className="rounded border-input"
                />
                <span className="text-sm font-medium">24h trading window</span>
                <span className="text-xs text-muted-foreground">(trade all day)</span>
              </label>
              <div className={`grid grid-cols-2 gap-2 ${is24hTrading ? 'opacity-40 pointer-events-none' : ''}`}>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Start time</label>
                  <input
                    type="time"
                    value={windowStart}
                    onChange={e => setWindowStart(e.target.value)}
                    disabled={is24hTrading}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">End time</label>
                  <input
                    type="time"
                    value={windowEnd}
                    onChange={e => setWindowEnd(e.target.value)}
                    disabled={is24hTrading}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  />
                </div>
              </div>
              {!is24hTrading && (
                <p className="text-xs text-muted-foreground/70">
                  Trades opened during this window are automatically closed at {windowEnd} if still open
                </p>
              )}
            </div>
          )}
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

        {/* ── Section 7: Advanced Settings (Collapsible) ── */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 w-full py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors group">
              <Settings2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              Advanced settings
              {hasAdvancedSettings && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-sm font-semibold">
                  Active
                </span>
              )}
              <ChevronDown className={cn("h-4 w-4 ml-auto text-muted-foreground transition-transform", showAdvanced && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-5 pt-2">

            {/* ── 7a: Multi-Timeframe Alignment ── */}
            <div className="space-y-2 rounded-lg border border-border/50 bg-muted/20 p-3">
              <h5 className="text-xs font-semibold text-foreground">Multi-Timeframe Alignment</h5>
              <p className="text-sm text-muted-foreground">
                Require trend agreement across multiple timeframes before entering a trade.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {MTF_TIMEFRAME_OPTIONS.map(tf => {
                  const selected = mtfTimeframes.includes(tf.value);
                  return (
                    <button
                      key={tf.value}
                      onClick={() => toggleMtfTimeframe(tf.value)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-md text-xs font-medium transition-all border",
                        selected
                          ? "bg-primary/15 border-primary/40 text-primary"
                          : "bg-muted/40 border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      {selected && <Check className="h-3 w-3 mr-1 inline" />}
                      {tf.label}
                    </button>
                  );
                })}
              </div>
              {mtfTimeframes.length >= 2 && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">Min aligned:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setMtfMinAligned(Math.max(2, mtfMinAligned - 1))}
                      className="h-6 w-6 rounded border border-border/50 bg-muted/40 flex items-center justify-center text-xs hover:bg-muted"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-semibold text-foreground w-6 text-center">{mtfMinAligned}</span>
                    <button
                      onClick={() => setMtfMinAligned(Math.min(mtfTimeframes.length, mtfMinAligned + 1))}
                      className="h-6 w-6 rounded border border-border/50 bg-muted/40 flex items-center justify-center text-xs hover:bg-muted"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">of {mtfTimeframes.length} timeframes</span>
                </div>
              )}
              {mtfTimeframes.length === 1 && (
                <p className="text-sm text-muted-foreground/70">Select at least 2 timeframes for alignment checks</p>
              )}
            </div>

            {/* ── 7b: Agent Score Threshold ── */}
            <div className="space-y-2 rounded-lg border border-border/50 bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-semibold text-foreground">Agent Score Threshold</h5>
                <button
                  onClick={() => setAgentScoreEnabled(!agentScoreEnabled)}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-sm font-semibold transition-all border",
                    agentScoreEnabled
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-muted/40 border-border/50 text-muted-foreground"
                  )}
                >
                  {agentScoreEnabled ? "ON" : "OFF"}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Only paper-trade setups that pass the 4-agent scoring system with a minimum composite score.
              </p>
              {agentScoreEnabled && (
                <div className="space-y-1">
                  <Slider
                    value={[minAgentScore]}
                    onValueChange={([v]) => setMinAgentScore(v)}
                    min={40}
                    max={95}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>40 (Watch)</span>
                    <span className="font-semibold text-foreground">{minAgentScore}</span>
                    <span>95 (Elite)</span>
                  </div>
                  <p className="text-sm text-muted-foreground/70">
                    {minAgentScore >= 70 ? "TAKE signals only — highest conviction" : minAgentScore >= 50 ? "TAKE + WATCH signals" : "Most signals will pass"}
                  </p>
                </div>
              )}
            </div>

            {/* ── 7c: Trend Context Filter ── */}
            <div className="space-y-2 rounded-lg border border-border/50 bg-muted/20 p-3">
              <h5 className="text-xs font-semibold text-foreground">Trend Context</h5>
              <p className="text-sm text-muted-foreground">
                Filter setups by their alignment with the prevailing trend direction.
              </p>
              <div className="flex gap-1.5">
                {TREND_CONTEXT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTrendContext(opt.value)}
                    className={cn(
                      "flex-1 py-2 rounded-md text-xs font-medium transition-all border text-center",
                      trendContext === opt.value
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "bg-muted/40 border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                    )}
                  >
                    <div>{opt.label}</div>
                    <div className="text-sm opacity-60 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── 7d: Confluence Requirements ── */}
            <div className="space-y-2 rounded-lg border border-border/50 bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-semibold text-foreground">Confluence Score</h5>
                <button
                  onClick={() => setConfluenceEnabled(!confluenceEnabled)}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-sm font-semibold transition-all border",
                    confluenceEnabled
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-muted/40 border-border/50 text-muted-foreground"
                  )}
                >
                  {confluenceEnabled ? "ON" : "OFF"}
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Require minimum confluence from support/resistance, divergence, and volume confirmation.
              </p>
              {confluenceEnabled && (
                <div className="space-y-1">
                  <Slider
                    value={[minConfluence]}
                    onValueChange={([v]) => setMinConfluence(v)}
                    min={30}
                    max={90}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>30%</span>
                    <span className="font-semibold text-foreground">{minConfluence}%</span>
                    <span>90%</span>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

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
