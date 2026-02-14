import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================
// BACKFILL VALIDATION
// Runs existing historical patterns through
// Layer 2 (Context Validator) + Layer 3 (MTF Confluence)
// Processes in batches to avoid timeouts
// ============================================

interface BackfillRequest {
  batch_size?: number;     // Default 25
  offset?: number;         // For pagination
  pattern_name?: string;   // Optional filter
  symbol?: string;         // Optional filter
  timeframe?: string;      // Optional filter
  dry_run?: boolean;       // Preview without updating
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      batch_size = 25,
      offset = 0,
      pattern_name,
      symbol,
      timeframe,
      dry_run = false,
    } = body as BackfillRequest;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ============================================
    // 1. Fetch unvalidated historical patterns
    // ============================================
    let query = supabase
      .from("historical_pattern_occurrences")
      .select("id, pattern_name, direction, entry_price, stop_loss_price, take_profit_price, symbol, timeframe, bars, quality_score, trend_alignment, validation_status, validation_layers_passed")
      .order("created_at", { ascending: true })
      .range(offset, offset + batch_size - 1);

    // Only fetch patterns that haven't completed full validation
    // Either no validation at all, or missing layers
    query = query.or("validation_status.eq.pending,validation_status.is.null,validation_layers_passed.is.null");

    if (pattern_name) query = query.eq("pattern_name", pattern_name);
    if (symbol) query = query.eq("symbol", symbol);
    if (timeframe) query = query.eq("timeframe", timeframe);

    const { data: patterns, error: fetchError } = await query;

    if (fetchError) {
      console.error("[backfill-validation] Fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch patterns", detail: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!patterns || patterns.length === 0) {
      // Check total remaining
      const { count } = await supabase
        .from("historical_pattern_occurrences")
        .select("id", { count: "exact", head: true })
        .or("validation_status.eq.pending,validation_status.is.null,validation_layers_passed.is.null");

      return new Response(
        JSON.stringify({
          success: true,
          message: "No unvalidated patterns in this batch",
          total_remaining: count || 0,
          offset,
          batch_size,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.info(`[backfill-validation] Processing batch of ${patterns.length} patterns (offset: ${offset})`);

    // ============================================
    // 2. Send batch through Layer 2 (Context Validator)
    // ============================================
    const detections = patterns.map((p: any) => ({
      detection_id: p.id,
      detection_source: "historical" as const,
      pattern_name: p.pattern_name,
      direction: p.direction,
      entry_price: p.entry_price,
      stop_loss_price: p.stop_loss_price,
      take_profit_price: p.take_profit_price,
      symbol: p.symbol,
      timeframe: p.timeframe,
      bars: Array.isArray(p.bars) ? p.bars : [],
      quality_score: p.quality_score,
      trend_alignment: p.trend_alignment,
    }));

    if (dry_run) {
      return new Response(
        JSON.stringify({
          success: true,
          dry_run: true,
          batch_count: detections.length,
          offset,
          next_offset: offset + batch_size,
          sample_ids: detections.slice(0, 5).map((d: any) => d.detection_id),
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Invoke Layer 2 — which will chain to Layer 3 for confirmed patterns
    const { data: l2Result, error: l2Error } = await supabase.functions.invoke("validate-pattern-context", {
      body: { detections },
    });

    if (l2Error) {
      console.error("[backfill-validation] Layer 2 invoke error:", l2Error);
      return new Response(
        JSON.stringify({ error: "Layer 2 validation failed", detail: l2Error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const summary = l2Result?.summary || {};

    // ============================================
    // 3. Check how many remain
    // ============================================
    const { count: remaining } = await supabase
      .from("historical_pattern_occurrences")
      .select("id", { count: "exact", head: true })
      .or("validation_status.eq.pending,validation_status.is.null,validation_layers_passed.is.null");

    const result = {
      success: true,
      batch_processed: patterns.length,
      offset,
      next_offset: offset + batch_size,
      remaining: remaining || 0,
      has_more: (remaining || 0) > 0,
      l2_summary: summary,
    };

    console.info(`[backfill-validation] Batch complete:`, result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[backfill-validation] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
