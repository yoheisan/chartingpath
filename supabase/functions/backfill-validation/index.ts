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
  batch_size?: number;     // Default 15 (reduced from 25 to prevent timeouts)
  offset?: number;         // For pagination
  pattern_name?: string;   // Optional filter
  symbol?: string;         // Optional filter
  timeframe?: string;      // Optional filter
  dry_run?: boolean;       // Preview without updating
}

// Circuit breaker: track consecutive failures to skip invocations when downstream is unhealthy
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;
const CIRCUIT_RESET_MS = 5 * 60 * 1000; // 5 minutes
let circuitOpenedAt = 0;

function isCircuitOpen(): boolean {
  if (consecutiveFailures < MAX_CONSECUTIVE_FAILURES) return false;
  // Auto-reset after cooldown
  if (Date.now() - circuitOpenedAt > CIRCUIT_RESET_MS) {
    consecutiveFailures = 0;
    return false;
  }
  return true;
}

function recordSuccess() { consecutiveFailures = 0; }
function recordFailure() {
  consecutiveFailures++;
  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    circuitOpenedAt = Date.now();
  }
}

// Retry helper with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, baseDelayMs = 500): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      recordSuccess();
      return result;
    } catch (err: any) {
      lastError = err;
      const isTimeout = err?.message?.includes('statement timeout') || err?.code === '57014';
      if (!isTimeout || attempt === maxRetries) {
        recordFailure();
        throw err;
      }
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(`[backfill-validation] Attempt ${attempt + 1} timed out, retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Circuit breaker check
  if (isCircuitOpen()) {
    console.warn(`[backfill-validation] Circuit breaker OPEN (${consecutiveFailures} consecutive failures). Skipping.`);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Circuit breaker open - too many consecutive failures",
        retry_after_seconds: Math.ceil((CIRCUIT_RESET_MS - (Date.now() - circuitOpenedAt)) / 1000),
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      batch_size = 15, // Reduced from 25 to prevent timeouts
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
    //    Use a simpler filter to avoid complex OR scans
    // ============================================
    const fetchPatterns = async () => {
      let query = supabase
        .from("historical_pattern_occurrences")
        .select("id, pattern_name, direction, entry_price, stop_loss_price, take_profit_price, symbol, timeframe, bars, quality_score, trend_alignment, validation_status, validation_layers_passed")
        .or("validation_status.eq.pending,validation_status.is.null")
        .order("created_at", { ascending: true })
        .range(offset, offset + batch_size - 1);

      if (pattern_name) query = query.eq("pattern_name", pattern_name);
      if (symbol) query = query.eq("symbol", symbol);
      if (timeframe) query = query.eq("timeframe", timeframe);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    };

    const patterns = await withRetry(fetchPatterns);

    if (!patterns || patterns.length === 0) {
      recordSuccess();
      return new Response(
        JSON.stringify({
          success: true,
          message: "No unvalidated patterns in this batch",
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

    // Invoke Layer 2 with retry
    const invokeValidation = async () => {
      const { data, error } = await supabase.functions.invoke("validate-pattern-context", {
        body: { detections },
      });
      if (error) throw error;
      return data;
    };

    const l2Result = await withRetry(invokeValidation, 1, 1000);
    const summary = l2Result?.summary || {};

    const result = {
      success: true,
      batch_processed: patterns.length,
      offset,
      next_offset: offset + batch_size,
      l2_summary: summary,
    };

    console.info(`[backfill-validation] Batch complete:`, result);
    recordSuccess();

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    const isTimeout = msg.includes('statement timeout') || msg.includes('57014');
    
    recordFailure();
    console.error(`[backfill-validation] Error (failures: ${consecutiveFailures}):`, msg);
    
    return new Response(
      JSON.stringify({ 
        error: msg, 
        is_timeout: isTimeout,
        consecutive_failures: consecutiveFailures,
        circuit_open: isCircuitOpen(),
      }),
      { status: isTimeout ? 504 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
