import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface GateEvaluation {
  gate_result: "aligned" | "partial" | "conflict";
  gate_reason: string;
  agent_score: number | null;
  verdict: string;
  evaluation_id: string | null;
}

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-gate`;

export function useGateEvaluation() {
  const [evaluations, setEvaluations] = useState<Record<string, GateEvaluation>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const cacheRef = useRef<Record<string, GateEvaluation>>({});
  // De-duplicates concurrent identical requests, which otherwise flood the
  // edge function and trigger 503 SUPABASE_EDGE_RUNTIME_SERVICE_DEGRADED.
  const inFlightRef = useRef<Record<string, Promise<GateEvaluation | null>>>({});

  const evaluate = useCallback(
    async (
      ticker: string,
      setup_type?: string,
      timeframe?: string,
      direction?: string,
      source?: string,
      asset_type?: string
    ): Promise<GateEvaluation | null> => {
      const cacheKey = `${ticker}-${setup_type}-${timeframe}-${direction}`;

      // Return cached if we have it
      if (cacheRef.current[cacheKey]) {
        return cacheRef.current[cacheKey];
      }
      if (inFlightRef.current[cacheKey]) {
        return inFlightRef.current[cacheKey];
      }

      setLoading((prev) => ({ ...prev, [cacheKey]: true }));

      const run = async (): Promise<GateEvaluation | null> => {
       try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          return null;
        }

        // Retry on transient edge-runtime errors (503/429) with backoff
        let resp: Response | null = null;
        for (let attempt = 0; attempt < 4; attempt++) {
          resp = await fetch(EDGE_FN_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ ticker, setup_type, timeframe, direction, source, asset_type }),
          });

          if (resp.ok) break;
          if (resp.status !== 503 && resp.status !== 429) break;
          await new Promise((r) => setTimeout(r, 800 * Math.pow(2, attempt) + Math.random() * 400));
        }

        if (!resp || !resp.ok) {
          if (resp && resp.status !== 503) console.error("Gate evaluation failed:", resp.status);
          return null;
        }

        const data = (await resp.json()) as GateEvaluation;
        cacheRef.current[cacheKey] = data;
        setEvaluations((prev) => ({ ...prev, [cacheKey]: data }));
        return data;
       } catch (err) {
        console.error("Gate evaluation error:", err);
        return null;
       } finally {
        setLoading((prev) => ({ ...prev, [cacheKey]: false }));
        delete inFlightRef.current[cacheKey];
       }
      };

      const promise = run();
      inFlightRef.current[cacheKey] = promise;
      return promise;
    },
    []
  );

  const evaluateBatch = useCallback(
    async (
      items: Array<{
        ticker: string;
        setup_type?: string;
        timeframe?: string;
        direction?: string;
        asset_type?: string;
      }>
    ) => {
      const batchSize = 2;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map((item) =>
            evaluate(item.ticker, item.setup_type, item.timeframe, item.direction, undefined, item.asset_type)
          )
        );
        if (i + batchSize < items.length) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    },
    [evaluate]
  );

  const getEvaluation = useCallback(
    (ticker: string, setup_type?: string, timeframe?: string, direction?: string) => {
      const cacheKey = `${ticker}-${setup_type}-${timeframe}-${direction}`;
      return evaluations[cacheKey] || cacheRef.current[cacheKey] || null;
    },
    [evaluations]
  );

  const isLoading = useCallback(
    (ticker: string, setup_type?: string, timeframe?: string, direction?: string) => {
      const cacheKey = `${ticker}-${setup_type}-${timeframe}-${direction}`;
      return loading[cacheKey] || false;
    },
    [loading]
  );

  return { evaluate, evaluateBatch, getEvaluation, isLoading, evaluations };
}
