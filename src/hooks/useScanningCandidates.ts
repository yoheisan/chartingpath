import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { MasterPlan } from "./useMasterPlan";

export interface ScanningCandidate {
  id: string;
  ticker: string;
  pattern: string;
  timeframe: string;
  direction: string | null;
  score: number | null;
  qualityGrade: string | null; // A/B/C/D/F from pattern quality
  verdict: string | null; // TAKE/WATCH/SKIP from agent scoring
  gate: string; // aligned | partial | conflict
  reason: string;
  detectedAt: string;
}

export function useScanningCandidates(plan: MasterPlan | null) {
  const [candidates, setCandidates] = useState<ScanningCandidate[]>([]);
  const [totalScanned, setTotalScanned] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lastScanAt, setLastScanAt] = useState<Date | null>(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch active live detections
      let query = supabase
        .from("live_pattern_detections" as any)
        .select("id, instrument, pattern_name, timeframe, direction, current_price, asset_type, first_detected_at, status, quality_score")
        .eq("status", "active")
        .order("first_detected_at", { ascending: false })
        .limit(50);

      const { data: detections, error: detErr } = await query;
      if (detErr) {
        console.error("[useScanningCandidates] query error:", detErr);
      }
      if (detErr || !detections) {
        setCandidates([]);
        setLoading(false);
        return;
      }

      const allDetections = detections as any[];
      setTotalScanned(allDetections.length);

      // 2. Filter by plan's instrument universe (only if plan exists)
      const planAssetClasses = plan?.asset_classes ?? [];
      const assetTypeMap: Record<string, string> = {
        stock: "stocks", equity: "stocks", fx: "forex", forex: "forex",
        crypto: "crypto", commodity: "commodities", index: "indices", etf: "etfs",
      };

      let filtered = allDetections;
      if (plan && planAssetClasses.length > 0) {
        filtered = allDetections.filter((d: any) => {
          if (!d.asset_type) return true;
          const mapped = assetTypeMap[d.asset_type.toLowerCase()] || d.asset_type.toLowerCase();
          return planAssetClasses.includes(mapped);
        });
      }

      // 3. Filter by direction (only if plan exists)
      if (plan?.trend_direction && plan.trend_direction !== "both") {
        filtered = filtered.filter((d: any) => {
          if (!d.direction) return true;
          const dir = d.direction.toLowerCase();
          if (plan.trend_direction === "long_only" && dir === "short") return false;
          if (plan.trend_direction === "short_only" && dir === "long") return false;
          return true;
        });
      }

      // 4. Get agent scores for these instruments
      const instruments = [...new Set(filtered.map((d: any) => d.instrument))];
      let scoreMap: Record<string, number> = {};

      if (instruments.length > 0) {
        const { data: scores } = await supabase
          .from("agent_scores" as any)
          .select("instrument, analyst_raw, risk_raw, timing_raw, portfolio_raw")
          .in("instrument", instruments)
          .order("scored_at", { ascending: false });

        if (scores) {
          // Take latest score per instrument
          for (const s of scores as any[]) {
            if (scoreMap[s.instrument] != null) continue;
            const composite =
              (s.analyst_raw || 0) * 0.35 +
              (s.risk_raw || 0) * 0.25 +
              (s.timing_raw || 0) * 0.2 +
              (s.portfolio_raw || 0) * 0.2;
            scoreMap[s.instrument] = Math.round(composite * 100) / 100;
          }
        }
      }

      // 5. Get latest gate evaluations for these instruments + plan
      let gateMap: Record<string, { result: string; reason: string }> = {};
      if (instruments.length > 0 && plan?.id) {
        const { data: gates } = await supabase
          .from("gate_evaluations" as any)
          .select("ticker, gate_result, gate_reason")
          .eq("master_plan_id", plan.id)
          .in("ticker", instruments)
          .order("created_at", { ascending: false });

        if (gates) {
          for (const g of gates as any[]) {
            if (gateMap[g.ticker]) continue;
            gateMap[g.ticker] = { result: g.gate_result, reason: g.gate_reason || "" };
          }
        }
      }

      // 6. Compute gate inline for instruments without a gate evaluation
      const preferred = plan?.preferred_patterns ?? [];

      const result: ScanningCandidate[] = filtered.slice(0, 10).map((d: any) => {
        const score = scoreMap[d.instrument] ?? null;
        let gate = gateMap[d.instrument]?.result ?? "partial";
        let reason = gateMap[d.instrument]?.reason ?? "";

        // If no gate evaluation exists, compute inline
        if (!gateMap[d.instrument]) {
          const reasons: string[] = [];

          // Check preferred patterns
          if (preferred.length > 0 && d.pattern_name) {
            const setupLower = d.pattern_name.toLowerCase();
            const isPreferred = preferred.some(
              (p: string) => setupLower.includes(p.toLowerCase()) || p.toLowerCase().includes(setupLower)
            );
            if (!isPreferred) {
              reasons.push(`${d.pattern_name} not in preferred patterns`);
            }
          }

          // Score-based gate (scores are 0–1 scale)
          if (score != null) {
            if (score >= 0.70) gate = "aligned";
            else if (score >= 0.40) gate = "partial";
            else gate = "conflict";
          }

          if (reasons.length > 0) {
            gate = gate === "aligned" ? "partial" : gate;
            reason = reasons.join(". ");
          } else {
            reason = gate === "aligned"
              ? `${d.instrument} aligns with plan`
              : `${d.instrument} partially matches`;
          }
        }

        // Derive verdict from composite score (0–1 scale)
        // Quality grade acts as a cap: C/D/F grades cannot be TAKE
        const qualityGrade = d.quality_score || null;
        let verdict: string | null = null;
        if (score != null) {
          if (score >= 0.70) verdict = 'TAKE';
          else if (score >= 0.50) verdict = 'WATCH';
          else verdict = 'SKIP';
        }
        // Cap verdict if pattern quality is poor
        if (verdict === 'TAKE' && qualityGrade && ['C', 'D', 'F'].includes(qualityGrade)) {
          verdict = 'WATCH';
        }
        // Cap verdict if gate is conflict
        if (verdict === 'TAKE' && gate === 'conflict') {
          verdict = 'WATCH';
        }

        return {
          id: d.id,
          ticker: d.instrument,
          pattern: d.pattern_name || "Unknown",
          timeframe: d.timeframe || "",
          direction: d.direction,
          score,
          qualityGrade: d.quality_score || null,
          verdict,
          gate,
          reason,
          detectedAt: d.first_detected_at,
        };
      });

      setCandidates(result);
      setLastScanAt(new Date());
    } catch (err) {
      console.error("[useScanningCandidates] error:", err);
    } finally {
      setLoading(false);
    }
  }, [plan?.id, plan?.asset_classes, plan?.trend_direction, plan?.preferred_patterns]);

  // Poll every 60s
  useEffect(() => {
    fetchCandidates();
    const interval = setInterval(fetchCandidates, 60_000);
    return () => clearInterval(interval);
  }, [fetchCandidates]);

  // Realtime subscription for new detections
  useEffect(() => {
    const channel = supabase
      .channel("scanning-detections")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_pattern_detections" },
        () => { fetchCandidates(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchCandidates]);

  return { candidates, totalScanned, loading, lastScanAt, refresh: fetchCandidates };
}
